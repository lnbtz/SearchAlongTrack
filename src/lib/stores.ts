import { writable } from 'svelte/store';
import type {
	FeatureCollection,
	Geometry,
	GeoJsonProperties,
	LineString,
	MultiPolygon,
	Polygon,
	Feature
} from 'geojson';
import type { OverpassJson } from 'overpass-ts';
import type { TableRow } from './results';
import maplibregl from 'maplibre-gl';

export const markersStore = writable<maplibregl.Marker[]>([]); // Store to hold markers on the map
export const mapInstanceStore = writable<maplibregl.Map | undefined>(undefined); // Store to hold the MapLibre GL map instance
export const gpxTrackStore = writable<FeatureCollection<Geometry, GeoJsonProperties> | null>(null); // Store to hold the loaded GPX track as GeoJSON
export const simplifiedGpxTrackStore = writable<LineString | null>(null); // Store to hold the simplified GPX track as GeoJSON
export const polyAroundTrackStore = writable<
	Feature<Polygon | MultiPolygon, GeoJsonProperties> | undefined
>(undefined); // Store to hold the polygon around the track
export const selectedRangeTrackStore = writable<FeatureCollection<
	Geometry,
	GeoJsonProperties
> | null>(null); // Store to hold the selected range along the track
export const selectedCategoriesStore = writable<string[]>([]); // Store to hold the selected categories for Overpass API query
export const selectedStartRangeStore = writable<number>(0); // Store to hold the selected range along the track
export const selectedEndRangeStore = writable<number>(0); // Store to hold the selected range along the track
export const selectedRadiusStore = writable<number>(0); // Store to hold the selected radius for Overpass API query
export const totalTrackLengthStore = writable<number>(0); // Store to hold the total length of the track
export const selectedPointsStoreAlongTrackStore =
	writable<FeatureCollection<Geometry, GeoJsonProperties>>(); // Store to hold the coordinates along the selected track
export const selectedCoordinatesAlongTrackStore = writable<number[][]>(); // Store to hold the coordinates along the selected track
export const bboxAroundSelectedTrackStore =
	writable<FeatureCollection<Geometry, GeoJsonProperties>>(); // Store to hold the bounding box around the selected track
export const searchResultsCacheStore = writable<Map<string, OverpassJson>>(new Map()); // Store to cache search results from Overpass API
export const lastQueryHashStore = writable<string>(''); // Store to hold the last search query
export const tableDataStore = writable<TableRow[]>([]); // Store to hold the table data for displaying search results
export const tableDataDisplayStore = writable<TableRow[]>([]); // Store the table data that should be currently displayed
