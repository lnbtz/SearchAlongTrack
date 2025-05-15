<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import { gpxTrackStore } from '$lib/stores';

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
					zoom: 14
				});

				new maplibregl.Marker().setLngLat([longitude, latitude]).addTo(map);
			},
			(err) => {
				console.error('Geolocation error:', err.message);
				alert('Unable to access your location. Please enable location services.');
			}
		);
	});
	// TODO add 2nd layer with start and end range points
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
</script>

<div bind:this={mapContainer} id="map"></div>

<style>
	#map {
		height: 100vh;
		width: 100%;
		position: relative;
	}
</style>
