<script lang="ts">
	import { displayType, type TableRow } from '$lib/results';
	import { OSMCategories, OSMCategoriesMap } from '$lib/osm-constants';
	import {
		mapInstanceStore,
		markersStore,
		selectedCategoriesStore,
		selectedEndRangeStore,
		selectedRadiusStore,
		selectedStartRangeStore,
		tableDataDisplayStore,
		tableDataStore,
		totalTrackLengthStore
	} from '$lib/stores';
	import { get } from 'svelte/store';
	import { calculateSelectedRangeTrackStore, centerOnCoords } from '$lib/util';
	import RangeSlider from 'svelte-range-slider-pips';
	let tableData: TableRow[] = get(tableDataStore);
	let tableDataDisplay: TableRow[] = get(tableDataDisplayStore);
	let selectedCategories: string[] = get(selectedCategoriesStore).length === 0 ? 
	Array.from(OSMCategoriesMap.keys()) : get(selectedCategoriesStore);
	
	let value = $selectedRadiusStore;
	$: selectedRadiusStore.set(value);

	// Initialize local values from stores
	let values = [$selectedStartRangeStore, $selectedEndRangeStore];

	// Update stores when slider changes
	$: selectedStartRangeStore.set(values[0]);
	$: selectedEndRangeStore.set(values[1]);

	// Update slider if stores change elsewhere
	$: values = [$selectedStartRangeStore, $selectedEndRangeStore];

	function checkBox(category: string, e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		if (checked) {
			selectedCategories = [...selectedCategories, category];
		} else {
			selectedCategories = selectedCategories.filter((c) => c !== category);
		}
		selectedCategoriesStore.set(selectedCategories);
	}

	function handleShowOnMap(row: TableRow) {
		const markers = get(markersStore);
		const markerToPopup = markers.find((marker) => {
			const lngLat = marker.getLngLat();
			return lngLat.lat === row.location?.lat && lngLat.lng === row.location?.lon;
		});
		markerToPopup?.togglePopup();
		const map = get(mapInstanceStore);
		centerOnCoords(map, row.location ? row.location : { lat: 0, lon: 0 });
	}

	function filterTableData(
		selectedCategories: string[],
		tableData: TableRow[],
		selectedRadius: number,
		selectedStartRange: number,
		selectedEndRange: number
	): TableRow[] {
		let types: string[] = [];
		OSMCategoriesMap.forEach((values, key) => {
			if (selectedCategories.includes(key)) {
				types.push(...values);
			}
		});
		const tableDataDisplay = tableData
			.filter((row) => {
				return (
					types.includes(row.type) &&
					row.distanceOnRoute <= selectedEndRange &&
					row.distanceOnRoute >= selectedStartRange &&
					row.distanceFromRoute <= selectedRadius
				);
			})
			.sort((a, b) => {
				// sort by distance on route
				if (a.distanceOnRoute < b.distanceOnRoute) return -1;
				if (a.distanceOnRoute > b.distanceOnRoute) return 1;
				return 0;
			});
		tableDataDisplayStore.set(tableDataDisplay);
		return tableDataDisplay;
	}
</script>

<div class="slider-group">
	<div>
		<label for="selected-range-slider" class="slider-label"
			>Select Range (in km): start: {$selectedStartRangeStore} km, end: {$selectedEndRangeStore} km
		</label>
		<RangeSlider
			bind:values
			min={0}
			max={$totalTrackLengthStore}
			pips
			first="label"
			last="label"
			rest="pip"
			on:change={() => {
				calculateSelectedRangeTrackStore();
			}}
		/>
	</div>
	<div>
		<label for="radius-slider" class="slider-label">Select Radius (in m): {$selectedRadiusStore} m</label>
		<RangeSlider bind:value min={100} max={5000} step={100} pips first="label" last="label" />
	</div>
</div>

<!--
	Search along GPS track results page.
	This page displays the results of the search along the GPS track.
	It includes a table with the results and checkboxes to filter the results by category.
-->
<fieldset class="category-group">
	<legend>
		<h3>Filter by Category</h3>
		<p>Select the categories you want to display in the results table.</p>
	</legend>

