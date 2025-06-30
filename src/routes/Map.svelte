<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { gpxTrackStore, selectedRangeTrackStore, selectedPointsStoreAlongTrackStore, selectedRadiusStore, bboxAroundSelectedTrackStore } from '$lib/stores';


	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;

	onMount(() => {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;

				map = new maplibregl.Map({
					container: mapContainer,
					style: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
					center: [longitude, latitude],
					zoom: 14,
					attributionControl: false
				});
			},
			(err) => {
				console.error('Geolocation error:', err.message);
				alert('Unable to access your location. Please enable location services.');
			}
		);
	});

	gpxTrackStore.subscribe((geojson) => {
		if (geojson) {
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
		}
	});
	selectedRangeTrackStore.subscribe((geojson) => {
		if (geojson) {
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
