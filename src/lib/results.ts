import {
	searchResultsCacheStore,
	lastQueryHashStore,
	tableDataStore,
	simplifiedGpxTrackStore
} from '$lib/stores';
import { get } from 'svelte/store';
// import { OverpassJsonExample } from '$lib/osm-constants';

import type { OverpassNode, OverpassWay, OverpassRelation, OverpassJson } from 'overpass-ts';
import type { LineString } from 'geojson';
import { nearestPointOnLine } from '@turf/turf';
import { OSMCategoriesMap } from './osm-constants';

export async function buildTableData() {
	const searchResultsCache = get(searchResultsCacheStore);
	const lastQueryHash = get(lastQueryHashStore);
	const queryResults = searchResultsCache.get(lastQueryHash);
	const simplifiedGpxTrack: LineString = get(simplifiedGpxTrackStore) as LineString;
	const rows: TableRow[] = [];
	const locationMap = new Map<
		number,
		{ lat: number; lon: number; element: OverpassNode | OverpassWay | OverpassRelation }
	>();
	if (queryResults) {
		buildLocationMap(queryResults, locationMap);
		locationMap.forEach((element) => {
			buildTableRow(element, rows, simplifiedGpxTrack);
		});
		tableDataStore.set(rows);
		return;
	}
}

export function displayType(type: string) {
	switch (type) {
		case 'shelter':
			return 'Shelter';
		case 'cafe':
			return 'Cafe';
		case 'fuel':
			return 'Fuel';
		case 'supermarket':
			return 'Supermarket';
		case 'bakery':
			return 'Bakery';
		case 'vending_machine':
			return 'Vending Machine';
		case 'ice_cream':
			return 'Ice Cream';
		case 'kiosk':
			return 'Kiosk';
		case 'drinking_water':
			return 'Drinking Water';
		case 'toilets':
			return 'Toilets';
		case 'restaurant':
			return 'Restaurant';
		case 'camp_site':
			return 'Camp Site';
		case 'bicycle_repair_station':
			return 'Bicycle Repair Station';
		case 'bicycle':
			return 'Bike Shop';
		case 'hotel':
			return 'Hotel';
		case 'apartment':
			return 'Apartment';
		case 'alpine_hut':
			return 'Alpine Hut';
		case 'hostel':
			return 'Hostel';
		case 'motel':
			return 'Motel';
		case 'wilderness_hut':
			return 'Wilderness Hut';
		case 'guest_house':
			return 'Guest House';
		case 'fast_food':
			return 'Fast Food';
		default:
			return type.charAt(0).toUpperCase() + type.slice(1);
	}
}

export interface TableRow {
	type: string; // e.g., 'vending_machine', 'supermarket', 'restaurant'
	category?: string; // e.g., 'vending_machine', 'shop', 'amenity', 'tourism'
	description?: string; // e.g., 'A vending machine for snacks'
	name?: string; // e.g., 'Imkerei Automat'
	website?: string;
	phoneNumber?: string;
	location: { lat: number; lon: number }; // e.g., { lat: 53.6389852, lon: 10.0135567 }
	openingHours?: string; // e.g., 'A vending machine for snacks'
	distanceFromRoute: number; // e.g., 150 meters off route
	distanceOnRoute: number; // e.g., 500 meters along the route
	indexOfRoute?: number; // e.g., 'index of Waypoint on the route'
}

function buildTableRow(
	entry: { lat?: number; lon?: number; element?: OverpassNode | OverpassWay | OverpassRelation },
	rows: TableRow[],
	lineString: LineString
) {
	let type: string;
	let category: string | undefined;
	let description: string | undefined;
	let name: string | undefined;
	let website: string | undefined;
	let phoneNumber: string | undefined;
	let openingHours: string | undefined;

	const element = entry.element;

	if (!element || !entry.lat || !entry.lon) {
		return;
	}
	if (
		element.tags &&
		(element.type === 'node' || element.type === 'way' || element.type === 'relation')
	) {
		type = element.tags.amenity || element.tags.shop || element.tags.tourism;
		category = Array.from(OSMCategoriesMap.keys()).find((key) =>
			OSMCategoriesMap.get(key)?.includes(type)
		);
		description = element.tags.description;
		if (element.tags.vending && !description) {
			description = element.tags.vending
				.split(';')
				.map((s) => s.trim())
				.filter(Boolean)
				.map((s) => s.replace(/_/g, ' '))
				.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
				.join(', ');
		}
		name = element.tags.name;
		website = element.tags.website;
		phoneNumber = element.tags.phone;
		openingHours = element.tags.opening_hours;
	} else {
		return; // Skip if no tags or not a node/way/relation
	}
	const result = nearestPointOnLine(lineString, [entry.lon, entry.lat], { units: 'meters' });
	const distanceFromRoute = Math.ceil(result.properties.dist / 50) * 50;
	const distanceOnRoute = Number((result.properties.location / 1000).toFixed(2));
	const indexOfRoute = result.properties.index;

	const tableRow: TableRow = {
		type,
		category,
		description,
		name,
		website,
		phoneNumber,
		location: { lat: entry.lat, lon: entry.lon },
		openingHours,
		distanceFromRoute,
		distanceOnRoute,
		indexOfRoute
	};
	rows.push(tableRow);
}

function buildLocationMap(
	queryResults: OverpassJson | undefined,
	locationMap: Map<
		number,
		{ lat: number; lon: number; element: OverpassNode | OverpassWay | OverpassRelation }
	>
) {
	queryResults?.elements.forEach((element) => {
		if (element.type === 'node') {
			locationMap.set(element.id, {
				lat: element.lat,
				lon: element.lon,
				element: element as OverpassNode
			});
		}
	});
	queryResults?.elements.forEach((element) => {
		if (element.type === 'way' && element.nodes) {
			const firstNodeId = element.nodes[0];
			const firstNode = locationMap.get(firstNodeId);
			if (firstNode) {
				locationMap.set(element.id, {
					lat: firstNode.lat,
					lon: firstNode.lon,
					element: element as OverpassWay
				});
			}
		} else if (element.type === 'relation') {
			const firstMemberId = element.members[0].ref;
			const firstMember = locationMap.get(firstMemberId);
			if (firstMember) {
				locationMap.set(element.id, {
					lat: firstMember.lat,
					lon: firstMember.lon,
					element: element as OverpassRelation
				});
			}
		}
	});
}
