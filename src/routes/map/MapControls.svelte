<script lang="ts">
	import { OSMCategories, OSMCategoriesMap } from '$lib/osm-constants';
	import {
		selectedCategoriesStore,
		selectedEndRangeStore,
		selectedRadiusStore,
		selectedStartRangeStore,
		totalTrackLengthStore
	} from '$lib/stores';
	import { calculateSelectedRangeTrackStore, recomputeTableDataDisplay } from '$lib/util';
    import RangeSlider from 'svelte-range-slider-pips';
    import { onMount } from 'svelte';

let panelOpen = $state(true);

let selectedCategories: string[] = $state(
	$selectedCategoriesStore.length === 0 ? Array.from(OSMCategoriesMap.keys()) : $selectedCategoriesStore
);

let radiusValue: number = $state($selectedRadiusStore);
    $effect(() => {
        selectedRadiusStore.set(radiusValue);
    });

let values: number[] = $state([$selectedStartRangeStore, $selectedEndRangeStore]);
    $effect(() => {
        selectedStartRangeStore.set(values[0]);
    });
    $effect(() => {
        selectedEndRangeStore.set(values[1]);
    });
    $effect(() => {
        values = [$selectedStartRangeStore, $selectedEndRangeStore];
    });

	function togglePanel() {
		panelOpen = !panelOpen;
	}

	function onRangeChange() {
		calculateSelectedRangeTrackStore();
		recomputeTableDataDisplay();
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
        if ($selectedCategoriesStore.length === 0) {
            const all = Array.from(OSMCategoriesMap.keys());
            selectedCategoriesStore.set(all);
            selectedCategories = all;
        }
        if ($selectedRadiusStore === 0) {
            selectedRadiusStore.set(1000);
            radiusValue = 1000;
        }
        // Trigger an initial recompute
        calculateSelectedRangeTrackStore();
        recomputeTableDataDisplay();
    });
</script>

<div class="controls">
    <button class="toggle" onclick={togglePanel} aria-expanded={panelOpen} aria-controls="controls-panel">
		{panelOpen ? 'Hide filters' : 'Show filters'}
	</button>
	{#if panelOpen}
		<div id="controls-panel" class="panel">
			<section class="sliders">
				<div class="slider-group">
					<label for="selected-range-slider" class="slider-label">
						Select Range (in km): start: {$selectedStartRangeStore} km, end: {$selectedEndRangeStore} km
					</label>
                    <!-- svelte-ignore event_directive_deprecated -->
                    <RangeSlider
						bind:values
						min={0}
						max={$totalTrackLengthStore}
						pips
						first="label"
						last="label"
						rest="pip"
                        on:change={onRangeChange}
					/>
				</div>
				<div class="slider-group">
					<label for="radius-slider" class="slider-label">
						Select Radius (in m): {$selectedRadiusStore} m
					</label>
                    <!-- svelte-ignore event_directive_deprecated -->
                    <RangeSlider bind:value={radiusValue} min={100} max={5000} step={100} pips first="label" last="label" on:change={onRadiusChange} />
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
					Vending Machines
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.FUEL}
						checked={selectedCategories.includes(OSMCategories.value.FUEL)}
                        onchange={(e) => checkBox(OSMCategories.value.FUEL, e)}
					/>
					Gas Stations
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.SUPERMARKET}
						checked={selectedCategories.includes(OSMCategories.value.SUPERMARKET)}
                        onchange={(e) => checkBox(OSMCategories.value.SUPERMARKET, e)}
					/>
					Supermarkets
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.SHELTER}
						checked={selectedCategories.includes(OSMCategories.value.SHELTER)}
                        onchange={(e) => checkBox(OSMCategories.value.SHELTER, e)}
					/>
					Shelters
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.BAKERY}
						checked={selectedCategories.includes(OSMCategories.value.BAKERY)}
                        onchange={(e) => checkBox(OSMCategories.value.BAKERY, e)}
					/>
					Bakery
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.KIOSK}
						checked={selectedCategories.includes(OSMCategories.value.KIOSK)}
                        onchange={(e) => checkBox(OSMCategories.value.KIOSK, e)}
					/>
					Kiosks
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.DRINKING_WATER}
						checked={selectedCategories.includes(OSMCategories.value.DRINKING_WATER)}
                        onchange={(e) => checkBox(OSMCategories.value.DRINKING_WATER, e)}
					/>
					Drinking Water
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.TOILETS}
						checked={selectedCategories.includes(OSMCategories.value.TOILETS)}
                        onchange={(e) => checkBox(OSMCategories.value.TOILETS, e)}
					/>
					Toilets
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.key.ICE_CAFE}
						checked={selectedCategories.includes(OSMCategories.key.ICE_CAFE)}
                        onchange={(e) => checkBox(OSMCategories.key.ICE_CAFE, e)}
					/>
					Cafés & Ice Cream
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.RESTAURANT}
						checked={selectedCategories.includes(OSMCategories.value.RESTAURANT)}
                        onchange={(e) => checkBox(OSMCategories.value.RESTAURANT, e)}
					/>
					Restaurants
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.value.CAMP_SITE}
						checked={selectedCategories.includes(OSMCategories.value.CAMP_SITE)}
                        onchange={(e) => checkBox(OSMCategories.value.CAMP_SITE, e)}
					/>
					Camp Sites
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.key.ACCOMMODATION}
						checked={selectedCategories.includes(OSMCategories.key.ACCOMMODATION)}
                        onchange={(e) => checkBox(OSMCategories.key.ACCOMMODATION, e)}
					/>
					Accommodations
				</label>
				<label>
                    <input
						type="checkbox"
						value={OSMCategories.key.BICYCLE_REPAIR}
						checked={selectedCategories.includes(OSMCategories.key.BICYCLE_REPAIR)}
                        onchange={(e) => checkBox(OSMCategories.key.BICYCLE_REPAIR, e)}
					/>
					Bicycle Repair
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
	.toggle:hover { box-shadow: var(--shadow-md); }

	.panel {
		margin-top: 10px;
		padding: 0.75rem 0.85rem;
		min-width: 320px;
		max-width: min(88vw, 520px);
		max-height: min(68vh, 560px);
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: color-mix(in oklab, var(--bg-elevated) 85%, transparent);
		backdrop-filter: blur(8px) saturate(140%);
		box-shadow: var(--shadow-md);
	}

	.sliders { display: grid; gap: 0.6rem; }
	.slider-group {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.6rem;
	}
	.slider-label { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; }

	.category-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.6rem;
		padding: 0.6rem;
		margin-top: 0.6rem;
		border: 1px dashed var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg);
	}
	.category-group legend { width: 100%; margin: 0 0 0.25rem 0; }
	.category-group h3 { margin: 0; font-size: 1rem; }
	.category-group p { margin: 0.15rem 0 0 0; font-size: 0.85rem; color: var(--text-muted); }
	.category-group label {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--text);
		background: var(--bg-elevated);
		border-radius: 8px;
		box-shadow: var(--shadow-sm);
		padding: 0.35em 0.7em;
		cursor: pointer;
		border: 1px solid var(--border);
	}
	.category-group input[type='checkbox'] {
		accent-color: var(--primary);
		width: 1.05em;
		height: 1.05em;
		border-radius: 4px;
	}

	@media (max-width: 560px) {
		.panel { min-width: 260px; }
	}
</style>
