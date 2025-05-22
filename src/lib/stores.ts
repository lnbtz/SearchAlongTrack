import { writable } from 'svelte/store';
import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

// Store to hold the loaded GPX track as GeoJSON
export const gpxTrackStore = writable<FeatureCollection<Geometry, GeoJsonProperties> | null>(null); // Store to hold the loaded GPX track as GeoJSON
export const selectedRangeTrackStore = writable<FeatureCollection<Geometry, GeoJsonProperties> | null>(null); // Store to hold the selected range along the track
export const selectedCategoriesStore = writable<string[]>([]); // Store to hold the selected categories for Overpass API query
export const selectedStartRangeStore = writable<number>(0); // Store to hold the selected range alont the track
export const selectedEndRangeStore = writable<number>(0); // Store to hold the selected range along the track
export const selectedRadiusStore = writable<number>(0); // Store to hold the selected radius for Overpass API query
export const totalTrackLengthStore = writable<number>(0); // Store to hold the total length of the track
export const selectedPointsStoreAlongTrackStore= writable<FeatureCollection<Geometry, GeoJsonProperties>>(); // Store to hold the coordinates along the selected track
export const selectedCoordinatesAlongTrackStore = writable<number[][]>(); // Store to hold the coordinates along the selected track
export const bboxAroundSelectedTrackStore = writable<FeatureCollection<Geometry, GeoJsonProperties>>(); // Store to hold the bounding box around the selected track