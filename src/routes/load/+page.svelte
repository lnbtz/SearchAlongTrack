<script lang="ts">
	import { page } from '$app/state';
	import { gpxTrackStore, tableDataStore } from '$lib/stores';
	import { get } from 'svelte/store';
	import Header from '../Header.svelte';
	import { gpx } from '@mapbox/togeojson';
	import { onMount } from 'svelte';
	import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
	import type { TableRow } from '$lib/results';

	let { children } = $props();

	let allTracks: Record<string, FeatureCollection<Geometry, GeoJsonProperties>> = $state({});
	let allTables: Record<string, TableRow[]> = $state({});
	let gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = null;
	let tableData: TableRow[] = [];
	tableDataStore.subscribe((content) => {
		if (content) {
			tableData = content;
			gpxTrack = get(gpxTrackStore);
			let trackName = gpxTrack?.features[0]?.properties?.name || createTrackHash(gpxTrack);
			if (trackName) {
				localStorage.setItem(`table-${trackName}`, JSON.stringify(tableData));
				localStorage.setItem(`track-${trackName}`, JSON.stringify(gpxTrack));
			}
		} else {
			tableData = [];
		}
	});
	onMount(() => {
		const tracks: Record<string, FeatureCollection<Geometry, GeoJsonProperties>> = {};
		const tables: Record<string, TableRow[]> = {};
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key) continue;
			if (key.startsWith('track-')) {
				const trackData = localStorage.getItem(key);
				if (trackData) {
					allTracks[key.replace('track-', '')] = JSON.parse(trackData);
				}
			}
			if (key.startsWith('table-')) {
				const tableData = localStorage.getItem(key);
				if (tableData) {
					allTables[key.replace('table-', '')] = JSON.parse(tableData);

					console.log('Loaded tracks:', allTracks);
					console.log('Loaded tables:', allTables);
				}
			}
		}
	});

	function createTrackHash(
		gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null
	): string {
		if (!gpxTrack) {
			return '';
		}
		const str = JSON.stringify(gpxTrack);
		let hash = 0,
			i,
			chr;
		for (i = 0; i < str.length; i++) {
			chr = str.charCodeAt(i);
			hash = (hash << 5) - hash + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return `track-${Math.abs(hash)}`;
	}
</script>

<div>
	<ul class="track-list">
		{#each Object.entries(allTracks) as [trackName, track]}
			<li class="track-item">
				<span class="track-name">{track.features[0]?.properties?.name || trackName}</span>
				<div class="track-actions">
					<button
						class="load-btn"
						onclick={() => {
							/* loadTrack(trackName) */
						}}
					>
						Load
					</button>
					<button
						class="delete-btn"
						onclick={() => {
							/* deleteTrack(trackName) */
						}}
						aria-label="Delete track"
					>
						<svg class="trash-icon" viewBox="0 0 24 24">
							<path
								d="M3 6h18M9 6v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6m-7 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
							/>
						</svg>
					</button>
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.track-list {
		margin: 2rem 0;
		padding: 0;
		list-style: none;
		max-width: 500px;
	}
	.track-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		margin-bottom: 0.5rem;
		background: #f8f9fa;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}
	.track-name {
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 220px;
	}
	.track-actions {
		display: flex;
		gap: 0.5rem;
	}
	.load-btn {
		background: #2563eb;
		color: white;
		border: none;
		padding: 0.4rem 0.9rem;
		border-radius: 5px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.2s;
	}
	.load-btn:hover {
		background: #1d4ed8;
	}
	.delete-btn {
		background: #ef4444;
		color: white;
		border: none;
		padding: 0.4rem 0.7rem;
		border-radius: 5px;
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: background 0.2s;
	}
	.delete-btn:hover {
		background: #b91c1c;
	}
	.trash-icon {
		width: 1em;
		height: 1em;
		fill: currentColor;
	}
</style>
