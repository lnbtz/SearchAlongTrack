
import { lastQueryHashStore, searchResultsCacheStore, polyAroundTrackStore } from './stores';
import { get } from 'svelte/store';
import type { OverpassJson } from "overpass-ts";
import { overpass } from "overpass-ts";

import { QueryBodies } from './osm-constants';


const queryHeader: string = `[out:json];
                            (`;
let queryBody: string = ``;
const queryFooter: string = `
                    );
                    out body;
                    >;
                    out skel qt;`;
let query: string;

export async function searchAlongTrack() {
    buildPolyQueryBody();
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
        return;
    }
    // inject test response here
    // if (testingQuery()) {
    //     const testResponse: OverpassJson = OverpassAllButVending;
    //     searchResultsCache.set(queryHash, testResponse);
    //     searchResultsCacheStore.set(searchResultsCache);
    //     lastQueryHashStore.set(queryHash);
    // }
    // for testing purposes, use the test response instead of the actual query

    // execute query
    await overpass(query)
        .then((response) => response.json())
        .then((json) => {
            json = json as OverpassJson;
            // cache the response
            searchResultsCache.set(queryHash, json);
            searchResultsCacheStore.set(searchResultsCache);
            // update the last search query store
            // this triggers the UI to update
            lastQueryHashStore.set(queryHash);
            console.log('Overpass JSON:', json);
        });
}

function buildPolyQueryBody() {
    queryBody = ''; // reset query body
    const polyAroundTrack = get(polyAroundTrackStore);
    if (!polyAroundTrack || polyAroundTrack.geometry.coordinates.length === 0) {
        console.error('No polygon around selected track');
        return;
    }
    const coords = polyAroundTrack.geometry.coordinates[0]; // Array of [lon, lat]
    const polyString = coords.map(([lon, lat]) => `${lat} ${lon}`).join(' ');
    QueryBodies.forEach((queryBodyPart) => {
        queryBody += `
                nwr${queryBodyPart.query}(poly:"${polyString}");
                `;
    });
}


async function createQueryHash(query: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(query);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
// function testingQuery() {
//     return true;
// }

