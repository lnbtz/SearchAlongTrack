<script lang="ts">
    import { onMount } from 'svelte';
    import maplibregl from 'maplibre-gl';
    
    let mapContainer: HTMLDivElement;
    
    onMount(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            
            const map = new maplibregl.Map({
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

<div bind:this={mapContainer} id="map"></div>