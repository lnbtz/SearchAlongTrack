
import { selectedCategoriesStore, selectedRadiusStore, selectedRangeTrackStore, selectedCoordinatesAlongTrackStore, searchResultsCacheStore, bboxAroundSelectedTrackStore } from './stores';
import { get } from 'svelte/store';
import type { OverpassJson } from "overpass-ts";
import { overpass } from "overpass-ts";
import { bboxAroundSelectedTrack, getCoordinatesAlongSelectedTrack } from './util';
import { OSM } from './osm-constants';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';




const queryHeader: string = `[out:json];
                            (`;
let queryBody: string = ``;
let searchKey: string = '';
let searchValue: string = '';
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

        // choose bbox or coordinates



        selectedCategories.forEach((category) => {
            setKeyAndValue(category);
            // build query for each coordinate
            if (coordsSearch()) {
                getCoordinatesAlongSelectedTrack();
                buildCoordsQueryBody();
            } else {
                // if no coordinates selected, use bbox
                bboxAroundSelectedTrack();
                buildBboxQueryBody();
            }
        });

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
            return;
        }
        // execute the query
        const startTime = performance.now();
        overpass(query)
            .then((response) => response.json())
            .then((json) => {
                json = json as OverpassJson;
                // cache the response
                searchResultsCache.set(queryHash, json);
                searchResultsCacheStore.set(searchResultsCache);
                console.log('Overpass JSON:', json);
                const endTime = performance.now();
                const elapsedTime = endTime - startTime;
                console.log(`Query executed in ${elapsedTime} milliseconds`);
            })
    } else {
        console.log('No categories selected');
    }
}

function buildCoordsQueryBody() {
    const selectedCoordinates: number[][] = get(selectedCoordinatesAlongTrackStore);


    if (selectedCoordinates.length === 0) {
        console.error('No coordinates selected');
        return;
    }
    const radius: number = get(selectedRadiusStore);
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
    queryBody += `
                node["${searchKey}"="${searchValue}"](${minLat}, ${minLon}, ${maxLat}, ${maxLon});
                way["${searchKey}"="${searchValue}"](${minLat}, ${minLon}, ${maxLat}, ${maxLon});
                relation["${searchKey}"="${searchValue}"](${minLat}, ${minLon}, ${maxLat}, ${maxLon});`;
}

function setKeyAndValue(category: string) {
    switch (category) {
        case 'shelters':
            searchKey = OSM.key.AMENITY;
            searchValue = OSM.value.SHELTER;
            break;
        case 'supermarkets':
            // TODO add actual categories
            searchKey = OSM.key.AMENITY;
            searchValue = OSM.value.SUPERMARKET;
            break;
    }
    return { searchKey, searchValue };
}

async function createQueryHash(query: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(query);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function coordsSearch() {
    return false;
}