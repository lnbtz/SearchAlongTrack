import {
	totalTrackLengthStore,
	gpxTrackStore,
	selectedStartRangeStore,
	selectedEndRangeStore,
	selectedRadiusStore,
	selectedCategoriesStore,
	tableDataStore,
	tableDataDisplayStore,
	selectedRangeTrackStore,
	simplifiedGpxTrackStore,
	polyAroundTrackStore
} from './stores';
import { get } from 'svelte/store';
import type { FeatureCollection, GeoJsonProperties, Geometry, LineString } from 'geojson';
import { lineSliceAlong, simplify, buffer, length } from '@turf/turf';
import { OSMCategoriesMap, SEARCH_CORRIDOR_RADIUS } from './osm-constants';
import type { TableRow } from './results';

export function handleGpxTrack() {
	setTrackLengthStore();
	simplifyGpxTrack();
	polyAroundTrack();
}

export function centerOnCoords(
	map: maplibregl.Map | undefined,
	location: { lon: number; lat: number },
	zoom: number
) {
	if (map && location.lon !== undefined && location.lat !== undefined) {
		map.flyTo({
			center: [location.lon, location.lat],
			zoom: zoom,
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
	const totalKm = length(gpxTrack, { units: 'kilometers' });
	const totalRoundedKm = Math.round(totalKm * 100) / 100; // Round to two decimal places
	selectedEndRangeStore.set(totalRoundedKm);
	totalTrackLengthStore.set(totalRoundedKm);
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

/**
 * Recompute the filtered table data based on the currently selected
 * categories, radius, and start/end ranges. Updates tableDataDisplayStore.
 */
export function recomputeTableDataDisplay(): TableRow[] {
	const selectedCategories = get(selectedCategoriesStore);
	const selectedRadius = get(selectedRadiusStore);
	const selectedStartRange = get(selectedStartRangeStore);
	const selectedEndRange = get(selectedEndRangeStore);
	const tableData = get(tableDataStore);

	const types: string[] = [];
	OSMCategoriesMap.forEach((values, key) => {
		if (selectedCategories.includes(key)) {
			types.push(...values);
		}
	});

	const tableDataDisplay = tableData.filter((row) => {
		return (
			types.includes(row.type) &&
			(row.distanceOnRoute ?? 0) <= selectedEndRange &&
			(row.distanceOnRoute ?? 0) >= selectedStartRange &&
			(row.distanceFromRoute ?? Infinity) <= selectedRadius
		);
	});

	tableDataDisplayStore.set(tableDataDisplay);
	return tableDataDisplay;
}

export function polyAroundTrack() {
	const simplifiedGpxTrack: LineString | null = get(simplifiedGpxTrackStore);
	if (!simplifiedGpxTrack) {
		console.error('No simplified GPX track available');
		return;
	}
	const buffered = buffer(simplifiedGpxTrack, SEARCH_CORRIDOR_RADIUS, { units: 'meters' });
	if (buffered) {
		const simplifiedBuffer = simplify(buffered, {
			tolerance: 0.01,
			highQuality: false,
			mutate: true
		});
		polyAroundTrackStore.set(simplifiedBuffer);
		console.log('Buffered polygon around track created:', simplifiedBuffer);
	} else {
		console.error('Buffer polygon is undefined');
	}
}

function simplifyGpxTrack() {
	const gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(gpxTrackStore);
	if (!gpxTrack || gpxTrack.features[0].geometry.type !== 'LineString') {
		console.error('Invalid GPX track data');
		return;
	}
	const simplified = simplify(gpxTrack.features[0].geometry, {
		tolerance: 0.001,
		highQuality: true
	});
	simplifiedGpxTrackStore.set(simplified);
}
