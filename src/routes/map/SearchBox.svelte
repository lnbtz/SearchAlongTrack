<script lang="ts">
	import { searchAlongTrack } from '$lib/api';
	import {
		selectedCategoriesStore,
		selectedEndRangeStore,
		selectedStartRangeStore,
		selectedRadiusStore,
		totalTrackLengthStore
	} from '$lib/stores';
	import { bboxAroundSelectedTrack, calculateSelectedRangeTrackStore } from '$lib/util';
	let selectedCategories: string[] = [];

	function setSelectedCategories() {
		selectedCategoriesStore.set(selectedCategories);
		bboxAroundSelectedTrack();
		// searchAlongTrack();
	}
</script>

<div>
	<label for="range-slider">Select Search Radius (in m):</label>
	<input
		id="range-slider"
		type="range"
		min="0"
		max="10000"
		step="500"
		bind:value={$selectedRadiusStore}
	/>
	<span>{$selectedRadiusStore} m</span>
</div>
<!-- TODO: Replace the dual-range sliders with a single 2-in-1 range slider component for selecting start and end ranges. -->
<!-- TODO: Set add button to set start of range to current position -->
<div>
	<label for="start-range-slider">Start Range (in km):</label>
	<input
		id="start-range-slider"
		type="range"
		min="0"
		max={$totalTrackLengthStore}
		step="1"
		bind:value={$selectedStartRangeStore}
		onchange={calculateSelectedRangeTrackStore}
	/>
	<span>{$selectedStartRangeStore} km</span>
</div>

<div>
	<label for="end-range-slider">End Range (in km):</label>
	<input
		id="end-range-slider"
		type="range"
		min="0"
		max={$totalTrackLengthStore}
		step="1"
		bind:value={$selectedEndRangeStore}
		onchange={calculateSelectedRangeTrackStore}
	/>
	<span>{$selectedEndRangeStore} km</span>
</div>

<div>
	<label>
		<input type="checkbox" bind:group={selectedCategories} value="supermarkets" />
		Supermarkets
	</label>
	<label>
		<input type="checkbox" bind:group={selectedCategories} value="shelters" />
		Shelters
	</label>
	<br />
	<button onclick={setSelectedCategories}> Search </button>
</div>

<style>
	button {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 10px 20px;
		font-size: 16px;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	button:hover {
		background-color: #0056b3;
	}

	button:active {
		background-color: #003f7f;
	}
</style>
