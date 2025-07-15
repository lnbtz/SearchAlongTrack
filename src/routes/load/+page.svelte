<script lang="ts">

	import { gpxTrackStore, tableDataStore } from '$lib/stores';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
	import type { TableRow } from '$lib/results';
	import { handleGpxTrack } from '$lib/util';
	import { goto } from '$app/navigation';


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


	function loadTrack(trackName: string) {
		const track = allTracks[trackName];
		if (track) {
			gpxTrackStore.set(track);
			tableDataStore.set(allTables[trackName] || []);
			handleGpxTrack();
			console.log(`Loaded track: ${trackName}`);
		} else {
			console.error(`Track not found: ${trackName}`);
		}
		goto('/map');
	}


	function deleteTrack(trackName: string) {
		if (allTracks[trackName]) {
			delete allTracks[trackName];
			gpxTrackStore.set(null);
			tableDataStore.set([]);
			localStorage.removeItem(`track-${trackName}`);
			localStorage.removeItem(`table-${trackName}`);
			console.log(`Deleted track: ${trackName}`);
		} else {
			console.error(`Track not found for deletion: ${trackName}`);
		}
	}
</script>

<div class="info-banner">
	<h2>Saved Tracks</h2>
	{#if Object.keys(allTracks).length === 0}
		<p class="no-tracks-message">
			<strong>No saved tracks found.</strong>
		</p>
		<ul>
			<li>
				<span class="highlight">1. Upload</span> a GPX file. Come back here to view and manage your tracks.
			</li>
			<li>
				Your uploaded tracks will appear here for easy access.
			</li>
		</ul>
	{:else}
		<p class="no-tracks-message">Manage your previously uploaded GPX tracks:</p>
		<ul>
			<li>
				<span class="highlight">Load</span> a track to view it on the map.
			</li>
			<li>
				<span class="highlight">Delete</span> a track to remove it from your saved list.
			</li>
		</ul>
	{/if}
</div>

<div>
	<ul class="track-list">
		{#each Object.entries(allTracks) as [trackName, track]}
			<li class="track-item">
				<span class="track-name">{track.features[0]?.properties?.name || trackName}</span>
				<div class="track-actions">
					<button
						class="load-btn"
						onclick={() => {
							loadTrack(trackName)
						}}
					>
						Load
					</button>
					<button
						class="delete-btn"
						onclick={() => {
							deleteTrack(trackName)
						}}
						aria-label="Delete track"
					>
						<svg class="trash-icon" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6m4-6v6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.no-tracks-message{
		text-align: center;
		font-size: 1.1rem;
		color: #4f5fff;
		margin: 1rem 0;
	}
	.info-banner {
		background: linear-gradient(90deg, #e0e7ff 0%, #f0f4ff 100%);
		border: 1.5px solid #31497a;
		border-radius: 12px;
		padding: 1.5rem 2rem;
		margin: 2rem auto 1.5rem auto;
		max-width: 480px;
		box-shadow: 0 2px 12px rgba(60, 80, 180, 0.07);
		text-align: center;
	}
	.info-banner h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.35rem;
		color: #31497a;
		font-weight: 700;
		letter-spacing: 0.01em;
	}
	.info-banner p {
		color: #4f5fff;
		font-size: 1.05rem;
		margin-bottom: 0.7rem;
	}
	.info-banner ul {
		list-style: disc inside;
		color: #2d3a5a;
		font-size: 0.98rem;
		margin: 0.5rem 0 0 0;
		padding: 0;
	}
	.info-banner li {
		margin-bottom: 0.2rem;
	}
	.info-banner .highlight {
		background: #dbeafe;
		color: #31497a;
		padding: 0.1em 0.35em;
		border-radius: 0.4em;
		font-weight: 600;
	}
	.track-list {
		margin: 2rem 0;
		padding: 0;
		list-style: none;
		max-width: 600px;
	}

	.track-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.2rem 1.5rem;
		margin-bottom: 1.2rem;
		background: #f6f8fc;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.08);
		border: 1.5px solid #31497a;
		transition: box-shadow 0.18s, transform 0.12s, border 0.18s;
	}

	.track-item:hover {
		box-shadow: 0 4px 16px rgba(66, 103, 178, 0.13);
		transform: translateY(-1px) scale(1.01);
		border-color: #4267b2;
	}

	.track-name {
		font-weight: 600;
		font-size: 1.13rem;
		color: #31497a;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 260px;
		letter-spacing: 0.01em;
	}

	.track-actions {
		display: flex;
		gap: 0.5rem;
	}

	.load-btn {
		background: #4267b2;
		color: white;
		border: 1.5px solid #31497a;
		padding: 0.4rem 0.9rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.1s;
		box-shadow: 0 1px 4px rgba(66, 103, 178, 0.07);
	}

	.load-btn:hover {
		background: #31497a;
		color: #fff;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.13);
		transform: translateY(-1px) scale(1.01);
	}

	.delete-btn {
		background: #fff;
		color: #ef4444;
		border: 1.5px solid #ef4444;
		padding: 0.4rem 0.7rem;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.1s;
		box-shadow: 0 1px 4px rgba(66, 103, 178, 0.07);
	}

	.delete-btn:hover {
		background: #ffeaea;
		color: #b91c1c;
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.13);
		transform: translateY(-1px) scale(1.01);
	}

	.trash-icon {
		width: 1em;
		height: 1em;
		fill: currentColor;
	}

	@media (max-width: 600px) {
		.track-item {
			padding: 0.8rem 0.7rem;
			margin-bottom: 0.7rem;
		}
		.track-name {
			max-width: 120px;
			font-size: 1rem;
		}
	}


</style>
