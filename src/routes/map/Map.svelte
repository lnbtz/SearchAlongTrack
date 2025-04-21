<script lang="ts">
    import { onMount } from 'svelte';
    import maplibregl from 'maplibre-gl';
    
    let mapContainer: HTMLDivElement;
    
    onMount(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            
            const map = new maplibregl.Map({
                container: mapContainer,
                style: 'https://demotiles.maplibre.org/style.json',
                center: [longitude, latitude],
                zoom: 14
            });
            
            new maplibregl.Marker().setLngLat([longitude, latitude]).addTo(map);
        });
    });
</script>
<style>
  #map {
    height: 100vh;
    width: 100%;
  }
</style>

<div bind:this={mapContainer} id="map"></div>