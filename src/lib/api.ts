
import { selectedCategoriesStore, selectedRadiusStore, selectedRangeTrackStore, selectedCoordinatesAlongTrackStore } from './stores';
import { get } from 'svelte/store';
import type { OverpassJson } from "overpass-ts";
import { overpass } from "overpass-ts";
import { getCoordinatesAlongSelectedTrack } from './util';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';



const searchResultsCache = new Map<string, OverpassJson>();
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
    const selectedCategories: string[] = get(selectedCategoriesStore);
    const selectedRangeTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(selectedRangeTrackStore);
    queryBody = ``;
    if (selectedCategories.length > 0 && selectedRangeTrack && selectedRangeTrack.features[0].geometry.type === 'LineString') {
        // calculate the start and end of the range in the coordinates
        // get coordinates every 'radius' meters within range
        getCoordinatesAlongSelectedTrack();
        const selectedCoordinates: number[][] = get(selectedCoordinatesAlongTrackStore);
        const radius: number = get(selectedRadiusStore);
        // build query for each category
        if (selectedCoordinates.length === 0) {
            console.error('No coordinates selected');
            return;
        }
        selectedCategories.forEach((category) => {
            let searchKey: string = `amenity`;
            let searchValue: string = `shelter`;
            switch (category) {
                case 'shelters':
                    searchKey = `amenity`;
                    searchValue = `shelter`;
                    break;
                case 'supermarkets':
                    // TODO add proper search key and value
                    searchKey = `amenity`;
                    searchValue = `supermarket`;
                    break;
            }
            // build query for each coordinate
            selectedCoordinates.forEach((coordinate) => {
                const lat: number = coordinate[1];
                const lon: number = coordinate[0];
                // build query
                queryBody += `
                        node["${searchKey}"="${searchValue}"](around:${radius}, ${lat}, ${lon});
                        way["${searchKey}"="${searchValue}"](around:${radius}, ${lat}, ${lon});
                        relation["${searchKey}"="${searchValue}"](around:${radius}, ${lat}, ${lon});`;
            });
        }
        );
        ;
        // optimize query to be as small as possible
        query = `${queryHeader}${queryBody}${queryFooter}`;
        // check if query is already in cache
        const queryHash = await createQueryHash(query);
        if (searchResultsCache.has(queryHash)) {
            console.log('Query already in cache');
            const cachedResponse: OverpassJson = searchResultsCache.get(queryHash) as OverpassJson;
            console.log('Cached response:', cachedResponse);
            return;
        }
        const startTime = performance.now();
        overpass(query)
            .then((response) => response.json())
            .then((json) => {
                json = json as OverpassJson;
                // cache the response
                searchResultsCache.set(queryHash, json);
                console.log('Overpass JSON:', json);
                const endTime = performance.now();
                const elapsedTime = endTime - startTime;
                console.log(`Query executed in ${elapsedTime} milliseconds`);
            })
    } else {
        console.log('No categories selected');
    }
    
}

async function createQueryHash(query: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(query);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

