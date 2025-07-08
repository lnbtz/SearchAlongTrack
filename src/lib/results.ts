import {
    searchResultsCacheStore,
    lastQueryHashStore,
    tableDataStore,
    simplifiedGpxTrackStore,
} from '$lib/stores';
import { get } from 'svelte/store';
// import { OverpassJsonExample } from '$lib/osm-constants';



import type { OverpassNode, OverpassWay, OverpassRelation, OverpassArea, OverpassTimeline, OverpassCount, OverpassJson } from 'overpass-ts';
import type { LineString } from 'geojson';
import { nearestPointOnLine } from '@turf/turf';
import { OSMCategoriesMap, SEARCH_CORRIDOR_RADIUS } from './osm-constants';



export function buildTableData() {
    const searchResultsCache = get(searchResultsCacheStore);
    const lastQueryHash = get(lastQueryHashStore);
    const queryResults = searchResultsCache.get(lastQueryHash);
    const selectedRadius = SEARCH_CORRIDOR_RADIUS;
    const selectedStartRange = 0;
    const simplifiedGpxTrack: LineString = get(simplifiedGpxTrackStore) as LineString;
    const rows: TableRow[] = [];
    // build location map for faster lookup where key is the element id and value is the lat/lon
    const locationMap = new Map<number, { lat: number; lon: number }>();
    if (queryResults) {
        buildLocationMap(queryResults, locationMap);
        console.time('Building table rows from cache');
        queryResults.elements.forEach((element) => {
            buildTableRow(element, rows, locationMap, selectedRadius, selectedStartRange, simplifiedGpxTrack);
        });
        console.timeEnd('Building table rows from cache');
        console.log('Table rows built from cache:', rows.length);
        tableDataStore.set(rows);
        return;
    }
}

export interface TableRow {
    type: string; // e.g., 'vending_machine', 'supermarket', 'restaurant'
    category?: string; // e.g., 'vending_machine', 'shop', 'amenity', 'tourism'
    description?: string; // e.g., 'A vending machine for snacks'
    name?: string; // e.g., 'Imkerei Automat'
    website?: string;
    phoneNumber?: string;
    location: { lat: number, lon: number }; // e.g., { lat: 53.6389852, lon: 10.0135567 }
    openingHours?: string; // e.g., 'A vending machine for snacks'
    distanceFromRoute: number; // e.g., 150 meters off route
    distanceOnRoute: number; // e.g., 500 meters along the route
    indexOfRoute?: number; // e.g., 'index of Waypoint on the route'
}


function buildTableRow(element: OverpassNode | OverpassWay | OverpassRelation | OverpassArea | OverpassTimeline | OverpassCount, rows: TableRow[], locationMap: Map<number, { lat: number; lon: number; }>, selectedRadius: number, selectedStartRange: number, lineString: LineString) {
    let type: string;
    let category: string | undefined;
    let description: string | undefined;
    let name: string | undefined;
    let website: string | undefined;
    let phoneNumber: string | undefined;
    let openingHours: string | undefined;


    if (element.tags && (element.type === 'node' || element.type === 'way' || element.type === 'relation')) {
        type = element.tags.amenity || element.tags.shop || element.tags.tourism;
        category = Array.from(OSMCategoriesMap.keys()).find(key => OSMCategoriesMap.get(key)?.includes(type));
        description = element.tags.description;
        name = element.tags.name;
        website = element.tags.website;
        phoneNumber = element.tags.phone;
        openingHours = element.tags.opening_hours;
    } else {
        return; // Skip if no tags or not a node/way/relation
    }
    const location = locationMap.get(element.id);
    if (!location) {
        return; // Skip if location is not found
    }

    const result = nearestPointOnLine(lineString, [location.lon, location.lat], { units: 'meters' });

    const distanceFromRoute = Number(result.properties.dist.toFixed(0));
    const distanceOnRoute = Number((result.properties.location / 1000 + selectedStartRange).toFixed(2));
    const indexOfRoute = result.properties.index;

    const tableRow: TableRow = {
        type,
        category,
        description,
        name,
        website,
        phoneNumber,
        location: { lat: location.lat, lon: location.lon },
        openingHours,
        distanceFromRoute,
        distanceOnRoute,
        indexOfRoute
    };
    rows.push(tableRow);
}

function buildLocationMap(queryResults: OverpassJson | undefined, locationMap: Map<number, { lat: number; lon: number; }>) {
    queryResults?.elements.forEach((element) => {
        if (element.type === 'node') {
            locationMap.set(element.id, { lat: element.lat, lon: element.lon });
        } else if (element.type === 'way' && element.nodes) {
            const firstNodeId = element.nodes[0];
            const firstNode = locationMap.get(firstNodeId);
            if (firstNode) {
                locationMap.set(element.id, { lat: firstNode.lat, lon: firstNode.lon });
            }
        } else if (element.type === 'relation') {
            const firstMemberId = element.members[0].ref;
            const firstMember = locationMap.get(firstMemberId);
            if (firstMember) {
                locationMap.set(element.id, { lat: firstMember.lat, lon: firstMember.lon });
            }
        }
    });
}