<script lang="ts">
	import { OSMCategories, OSMCategoriesMap } from '$lib/osm-constants';
	import { selectedCategoriesStore, selectedRadiusStore } from '$lib/stores';
	import { recomputeTableDataDisplay } from '$lib/util';
	import { onMount } from 'svelte';
	import { getCategoryIconUrl } from '$lib/icons';

	let panelOpen = $state(true);

	let selectedCategories: string[] = $state($selectedCategoriesStore);

	function togglePanel() {
		panelOpen = !panelOpen;
	}

	function onRadiusChange() {
		recomputeTableDataDisplay();
	}

	function checkBox(category: string, e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		if (checked) {
			selectedCategories = [...selectedCategories, category];
		} else {
			selectedCategories = selectedCategories.filter((c) => c !== category);
		}
		selectedCategoriesStore.set(selectedCategories);
		recomputeTableDataDisplay();
	}

	// Initialize defaults on first mount so results show immediately
	onMount(() => {
		// Sync the local state with the store
		selectedCategories = $selectedCategoriesStore;

		// Set defaults if needed (these will be handled by session manager now)
		if ($selectedCategoriesStore.length === 0) {
			const all = Array.from(OSMCategoriesMap.keys());
			selectedCategoriesStore.set(all);
			selectedCategories = all;
		}
		if ($selectedRadiusStore === 0) {
			selectedRadiusStore.set(500);
		}
		// Trigger an initial recompute
		recomputeTableDataDisplay();
	});

	// React to store changes (e.g., when session is loaded)
	selectedCategoriesStore.subscribe((categories) => {
		selectedCategories = categories;
	});
</script>

<div class="controls">
	<button
		class="toggle"
		onclick={togglePanel}
		aria-expanded={panelOpen}
		aria-controls="controls-panel"
	>
		{panelOpen ? 'Hide filters' : 'Show filters'}
	</button>
	{#if panelOpen}
		<div id="controls-panel" class="panel">
			<section class="radius-section">
				<div class="radius-group">
					<label for="radius-input" class="radius-label">
						Search Radius (meters): {$selectedRadiusStore}m
					</label>
					<input
						id="radius-input"
						type="range"
						min="100"
						max="5000"
						step="100"
						value={$selectedRadiusStore}
						oninput={(e) => {
							const value = parseInt((e.target as HTMLInputElement).value);
							selectedRadiusStore.set(value);
							onRadiusChange();
						}}
					/>
					<div class="radius-bounds">
						<span>100m</span>
						<span>5000m</span>
					</div>
				</div>
			</section>
			<fieldset class="category-group">
				<legend>
					<h3>Filter by Category</h3>
					<p>Select which categories to show on the map and in the table.</p>
				</legend>

				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.VENDING_MACHINE}
						checked={selectedCategories.includes(OSMCategories.value.VENDING_MACHINE)}
						onchange={(e) => checkBox(OSMCategories.value.VENDING_MACHINE, e)}
					/>
					Vending Machines<img
						src={getCategoryIconUrl(OSMCategories.value.VENDING_MACHINE)}
						alt="Vending Machines"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.FUEL}
						checked={selectedCategories.includes(OSMCategories.value.FUEL)}
						onchange={(e) => checkBox(OSMCategories.value.FUEL, e)}
					/>
					Gas Stations<img
						src={getCategoryIconUrl(OSMCategories.value.FUEL)}
						alt="Gas Stations"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.SUPERMARKET}
						checked={selectedCategories.includes(OSMCategories.value.SUPERMARKET)}
						onchange={(e) => checkBox(OSMCategories.value.SUPERMARKET, e)}
					/>
					Supermarkets<img
						src={getCategoryIconUrl(OSMCategories.value.SUPERMARKET)}
						alt="Supermarkets"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.SHELTER}
						checked={selectedCategories.includes(OSMCategories.value.SHELTER)}
						onchange={(e) => checkBox(OSMCategories.value.SHELTER, e)}
					/>
					Shelters<img
						src={getCategoryIconUrl(OSMCategories.value.SHELTER)}
						alt="Shelters"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.BAKERY}
						checked={selectedCategories.includes(OSMCategories.value.BAKERY)}
						onchange={(e) => checkBox(OSMCategories.value.BAKERY, e)}
					/>
					Bakery<img
						src={getCategoryIconUrl(OSMCategories.value.BAKERY)}
						alt="Bakery"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.KIOSK}
						checked={selectedCategories.includes(OSMCategories.value.KIOSK)}
						onchange={(e) => checkBox(OSMCategories.value.KIOSK, e)}
					/>
					Kiosks<img
						src={getCategoryIconUrl(OSMCategories.value.KIOSK)}
						alt="Kiosks"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.DRINKING_WATER}
						checked={selectedCategories.includes(OSMCategories.value.DRINKING_WATER)}
						onchange={(e) => checkBox(OSMCategories.value.DRINKING_WATER, e)}
					/>
					Drinking Water<img
						src={getCategoryIconUrl(OSMCategories.value.DRINKING_WATER)}
						alt="Drinking Water"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.TOILETS}
						checked={selectedCategories.includes(OSMCategories.value.TOILETS)}
						onchange={(e) => checkBox(OSMCategories.value.TOILETS, e)}
					/>
					Toilets<img
						src={getCategoryIconUrl(OSMCategories.value.TOILETS)}
						alt="Toilets"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.key.ICE_CAFE}
						checked={selectedCategories.includes(OSMCategories.key.ICE_CAFE)}
						onchange={(e) => checkBox(OSMCategories.key.ICE_CAFE, e)}
					/>
					Cafés & Ice Cream<img
						src={getCategoryIconUrl(OSMCategories.key.ICE_CAFE)}
						alt="Cafés & Ice Cream"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.RESTAURANT}
						checked={selectedCategories.includes(OSMCategories.value.RESTAURANT)}
						onchange={(e) => checkBox(OSMCategories.value.RESTAURANT, e)}
					/>
					Restaurants<img
						src={getCategoryIconUrl(OSMCategories.value.RESTAURANT)}
						alt="Restaurants"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.FAST_FOOD}
						checked={selectedCategories.includes(OSMCategories.value.FAST_FOOD)}
						onchange={(e) => checkBox(OSMCategories.value.FAST_FOOD, e)}
					/>
					Fast Food<img
						src={getCategoryIconUrl(OSMCategories.value.FAST_FOOD)}
						alt="Fast Food"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.value.CAMP_SITE}
						checked={selectedCategories.includes(OSMCategories.value.CAMP_SITE)}
						onchange={(e) => checkBox(OSMCategories.value.CAMP_SITE, e)}
					/>
					Camp Sites<img
						src={getCategoryIconUrl(OSMCategories.value.CAMP_SITE)}
						alt="Camp Sites"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.key.ACCOMMODATION}
						checked={selectedCategories.includes(OSMCategories.key.ACCOMMODATION)}
						onchange={(e) => checkBox(OSMCategories.key.ACCOMMODATION, e)}
					/>
					Accommodations<img
						src={getCategoryIconUrl(OSMCategories.key.ACCOMMODATION)}
						alt="Accommodations"
						style="width: 24px; height: 24px;"
					/>
				</label>
				<label>
					<input
						type="checkbox"
						value={OSMCategories.key.BICYCLE_REPAIR}
						checked={selectedCategories.includes(OSMCategories.key.BICYCLE_REPAIR)}
						onchange={(e) => checkBox(OSMCategories.key.BICYCLE_REPAIR, e)}
					/>
					Bicycle Repair<img
						src={getCategoryIconUrl(OSMCategories.key.BICYCLE_REPAIR)}
						alt="Bicycle Repair"
						style="width: 24px; height: 24px;"
					/>
				</label>
			</fieldset>
		</div>
	{/if}
