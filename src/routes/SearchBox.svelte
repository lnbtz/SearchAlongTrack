<script lang="ts">
	import { searchAlongTrack } from '$lib/api';
	import {
		selectedEndRangeStore,
		selectedStartRangeStore,
		selectedRadiusStore,
		totalTrackLengthStore
	} from '$lib/stores';
	import { calculateSelectedRangeTrackStore } from '$lib/util';
	import { buildTableData } from '$lib/results';

	function search() {
		searchAlongTrack().then(() => {
			buildTableData();
		});
	}
</script>

<div>
	<label for="range-slider">Select Search Radius (in m):</label>
	<input
		id="range-slider"
		type="range"
		min="100"
		max="5000"
		step="100"
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
	<button onclick={search}> Search </button>
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
