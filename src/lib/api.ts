
import { lastQueryHashStore, searchResultsCacheStore, bboxAroundSelectedTrackStore, polyAroundTrackStore } from './stores';
import { get } from 'svelte/store';
import type { OverpassJson } from "overpass-ts";
import { overpass } from "overpass-ts";

import { OverpassAllCategories2, QueryBodies } from './osm-constants';




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
        // do something with the cached response
        // this updates the last search query store and triggers the UI to update
        lastQueryHashStore.set(queryHash);
        return;
    }
    // inject test response here
    if (testingQuery()) {
        const testResponse: OverpassJson = OverpassAllCategories2;
        searchResultsCache.set(queryHash, testResponse);
        searchResultsCacheStore.set(searchResultsCache);
        lastQueryHashStore.set(queryHash);
    }
    // for testing purposes, use the test response instead of the actual query

    // execute query
    // overpass(query)
    //     .then((response) => response.json())
    //     .then((json) => {
    //         json = json as OverpassJson;
    //         // cache the response
    //         searchResultsCache.set(queryHash, json);
    //         searchResultsCacheStore.set(searchResultsCache);
    //         // update the last search query store
    //         // this triggers the UI to update
    //         lastQueryHashStore.set(queryHash);
    //         console.log('Overpass JSON:', json);
    //     })

}


function buildBboxQueryBody() {
    const bbox = get(bboxAroundSelectedTrackStore);
    console.log('Bounding box:', bbox);
    if (!bbox || bbox.features.length === 0 || bbox.features[0].geometry.type !== 'Point'
        || bbox.features[2].geometry.type !== 'Point' || bbox.features.length < 4
    ) {
        console.error('No bounding box around selected track');
        return;
    }
    const minLat = bbox.features[0].geometry.coordinates[1];
    const minLon = bbox.features[0].geometry.coordinates[0];
    const maxLat = bbox.features[2].geometry.coordinates[1];
    const maxLon = bbox.features[2].geometry.coordinates[0];
    QueryBodies.forEach((queryBodyPart) => {
        queryBody += `
                nwr${queryBodyPart.query}(${minLat}, ${minLon}, ${maxLat}, ${maxLon});
                `;
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
function testingQuery() {
    return true;
}

