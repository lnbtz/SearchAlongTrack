import { lastQueryHashStore, searchResultsCacheStore, polyAroundTrackStore } from './stores';
import { get } from 'svelte/store';
import type { OverpassJson } from 'overpass-ts';
import { overpass } from 'overpass-ts';

import { QueryBodies } from './osm-constants';

// Custom error class for Overpass API errors
export class OverpassError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public userMessage: string
	) {
		super(message);
		this.name = 'OverpassError';
	}
}

// Helper function to provide user-friendly error messages based on HTTP status codes
function getErrorMessageForStatus(status: number): string {
	switch (status) {
		case 429:
			return 'Too many requests. Please wait a moment and try again.';
		case 504:
			return 'The search is taking too long. Try searching a smaller area or simplify your query.';
		case 400:
			return 'Invalid search parameters. Please check your route and try again.';
		case 500:
			return 'The map data service is temporarily unavailable. Please try again later.';
		case 503:
			return 'The map data service is temporarily overloaded. Please try again in a few minutes.';
		default:
			return 'Unable to fetch map data. Please try again.';
	}
}

const queryHeader: string = `[out:json];
                            (`;
let queryBody: string = ``;
const queryFooter: string = `
                    );
                    out body;
                    >;
                    out skel qt;`;
let query: string;

// Return type for search operations
export type SearchResult =
	| {
			success: true;
			data: OverpassJson;
	  }
	| {
			success: false;
			error: OverpassError;
	  };

export async function searchAlongTrack(): Promise<SearchResult> {
	try {
		const polyBuildSuccess = buildPolyQueryBody();

		// Check if query body was built successfully
		if (!polyBuildSuccess || !queryBody.trim()) {
			return {
				success: false,
				error: new OverpassError(
					'No query body generated',
					400,
					'Invalid route data. Please check your route and try again.'
				)
			};
		}

		// optimize query to be as small as possible
		query = `${queryHeader}${queryBody}${queryFooter}`;
		console.log('Overpass query:', query);

		// check if query is already in cache
		const queryHash = await createQueryHash(query);
		const searchResultsCache: Map<string, OverpassJson> = get(searchResultsCacheStore);
		if (searchResultsCache.has(queryHash)) {
			console.log('Query already in cache');
			const cachedResponse: OverpassJson = searchResultsCache.get(queryHash) as OverpassJson;
			console.log('Cached response:', cachedResponse);
			lastQueryHashStore.set(queryHash);
			return { success: true, data: cachedResponse };
		}
		// inject test response here

		// const testResponse: OverpassJson = OverpassQueryResultDebug;
		// searchResultsCache.set(queryHash, testResponse);
		// searchResultsCacheStore.set(searchResultsCache);
		// lastQueryHashStore.set(queryHash);

		// execute query
		const response = await overpass(query);

		// Check if response is ok
		if (!response.ok) {
			throw new OverpassError(
				`HTTP ${response.status}: ${response.statusText}`,
				response.status,
				getErrorMessageForStatus(response.status)
			);
		}

		const json = (await response.json()) as OverpassJson;

		// Validate response structure
		if (!json || typeof json !== 'object') {
			throw new OverpassError(
				'Invalid response format',
				500,
				'The server returned an invalid response. Please try again.'
			);
		}

		// cache the response
		searchResultsCache.set(queryHash, json);
		searchResultsCacheStore.set(searchResultsCache);
		// update the last search query store
		// this triggers the UI to update
		lastQueryHashStore.set(queryHash);
		console.log('Overpass JSON:', json);

		return { success: true, data: json };
	} catch (error) {
		console.error('Overpass query failed:', error);

		if (error instanceof OverpassError) {
			return { success: false, error: error };
		}

		// Handle network errors, timeouts, etc.
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return {
				success: false,
				error: new OverpassError(
					'Network error',
					0,
					'Unable to connect to the map data service. Please check your internet connection and try again.'
				)
			};
		}

		// Handle JSON parsing errors
		if (error instanceof SyntaxError) {
			return {
				success: false,
				error: new OverpassError(
					'Parse error',
					500,
					'The server returned invalid data. Please try again.'
				)
			};
		}

		// Generic error fallback
		return {
			success: false,
			error: new OverpassError(
				'Unknown error',
				500,
				'An unexpected error occurred. Please try again.'
			)
		};
	}
}

function buildPolyQueryBody(): boolean {
	queryBody = ''; // reset query body
	const polyAroundTrack = get(polyAroundTrackStore);
	if (!polyAroundTrack || polyAroundTrack.geometry.coordinates.length === 0) {
		console.error('No polygon around selected track');
		return false;
	}

	try {
		const coords = polyAroundTrack.geometry.coordinates[0]; // Array of [lon, lat]

		// Validate coordinates
		if (!Array.isArray(coords) || coords.length < 3) {
			console.error('Invalid polygon coordinates - need at least 3 points');
			return false;
		}

		// Validate each coordinate pair
		const validCoords = coords.every(
			(coord) =>
				Array.isArray(coord) &&
				coord.length >= 2 &&
				typeof coord[0] === 'number' &&
				typeof coord[1] === 'number' &&
				coord[0] >= -180 &&
				coord[0] <= 180 && // longitude bounds
				coord[1] >= -90 &&
				coord[1] <= 90 // latitude bounds
		);

		if (!validCoords) {
			console.error('Invalid coordinate values found in polygon');
			return false;
		}

		const polyString = coords.map(([lon, lat]) => `${lat} ${lon}`).join(' ');
		QueryBodies.forEach((queryBodyPart) => {
			queryBody += `
                    nwr${queryBodyPart.query}(poly:"${polyString}");
                    `;
		});

		return true;
	} catch (error) {
		console.error('Error building polygon query:', error);
		return false;
	}
}

async function createQueryHash(query: string): Promise<string> {
	let hash = 0,
		i,
		chr;
	if (query.length === 0) return hash.toString();
	for (i = 0; i < query.length; i++) {
		chr = query.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash.toString();
}
