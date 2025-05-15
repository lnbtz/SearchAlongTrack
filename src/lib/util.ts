import { totalTrackLengthStore, gpxTrackStore } from "./stores";
import { get } from "svelte/store";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";


export function calculateTrackLength() {
    // calculate the length of the track in meters
    const gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(gpxTrackStore);
    if (!gpxTrack || gpxTrack.features[0].geometry.type !== 'LineString') {
        console.error('Invalid GPX track data');
        return;
    }
    const coordinates = gpxTrack.features[0].geometry.coordinates as number[][]; // assuming coordinates are in [longitude, latitude] format
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

export function getStartingCoorinates(startOfRange: number, coordinates: number[]) {
    // get starting coordinates
    return coordinatesList[0];
}
export function getEndingCoordinates(startOfRange: number, coordinates: number[]) {
    // get ending coordinates
    return coordinatesList[coordinatesList.length - 1];
}
export function getCoordinatesAlongTrack(start: number, end: number, radius: number, coordinates: number[]) {
    return coordinatesList;
}