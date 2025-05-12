<script lang="ts">
    import { onMount } from 'svelte';
    import maplibregl from 'maplibre-gl';
	import FileLoader from './loaders/FileLoader.svelte';
    import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

    
    let mapContainer: HTMLDivElement;
    let map: maplibregl.Map;

    function addGeoJsonToMap(geojson: FeatureCollection<Geometry, GeoJsonProperties>){
        if (!map.getSource('gpx-track')) {
            // Add the GeoJSON source
            map.addSource('gpx-track', {
                type: 'geojson',
                data: geojson
            });

            // Add a line layer to display the track
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
            // Update the existing source with new data
            const source = map.getSource('gpx-track') as maplibregl.GeoJSONSource;
            source.setData(geojson);
        }
    }
    onMount(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
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
            console.error("Geolocation error:", err.message);
            alert("Unable to access your location. Please enable location services.");
        },
    );
    });
    
</script>
<style>
  #map {
    height: 100vh;
    width: 100%;
    position: relative;
  }
</style>
<FileLoader onLoaded={addGeoJsonToMap} />
<br />

<div bind:this={mapContainer} id="map"></div>