</div>

<style>
	.controls {
		position: absolute;
		top: 12px;
		left: 12px;
		right: auto;
		z-index: 20;
	}
	.toggle {
		appearance: none;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.35rem 0.75rem;
		background: color-mix(in oklab, var(--bg-elevated) 70%, transparent);
		backdrop-filter: blur(8px);
		box-shadow: var(--shadow-sm);
		color: var(--text);
		cursor: pointer;
		font-weight: 600;
	}
	.toggle:hover {
		box-shadow: var(--shadow-md);
	}

	.panel {
		margin-top: 8px;
		padding: 0.5rem 0.6rem;
		min-width: 300px;
		max-width: min(88vw, 500px);
		/* keep the panel compact to avoid internal scrollbar */
		max-height: none;
		overflow: visible;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: color-mix(in oklab, var(--bg-elevated) 90%, transparent);
		backdrop-filter: blur(6px) saturate(140%);
		box-shadow: var(--shadow-md);
	}

	.radius-section {
		margin-bottom: 0.5rem;
	}

	.radius-group {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.5rem;
	}

	.radius-label {
		display: block;
		font-size: 0.85rem;
		color: var(--text-muted);
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.radius-group input[type='range'] {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: var(--border);
		outline: none;
		appearance: none;
		margin: 0.25rem 0;
	}

	.radius-group input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.radius-group input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.radius-bounds {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 0.25rem;
	}

	.category-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.5rem;
		padding: 0.4rem;
		margin-top: 0.4rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg);
	}
	.category-group legend {
		width: 100%;
		margin: 0 0 0.25rem 0;
	}
	.category-group h3 {
		margin: 0;
		font-size: 1rem;
	}
	.category-group p {
		margin: 0.15rem 0 0 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.category-group label {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text);
		background: var(--bg-elevated);
		border-radius: 8px;
		box-shadow: var(--shadow-sm);
		padding: 0.25em 0.45em;
		cursor: pointer;
		border: 1px solid var(--border);
	}
	.category-group input[type='checkbox'] {
		accent-color: var(--primary);
		width: 0.95em;
		height: 0.95em;
		border-radius: 4px;
	}
	.category-group label img {
		width: 18px;
		height: 18px;
	}

	@media (max-width: 560px) {
		.panel {
			min-width: 260px;
		}
	}
</style>
