<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import {
		gpxTrackStore,
		selectedRangeTrackStore,
		tableDataDisplay,
		mapInstanceStore
	} from '$lib/stores';

	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
			zoom: 14,
			attributionControl: false
		});
		mapInstanceStore.set(map);
	});
	gpxTrackStore.subscribe((geojson) => {
		if (map && geojson) {
			if (!map.getSource('gpx-track')) {
				map.addSource('gpx-track', {
					type: 'geojson',
					data: geojson
				});

				map.addLayer({
					id: 'gpx-track-line',
					type: 'line',
					source: 'gpx-track',
					layout: {
						'line-join': 'round',
						'line-cap': 'round'
					},
					paint: {
						'line-color': '#ff0000', // Red color for the track
						'line-width': 4
					}
				});
			} else {
				const source = map.getSource('gpx-track') as maplibregl.GeoJSONSource;
				source.setData(geojson);
			}
			const geometry = geojson.features[0].geometry;
			let bbox: number[] | undefined = undefined;
			if (geometry.type === 'LineString' && Array.isArray((geometry as any).coordinates)) {
				bbox = (geometry as { coordinates: number[][] }).coordinates.reduce(
					(acc: number[], coord: number[]) => {
						acc[0] = Math.min(acc[0], coord[0]);
						acc[1] = Math.min(acc[1], coord[1]);
						acc[2] = Math.max(acc[2], coord[0]);
						acc[3] = Math.max(acc[3], coord[1]);
						return acc;
					},
					[Infinity, Infinity, -Infinity, -Infinity]
				);
			}
			if (bbox) {
				map.fitBounds(
					[
						[bbox[0], bbox[1]],
						[bbox[2], bbox[3]]
					],
					{
						padding: { top: 20, bottom: 20, left: 20, right: 20 }
					}
				);
			}
		}
	});
	selectedRangeTrackStore.subscribe((geojson) => {
		if (map && geojson) {
			if (!map.getSource('selected-range-track')) {
				map.addSource('selected-range-track', {
					type: 'geojson',
					data: geojson
				});

				map.addLayer({
					id: 'selected-range-track-line',
					type: 'line',
					source: 'selected-range-track',
					layout: {
						'line-join': 'round',
						'line-cap': 'round'
					},
					paint: {
						'line-color': '#00ff00', // Green color for the selected range
						'line-width': 4
					}
				});
			} else {
				const source = map.getSource('selected-range-track') as maplibregl.GeoJSONSource;
				source.setData(geojson);
			}
		}
	});
	tableDataDisplay.subscribe((row) => {
		if(map && row) {
			
		}
	})
	// polyAroundTrackStore.subscribe((polygon) => {
	// 	if (map && polygon) {
	// 		if (!map.getSource('poly-around-track')) {
	// 			map.addSource('poly-around-track', {
	// 				type: 'geojson',
	// 				data: polygon
	// 			});

	// 			map.addLayer({
	// 				id: 'poly-around-track-fill',
	// 				type: 'fill',
	// 				source: 'poly-around-track',
	// 				paint: {
	// 					'fill-color': '#0000ff', // Blue color for the polygon around the track
	// 					'fill-opacity': 0.3
	// 				}
	// 			});
	// 		} else {
	// 			const source = map.getSource('poly-around-track') as maplibregl.GeoJSONSource;
	// 			source.setData(polygon);
	// 		}
	// 	}
	// });

	// selectedPointsStoreAlongTrackStore.subscribe((coordinates) => {
	// 	if (coordinates) {
	// 		if (!map.getSource('coordinates')) {
	// 			map.addSource('coordinates', {
	// 				type: 'geojson',
	// 				data: coordinates
	// 			});

	// 			map.addLayer({
	// 				id: 'coordinates-circle',
	// 				type: 'circle',
	// 				source: 'coordinates',
	// 				paint: {
	// 					'circle-radius': 4,
	// 					'circle-color': '#0000ff', // Blue color for the coordinates
	// 					'circle-opacity': 0.8
	// 				}
	// 			});
	// 		} else {
	// 			const source = map.getSource('coordinates') as maplibregl.GeoJSONSource;
	// 			source.setData(coordinates);
	// 		}
	// 	}
	// });
	// searchBbox
	// bboxAroundSelectedTrackStore.subscribe((bbox) => {
	// 	if (bbox) {
	// 		if (!map.getSource('bbox')) {
	// 			map.addSource('bbox', {
	// 				type: 'geojson',
	// 				data: bbox
	// 			});

	// 			map.addLayer({
	// 				id: 'bbox-circle',
	// 				type: 'circle',
	// 				source: 'bbox',
	// 				paint: {
	// 					'circle-radius': 4,
	// 					'circle-color': '#0000ff', // Blue color for the coordinates
	// 					'circle-opacity': 0.8
	// 				}
	// 			});
	// 		} else {
	// 			const source = map.getSource('bbox') as maplibregl.GeoJSONSource;
	// 			source.setData(bbox);
	// 		}
	// 	}
	// }
	// );


</script>

<div bind:this={mapContainer} id="map"></div>

<style>
	#map {
		height: 100vh;
		width: 100%;
		position: relative;
	}
</style>