<label>
	<input
		type="checkbox"
		value={OSMCategories.value.VENDING_MACHINE}
		checked={selectedCategories.includes(OSMCategories.value.VENDING_MACHINE)}
		on:change={(e) => {
			checkBox(OSMCategories.value.VENDING_MACHINE, e);
		}}
	/>
	Vending Machines
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.FUEL}
		checked={selectedCategories.includes(OSMCategories.value.FUEL)}
		on:change={(e) => {
			checkBox(OSMCategories.value.FUEL, e);
		}}
	/>
	Gas Stations
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.SUPERMARKET}
		checked={selectedCategories.includes(OSMCategories.value.SUPERMARKET)}
		on:change={(e) => {
			checkBox(OSMCategories.value.SUPERMARKET, e);
		}}
	/>
	Supermarkets
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.SHELTER}
		checked={selectedCategories.includes(OSMCategories.value.SHELTER)}
		on:change={(e) => {
			checkBox(OSMCategories.value.SHELTER, e);
		}}
	/>
	Shelters
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.BAKERY}
		checked={selectedCategories.includes(OSMCategories.value.BAKERY)}
		on:change={(e) => {
			checkBox(OSMCategories.value.BAKERY, e);
		}}
	/>
	Bakery
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.KIOSK}
		checked={selectedCategories.includes(OSMCategories.value.KIOSK)}
		on:change={(e) => {
			checkBox(OSMCategories.value.KIOSK, e);
		}}
	/>
	Kiosks
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.DRINKING_WATER}
		checked={selectedCategories.includes(OSMCategories.value.DRINKING_WATER)}
		on:change={(e) => {
			checkBox(OSMCategories.value.DRINKING_WATER, e);
		}}
	/>
	Drinking Water
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.TOILETS}
		checked={selectedCategories.includes(OSMCategories.value.TOILETS)}
		on:change={(e) => {
			checkBox(OSMCategories.value.TOILETS, e);
		}}
	/>
	Toilets
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.key.ICE_CAFE}
		checked={selectedCategories.includes(OSMCategories.key.ICE_CAFE)}
		on:change={(e) => {
			checkBox(OSMCategories.key.ICE_CAFE, e);
		}}
	/>
	Cafés & Ice Cream
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.RESTAURANT}
		checked={selectedCategories.includes(OSMCategories.value.RESTAURANT)}
		on:change={(e) => {
			checkBox(OSMCategories.value.RESTAURANT, e);
		}}
	/>
	Restaurants
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.value.CAMP_SITE}
		checked={selectedCategories.includes(OSMCategories.value.CAMP_SITE)}
		on:change={(e) => {
			checkBox(OSMCategories.value.CAMP_SITE, e);
		}}
	/>
	Camp Sites
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.key.ACCOMMODATION}
		checked={selectedCategories.includes(OSMCategories.key.ACCOMMODATION)}
		on:change={(e) => {
			checkBox(OSMCategories.key.ACCOMMODATION, e);
		}}
	/>
	Accommodations
</label>
<label>
	<input
		type="checkbox"
		value={OSMCategories.key.BICYCLE_REPAIR}
		checked={selectedCategories.includes(OSMCategories.key.BICYCLE_REPAIR)}
		on:change={(e) => {
			checkBox(OSMCategories.key.BICYCLE_REPAIR, e);
		}}
	/>
	Bicycle Repair
</label>
</fieldset>

