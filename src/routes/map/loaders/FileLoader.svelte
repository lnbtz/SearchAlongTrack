<script lang="ts">
	import toGeoJSON from '@mapbox/togeojson';
	import type { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

	export let onLoaded: (geojson: FeatureCollection<Geometry, GeoJsonProperties>) => void;
  
	function handleChange(e: Event) {
	  const file = (e.target as HTMLInputElement).files?.[0];
	  if (!file) return;
  
	  const reader = new FileReader();
	  reader.onload = () => {
		const xml = new DOMParser().parseFromString(reader.result as string, 'application/xml');
		const geojson = toGeoJSON.gpx(xml);
		onLoaded(geojson);
	  };
	  reader.readAsText(file);
	}
  </script>
<style>
	.upload-icon {
		display: inline-block;
		cursor: pointer;
		margin-right: 8px;
	}
</style>

<label class="upload-icon" for="file-input">
	📁
</label>
<input id="file-input" type="file" accept=".gpx" onchange={handleChange} />

  