import {
    totalTrackLengthStore,
    gpxTrackStore,
    selectedStartRangeStore,
    selectedEndRangeStore,
    selectedRangeTrackStore,
    simplifiedGpxTrackStore,
    polyAroundTrackStore
} from "./stores";
import { get } from "svelte/store";
import type { FeatureCollection, GeoJsonProperties, Geometry, LineString } from "geojson";
import { lineSliceAlong, simplify, buffer } from '@turf/turf';
import { SEARCH_CORRIDOR_RADIUS } from "./osm-constants";

export function handleGpxTrack() {
    setTrackLengthStore();
    simplifyGpxTrack();
    polyAroundTrack();
}

export function centerOnCoords(map: maplibregl.Map | undefined, location: { lon: number; lat: number }) {
    if (map && location.lon !== undefined && location.lat !== undefined) {
        map.flyTo({
            center: [location.lon, location.lat],
            zoom: 14,
            speed: 1.2,
            curve: 1,
            easing(t) {
                return t;
            }
        });
    }
}

function setTrackLengthStore() {
    // calculate the length of the track in meters
    const gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(gpxTrackStore);
    if (!gpxTrack || gpxTrack.features[0].geometry.type !== 'LineString') {
        console.error('Invalid GPX track data');
        return;
    }
    const coordinates = gpxTrack.features[0].geometry.coordinates as number[][];
    let length = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        const lat1 = coordinates[i][1];
        const lon1 = coordinates[i][0];
        const lat2 = coordinates[i + 1][1];
        const lon2 = coordinates[i + 1][0];
        length += calculateDistanceBetweenPoints(lat1, lon1, lat2, lon2);
    }
    totalTrackLengthStore.set(length);
}

function calculateDistanceBetweenPoints(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;

    const dLat = toRadian(lat2 - lat1);
    const dLon = toRadian(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(toRadian(lat1)) * Math.cos(toRadian(lat2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

function toRadian(degree: number): number {
    return degree * Math.PI / 180;
}


export function calculateSelectedRangeTrackStore() {
    // calculate the the slice of the track based on the selected range and change the store
    const gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(gpxTrackStore);
    const startDist: number = get(selectedStartRangeStore);
    const endDist: number = get(selectedEndRangeStore);
    if (!gpxTrack || gpxTrack.features[0].geometry.type !== 'LineString') {
        console.error('Invalid GPX track data');
        return;
    }
    if (startDist < 0 || endDist < 0 || startDist > endDist) {
        console.error('Invalid selected range');
        return;
    }
    const line = gpxTrack.features[0].geometry as LineString;
    const sliced = lineSliceAlong(line, startDist, endDist, { units: 'kilometers' });
    const selectedRangeTrack: FeatureCollection<Geometry, GeoJsonProperties> = {
        type: 'FeatureCollection',
        features: [sliced]
    };
    selectedRangeTrackStore.set(selectedRangeTrack);
}

// export function getCoordinatesAlongSelectedTrack() {
//     const selectedRangeGpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(selectedRangeTrackStore);
//     const radius: number = get(selectedRadiusStore); // in meters, for example

//     if (!selectedRangeGpxTrack || selectedRangeGpxTrack.features[0].geometry.type !== 'LineString' || radius <= 0) {
//         return [];
//     }

//     const lineFeature = selectedRangeGpxTrack.features[0];
//     const lineString = lineFeature.geometry as LineString;
//     const lineLength = length(lineFeature, { units: 'meters' }); // total length in meters

//     const coords: number[][] = [];
//     for (let dist = 0; dist <= lineLength; dist += radius) {
//         const point = along(lineString, dist, { units: 'meters' });
//         coords.push(point.geometry.coordinates);
//     }
//     selectedCoordinatesAlongTrackStore.set(coords);
//     // transform to points
//     const points: FeatureCollection<Geometry, GeoJsonProperties> = {
//         type: 'FeatureCollection',
//         features: coords.map((coord) => ({
//             type: 'Feature',
//             geometry: {
//                 type: 'Point',
//                 coordinates: coord
//             },
//             properties: {}
//         }))
//     };
//     selectedPointsStoreAlongTrackStore.set(points);
// }

export function polyAroundTrack() {
    const simplifiedGpxTrack: LineString | null = get(simplifiedGpxTrackStore);
    if (!simplifiedGpxTrack) {
        console.error('No simplified GPX track available');
        return;
    }
    const buffered = buffer(simplifiedGpxTrack, SEARCH_CORRIDOR_RADIUS, { units: 'meters' });
    if (buffered) {
        const simplifiedBuffer = simplify(buffered, { tolerance: 0.01, highQuality: false, mutate: true });
        polyAroundTrackStore.set(simplifiedBuffer);
        console.log('Buffered polygon around track created:', simplifiedBuffer);
    } else {
        console.error('Buffer polygon is undefined');
    }
}


// export function bboxAroundSelectedTrack() {
//     const selectedRangeTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(selectedRangeTrackStore);
//     if (!selectedRangeTrack || selectedRangeTrack.features[0].geometry.type !== 'LineString') {
//         console.error('Invalid GPX track data');
//         return;
//     }
//     const selectedRadius = get(selectedRadiusStore);

//     const coordinates = selectedRangeTrack.features[0].geometry.coordinates as number[][];
//     const lats = coordinates.map(coord => coord[1]);
//     const lons = coordinates.map(coord => coord[0]);
//     const minLat = Math.min(...lats);
//     const maxLat = Math.max(...lats);
//     const minLon = Math.min(...lons);
//     const maxLon = Math.max(...lons);

//     // Expand bbox by radius (in meters)
//     const marginLat = selectedRadius / 111320;
//     const centerLat = (minLat + maxLat) / 2;
//     const marginLon = selectedRadius / (111320 * Math.cos(centerLat * Math.PI / 180));

//     const expandedMinLat = minLat - marginLat;
//     const expandedMaxLat = maxLat + marginLat;
//     const expandedMinLon = minLon - marginLon;
//     const expandedMaxLon = maxLon + marginLon;
//     const cornerPoints: FeatureCollection<Geometry, GeoJsonProperties> = {
//         type: 'FeatureCollection',
//         features: [
//             {
//                 type: 'Feature',
//                 geometry: { type: 'Point', coordinates: [expandedMinLon, expandedMinLat] },
//                 properties: { corner: 'SW' }
//             },
//             {
//                 type: 'Feature',
//                 geometry: { type: 'Point', coordinates: [expandedMinLon, expandedMaxLat] },
//                 properties: { corner: 'NW' }
//             },
//             {
//                 type: 'Feature',
//                 geometry: { type: 'Point', coordinates: [expandedMaxLon, expandedMaxLat] },
//                 properties: { corner: 'NE' }
//             },
//             {
//                 type: 'Feature',
//                 geometry: { type: 'Point', coordinates: [expandedMaxLon, expandedMinLat] },
//                 properties: { corner: 'SE' }
//             }
//         ]
//     };
//     bboxAroundSelectedTrackStore.set(cornerPoints);
// }

function simplifyGpxTrack() {
    const gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(gpxTrackStore);
    if (!gpxTrack || gpxTrack.features[0].geometry.type !== 'LineString') {
        console.error('Invalid GPX track data');
        return;
    }
    const simplified = simplify(gpxTrack.features[0].geometry, { tolerance: 0.001, highQuality: true });
    simplifiedGpxTrackStore.set(simplified);
}