{#if tableDataDisplay}
	<table>
		<thead>
			<tr>
				<th>Type</th>
				<th>Name</th>
				<th>Website</th>
				<th>Phone</th>
				<th>Opening Hours</th>
				<th>Distance to Track</th>
				<th>Distance on Route</th>
				<th>Location (Lat, Lon)</th>
				<th>Further Details</th>
			</tr>
		</thead>
		<tbody>
			{#each filterTableData(selectedCategories, tableData, $selectedRadiusStore, $selectedStartRangeStore, $selectedEndRangeStore) as row}
				<tr>
					<td>{displayType(row.type)}</td>
					<td>{row.name}</td>
					<td>
						{#if row.website}
							<a
								href={row.website}
								target="_blank"
								rel="noopener noreferrer"
								title="Open website"
								class="clickable-icon"
								aria-label="Open website"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									style="vertical-align: middle;"
								>
									<circle cx="12" cy="12" r="10" stroke-width="2" />
									<path
										d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"
										stroke-width="2"
									/>
								</svg>
							</a>
						{/if}
					</td>
					<td>
						{#if row.phoneNumber}
							<a
								href={`tel:${row.phoneNumber}`}
								aria-label="Call or copy phone number"
								on:click|preventDefault={() => {
									if (navigator.userAgent.match(/Mobi|Android|iPhone|iPad|iPod/)) {
										window.location.href = `tel:${row.phoneNumber}`;
									} else {
										navigator.clipboard.writeText(row.phoneNumber ? row.phoneNumber : '');
										alert('Phone number copied to clipboard');
									}
								}}
								title="Click to call or copy to clipboard"
								class="clickable-icon"
							>
								<svg
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									height="18"
									width="18"
									viewBox="0 0 24 24"
									style="vertical-align: middle;"
								>
									<path
										d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.72c.13 1.05.37 2.06.72 3.03a2 2 0 0 1-.45 2.11l-1.27 1.27a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.97.35 1.98.59 3.03.72A2 2 0 0 1 22 16.92z"
									/>
								</svg>
							</a>
						{/if}
					</td>
					<td>
						{#if row.openingHours}
							<details class="show-more">
								<summary class="clickable"> Opening Hours </summary>
								<div class="info-box">
									{#each row.openingHours.split(';') as segment, i}
										{segment.trim()}{#if i < row.openingHours.split(';').length - 1}<br />{/if}
									{/each}
								</div>
							</details>
						{:else}
							-
						{/if}
					</td>
					<td>{row.distanceFromRoute} m</td>
					<td>{row.distanceOnRoute} km</td>
					<td>
						<button class="clickable" title="Show on map" on:click={() => handleShowOnMap(row)}
							>Show
						</button>
						<button
							class="clickable"
							title="Copy coordinates to clipboard"
							on:click={() =>
								navigator.clipboard.writeText(`${row.location?.lat},${row.location?.lon}`)}
						>
							Copy
						</button>
						<br />
						<div class="links-container">
							<button
								title="Open in Google Maps"
								aria-label="Open in Google Maps"
								class="map-icon"
								on:click={() => {
									const lat = row.location?.lat;
									const lon = row.location?.lon;
									if (!lat || !lon) return;
									const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
									window.open(url, '_blank');
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 92.3 132.3"
									width="18"
									height="18"
									><path
										fill="#1a73e8"
										d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"
									/><path
										fill="#ea4335"
										d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"
									/><path
										fill="#4285f4"
										d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"
									/><path
										fill="#fbbc04"
										d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"
									/><path
										fill="#34a853"
										d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"
									/></svg
								>
							</button>
							<button
								aria-label="Open in Google Maps"
								title="Open in Apple Maps"
								class="map-icon"
								on:click={() => {
									const lat = row.location?.lat;
									const lon = row.location?.lon;
									if (!lat || !lon) return;
									const url = `https://maps.apple.com/?q=${lat},${lon}`;
									window.open(url, '_blank');
								}}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
									<path
										fill="#e0e0e0"
										d="M35.13 42H19V30C19 30 35.48 42 35.13 42zM6.3 10.87c.1-.33.22-.65.38-.96C7.36 8.46 8.54 7.3 10 6.64 10.149 6.565 11 13 11 13S6.193 11.207 6.3 10.87z"
									></path><path fill="#7cb342" d="M18 6H20V23H18z"></path><path
										fill="#ffcdd2"
										d="M11,18v23.73c-0.35-0.09-0.68-0.21-1-0.37c-2.36-1.08-4-3.47-4-6.23V18H11z"
									></path><path
										fill="#aed581"
										d="M42,25v10.13c0,0.36-0.03,0.71-0.09,1.05L20,20.6V6h3C23,16.48,31.52,25,42,25z"
									></path><path
										fill="#bdbdbd"
										d="M12 14h-2V6.64c.32-.16.65-.28 1-.37.32-.1.66-.17 1-.2C12.28 6.02 12 14 12 14zM18 32H20V42H18z"
									></path><path
										fill="#f9a825"
										d="M42,35.02v0.11c0,0.36-0.03,0.71-0.09,1.05c-0.06,0.43-0.16,0.84-0.31,1.23 c-0.82,2.36-2.9,4.13-5.44,4.5C35.83,41.97,35.48,42,35.13,42h-0.57l-3.02-2.15c-0.01,0-0.01-0.01-0.01-0.01l-4.5-3.2 c0,0-0.01,0-0.01-0.01l-6.36-4.52L20,31.65l-1-0.72l-1-0.71l-0.91-0.64L16.28,29l-2.49-1.77L12.06,26L12,25.96l-1-0.71l-1-0.72 L9.26,24H9.25L6,21.69v-8.82c0-0.69,0.1-1.37,0.3-2c0.1-0.33,0.22-0.65,0.38-0.96L10,12.27l2,1.42l1,0.71l5,3.55l1,0.71l0.55,0.39 L20,19.37v0.01l14.73,10.47l1.6,1.14l2.66,1.89l0.98,0.7L42,35.02z"
									></path><path
										fill="#fdd835"
										d="M41.91,36.18c-0.06,0.43-0.16,0.84-0.31,1.23c-0.82,2.36-2.9,4.13-5.44,4.5l-2.72-1.93 c-0.01,0.01-0.01,0.01-0.02,0l-1.49-1.08l-4.15-2.94c0,0,0,0-0.01-0.01l-1.51-1.08l-5.07-3.6L20,30.42l-1-0.71L18,29l-1.53-1.09 h-0.01l-2.31-1.65L13,25.45l-1-0.72l-1-0.71l-1-0.71l-0.11-0.08L6,20.47v-7.6c0-0.69,0.1-1.37,0.3-2L10,13.5l1,0.71l2,1.42l5,3.55 l1,0.71l1,0.71v0.01l12.41,8.81l1.89,1.35c0,0,0,0.01,0.01,0.01l4.6,3.26l0.88,0.63L41.91,36.18z"
									></path><path
										fill="#ef9a9a"
										d="M12,33v8.94c-0.34-0.04-0.68-0.11-1-0.21c-0.35-0.09-0.68-0.21-1-0.37V32L12,33z"
									></path><path
										fill="#fafafa"
										d="M19,6v36h-6.13c-0.3,0-0.59-0.02-0.87-0.06c-0.34-0.04-0.68-0.11-1-0.21V6.27 c0.32-0.1,0.66-0.17,1-0.2C12.28,6.02,12.57,6,12.87,6H19z"
									></path><path fill="#3996e8" d="M18,6v17h-6V6.052C12.28,6.015,12.57,6,12.87,6H18z"
									></path><path
										fill="#1976d2"
										d="M38.77,29.04c0,0-0.77,0.96-2.77,0.96s-3-1-3-1s-1,1-3,1s-2.77-0.96-2.77-0.96 C26.45,30.16,26,31.53,26,33c0,3.87,3.13,7,7,7s7-3.13,7-7C40,31.53,39.55,30.16,38.77,29.04z"
									></path><path
										fill="#d84315"
										d="M38,33H28c0-0.42,0.05-0.83,0.15-1.23C28.72,31.92,29.34,32,30,32c1.28,0,2.29-0.31,3-0.64 c0.71,0.33,1.72,0.64,3,0.64c0.66,0,1.28-0.08,1.85-0.23C37.95,32.17,38,32.58,38,33z"
									></path><path
										fill="#fbc02d"
										d="M10 12.27L10 13.5 10 24.53 11 25.25 11 14.21 11 12.98zM20 19.38L20 31.65 19 30.93 19 18.66z"
									></path><path fill="#1976d2" d="M15 21A7 7 0 1 0 15 35A7 7 0 1 0 15 21Z"
									></path><path
										fill="#e89c23"
										d="M10 12.27L10 13.5 11 14.21 11 12.98zM19 18.66L19 19.89 20 20.6 20 19.37z"
									></path><path
										fill="#e9e9e9"
										d="M42,16.96V26c-11.03,0-20-8.97-20-20h9.04C31.52,11.83,36.17,16.48,42,16.96z"
									></path><path
										fill="#7cb342"
										d="M42,13v4.96C35.62,17.48,30.52,12.38,30.05,6H35C38.87,6,42,9.13,42,13z"
									></path><path
										fill="#aed581"
										d="M42,13v3.96C36.17,16.48,31.52,11.83,31.04,6H35C38.87,6,42,9.13,42,13z"
									></path><g
										><path
											fill="#7cb342"
											d="M23,6h-1c0,11.03,8.97,20,20,20v-1C31.52,25,23,16.48,23,6z"
										></path></g
									><g
										><path fill="#fafafa" d="M15 24L12 32 15 30 18 32z"></path><path
											fill="#fff"
											d="M38.45,30.48C37.88,30.76,37.08,31,36,31c-1.39,0-2.39-0.41-3-0.77C32.39,30.59,31.39,31,30,31 c-1.08,0-1.88-0.24-2.45-0.52C27.19,31.26,27,32.11,27,33c0,3.31,2.69,6,6,6s6-2.69,6-6C39,32.11,38.81,31.26,38.45,30.48z M33,38 c-2.415,0-4.434-1.721-4.899-4h9.798C37.434,36.279,35.415,38,33,38z M28,33c0-0.422,0.051-0.834,0.151-1.233 C28.724,31.922,29.343,32,30,32c1.283,0,2.288-0.308,3-0.641C33.712,31.692,34.717,32,36,32c0.657,0,1.276-0.078,1.849-0.233 C37.949,32.166,38,32.578,38,33H28z"
										></path><path
											fill="#fff"
											d="M32.125 35.24c0 0 0-.625-.625-.625s-.625.625-.625.625h.375c0-.114.043-.25.25-.25.066 0 .242 0 .25.25 0 .215-.291.549-.487.707l-.013.01-.375.325v.036.298h1.25V36.24h-.628C31.497 36.24 32.125 35.74 32.125 35.24zM33.4 35.615c.125-.102.225-.243.225-.427 0-.316-.28-.573-.625-.573s-.625.257-.625.573c0 .184.1.325.225.427-.125.102-.225.243-.225.427 0 .316.28.573.625.573s.625-.257.625-.573C33.625 35.858 33.525 35.717 33.4 35.615zM33 34.99c.135 0 .25.091.25.198 0 .106-.157.19-.25.228-.092-.037-.25-.121-.25-.228C32.75 35.079 32.862 34.99 33 34.99zM33 36.24c-.138 0-.25-.089-.25-.198 0-.106.157-.19.25-.228.092.037.25.121.25.228C33.25 36.149 33.135 36.24 33 36.24zM34.499 34.99c.104 0 .138.033.163.067.057.075.087.207.087.382v.354c0 .175-.03.307-.086.381-.026.034-.06.067-.162.067-.105 0-.139-.033-.165-.067-.057-.075-.087-.206-.087-.38v-.355c0-.175.03-.307.086-.381C34.362 35.023 34.396 34.99 34.499 34.99M34.499 34.615c-.199 0-.352.071-.461.214s-.163.346-.163.608v.355c0 .261.055.463.164.607.109.144.264.215.463.215.198 0 .351-.071.46-.214.109-.143.163-.346.163-.608v-.354c0-.262-.055-.465-.164-.608C34.852 34.687 34.698 34.615 34.499 34.615L34.499 34.615z"
										></path></g
									>
								</svg>
							</button>
							<button
								aria-label="Open in Komoot"
								title="Open on Komoot"
								class="map-icon"
								on:click={() => {
									const lat = row.location?.lat;
									const lon = row.location?.lon;
									if (!lat || !lon) return;
									const url = `https://www.komoot.com/de-de/plan/@${lat},${lon},14.742z?`;
									window.open(url, '_blank');
								}}
							>
								<svg
									width="18"
									height="18"
									viewBox="0 0 120 120"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M118.322 74.0303C126.071 41.8197 106.241 9.42631 74.0303 1.67762C41.8197 -6.07107 9.42631 13.7592 1.67762 45.9698C-6.07107 78.1803 13.7592 110.574 45.9698 118.322C78.1803 126.071 110.574 106.241 118.322 74.0303Z"
										fill="white"
									/>
									<path
										d="M8.64907 59.9929C8.64907 31.6855 31.6912 8.64343 59.9986 8.64343C88.3229 8.64343 111.348 31.6855 111.348 59.9929C111.348 71.387 107.691 82.1377 100.784 91.1616L75.0326 65.4106C75.676 63.6499 75.9977 61.8214 75.9977 59.976C75.9977 51.1553 68.8192 43.9769 59.9986 43.9769C51.1779 43.9769 43.9995 51.1553 43.9995 59.976C43.9995 61.8214 44.3211 63.6499 44.9645 65.4106L19.2136 91.1616C12.306 82.1547 8.64907 71.387 8.64907 59.9929Z"
										fill="url(#paint0_linear)"
									/>
									<path
										d="M50.5853 72.115L59.9985 57.4365L69.4118 72.0981L94.9257 97.612C85.3939 106.467 73.0179 111.342 59.9985 111.342C46.9792 111.342 34.6031 106.467 25.0714 97.612L50.5853 72.115Z"
										fill="url(#paint1_linear)"
									/>
									<defs>
										<linearGradient
											id="paint0_linear"
											x1="59.9981"
											y1="8.65109"
											x2="59.9981"
											y2="111.344"
											gradientUnits="userSpaceOnUse"
										>
											<stop stop-color="#8FCE3C" />
											<stop offset="1" stop-color="#64A322" />
										</linearGradient>
										<linearGradient
											id="paint1_linear"
											x1="59.9981"
											y1="8.65109"
											x2="59.9981"
											y2="111.344"
											gradientUnits="userSpaceOnUse"
										>
											<stop stop-color="#8FCE3C" />
											<stop offset="1" stop-color="#64A322" />
										</linearGradient>
									</defs>
								</svg>
							</button>
						</div>
					</td>
					<td>
						{#if row.description}
							<details class="show-more">
								<summary class="clickable"> Further Details </summary>
								<div class="info-box">
									{row.description}
								</div>
							</details>
						{:else}
							-
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.map-icon {
		cursor: pointer;
		color: #2563eb;
		text-decoration: none;
		transition: color 0.2s ease-in-out;
		display: inline-flex;
		align-items: center;
		padding: 0;
		margin: 0 2px;
		width: 1em;
		height: 1em;
	}
	.clickable-icon {
		cursor: pointer;
		color: #2563eb;
		text-decoration: none;
		transition: color 0.2s ease-in-out;
		display: inline-flex;
		align-items: center;
		padding: 0;
		margin: 0 2px;
		width: 1em;
		height: 1em;
	}

	@media (max-width: 700px) {
		.clickable-icon {
			width: 1em;
			height: 1em;
			margin: 0 1px;
		}
	}
	.slider-group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 1.5rem 0;
		padding: 1rem;
		border: 1.5px solid #31497a;
		border-radius: 12px;
		background: #f6f8fc;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.08);
	}
	.slider-label {
		font-size: 1rem;
		font-weight: 500;
		color: #31497a;
		margin-bottom: 0.5rem;
	}
	.show-more {
		position: relative;
	}
	.category-group {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 1.5rem;
		padding: 1.5rem 1rem 1rem 1rem;
		margin: 2rem 0;
		border: 1.5px solid #31497a;
		border-radius: 12px;
		background: #f6f8fc;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.08);
	}

	.category-group legend {
		width: 100%;
		font-size: 1.15rem;
		font-weight: 600;
		color: #31497a;
		margin-bottom: 0.7rem;
		padding: 0 0.5rem;
		letter-spacing: 0.2px;
	}

	.category-group label {
		display: flex;
		align-items: center;
		gap: 0.7em;
		font-size: 1.07rem;
		font-weight: 500;
		color: #31497a;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 1px 4px rgba(66, 103, 178, 0.07);
		padding: 0.6em 1.1em;
		margin-bottom: 0.1em;
		cursor: pointer;
		transition:
			background 0.18s,
			box-shadow 0.18s,
			color 0.18s,
			transform 0.1s;
		border: 1.5px solid #31497a;
	}

	.category-group label:hover,
	.category-group input[type="checkbox"]:focus + span {
		background: #e9eef8;
		color: #4267b2;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.13);
		transform: translateY(-1px) scale(1.01);
	}

	.category-group input[type="checkbox"] {
		accent-color: #4267b2;
		width: 1.2em;
		height: 1.2em;
		margin-right: 0.3em;
		border-radius: 4px;
		border: 2px solid #31497a;
		box-shadow: 0 0 0 2px #e9eef8;
		transition: border 0.15s;
	}
	@media (max-width: 700px) {
		.category-group {
			flex-direction: row;
			flex-wrap: wrap;
			justify-content: flex-start;
			align-items: flex-start;
			gap: 0.3rem 0.5rem;
			padding: 0.3rem 0.2rem 0.2rem 0.2rem;
			margin: 0.5rem 0;
		}
		.category-group label {
			flex: 1 1 45%;
			min-width: 120px;
			max-width: 48%;
			margin-bottom: 0.2em;
			font-size: 0.8rem;
			padding: 0.3em 0.6em;
			border-radius: 6px;
			box-sizing: border-box;
		}
	}
	@media (max-width: 700px) {
		.category-group {
			gap: 0.3rem 0.5rem;
			padding: 0.3rem 0.2rem 0.2rem 0.2rem;
			margin: 0.5rem 0;
			flex-direction: column;
		}
		.category-group legend {
			font-size: 0.9rem;
			margin-bottom: 0.3rem;
			padding: 0 0.2rem;
		}
		.category-group label {
			font-size: 0.8rem;
			padding: 0.3em 0.6em;
			border-radius: 6px;
		}
		.category-group input[type="checkbox"] {
			width: 1em;
			height: 1em;
			margin-right: 0.2em;
		}
	}
	.links-container {
		display: flex;
		gap: 0rem;
	}
	.clickable {
		font-size: small;
		cursor: pointer;
		color: #2563eb;
		text-decoration: underline;
	}

	@media (max-width: 700px) {
		.clickable {
			font-size: 0.5rem;
			padding: 0.1em 0.3em;
		}
	}

	.info-box {
		font-size: 0.93rem;
		white-space: normal;
		background: #f6f8fc;
		border-radius: 8px;
		padding: 0.6rem 0.8rem;
		min-width: 180px;
		max-width: 400px;
		position: absolute;
		z-index: 10;
		top: 100%;
		left: 0;
		box-shadow: 0 1px 4px rgba(66, 103, 178, 0.10);
		border: 1px solid #31497a;
		color: #31497a;
	}

	/* Optional: Add a transition for smoothness */
	.info-box {
		transition: opacity 0.2s;
	}
	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-family: 'Inter', system-ui, sans-serif;
		background: #f6f8fc;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.08);
		border-radius: 12px;
		overflow: auto;
		margin: 2rem 0;
		border: 1.5px solid #31497a;
	}

	th,
	td {
		padding: 0.8rem 0.8rem;
		text-align: left;
	}

	th {
		background: #e9eef8;
		font-weight: 600;
		letter-spacing: 0.01em;
		color: #31497a;
		font-size: 1.07rem;
		border-bottom: 2px solid #31497a;
	}

	tr {
		transition:
			box-shadow 0.18s,
			background 0.18s;
	}

	tr:not(:last-child) td {
		border-bottom: 1.5px solid #e9eef8;
	}

	tr:hover {
		background: #e9eef8;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.13);
	}

	td {
		color: #31497a;
		font-size: 0.98rem;
		vertical-align: middle;
	}

	td button,
	td a {
		background: #fff;
		color: #2563eb;
		cursor: pointer;
		font-size: 0.98rem;
		padding: 0.2em 0.7em;
		transition:
			background 0.18s,
			color 0.18s,
			box-shadow 0.18s,
			transform 0.1s;
		box-shadow: 0 1px 4px rgba(66, 103, 178, 0.07);
	}

	td button:hover,
	td a:hover {
		background: #e9eef8;
		color: #4267b2;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.13);
		transform: translateY(-1px) scale(1.01);
	}

	.links-container {
		display: flex;
		gap: 0.2rem;
	}

	@media (max-width: 900px) {
		th,
		td {
			padding: 0.8rem 0.7rem;
			font-size: 0.97rem;
		}
	}

	@media (max-width: 700px) {
		table {
			display: block;
			width: 100%;
			overflow-x: auto;
			border-radius: 12px;
			margin: 1rem 0;
			border: 1.5px solid #31497a;
			background: #f6f8fc;
			box-shadow: 0 2px 8px rgba(66, 103, 178, 0.08);
		}
		thead {
			display: table-header-group;
			background: #e9eef8;
			position: sticky;
			top: 0;
			z-index: 2;
		}
		th {
			font-size: 0.5rem;
			padding: 0.7rem 0.5rem;
			background: #e9eef8;
			position: sticky;
			top: 0;
			z-index: 2;
			border-bottom: 2px solid #31497a;
		}
		tbody,
		tr,
		td {
			display: table-row-group;
			width: 100%;
		}
		tr {
			display: table-row;
			margin-bottom: 0;
			box-shadow: none;
			border-radius: 0;
			background: #f6f8fc;
			border: none;
		}
		td {
			display: table-cell;
			padding: 0.7rem 0.5rem;
			border-bottom: 1px solid #e9eef8;
			position: relative;
			font-size: 0.5rem;
			vertical-align: top;
			word-break: break-word;
		}
		td:before {
			display: none;
		}
	}

	@media (max-width: 500px) {
		table {
			font-size: 0.5rem;
		}
		th, td {
			padding: 0.5rem 0.3rem;
		}
	}

	/* Optional: Make table horizontally scrollable on very small screens */
	@media (max-width: 700px) {
		.table-responsive {
			width: 100%;
			overflow-x: auto;
		}
	}
</style>
