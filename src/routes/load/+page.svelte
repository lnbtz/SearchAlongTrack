<script lang="ts">
	import { gpxTrackStore, tableDataStore } from '$lib/stores';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
	import type { TableRow } from '$lib/results';
	import { handleGpxTrack } from '$lib/util';
	import { goto } from '$app/navigation';
	import { saveTable, saveTrack, loadAll, deleteTrackData, saveLastTrackName } from '$lib/storage';

	function shorten(text: string, max = 30) {
		if (!text) return '';
		return text.length > max ? text.slice(0, max - 1) + '…' : text;
	}

	let allTracks: Record<string, FeatureCollection<Geometry, GeoJsonProperties>> = $state({});
	let allTables: Record<string, TableRow[]> = $state({});
	let gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = null;
	let tableData: TableRow[] = [];
	tableDataStore.subscribe(async (content) => {
		if (content) {
			tableData = content;
			gpxTrack = get(gpxTrackStore);
			let trackName = gpxTrack?.features[0]?.properties?.name || createTrackHash(gpxTrack);
			if (trackName) {
				// Persist into IndexedDB
				try {
					await Promise.all([
						saveTable(trackName, tableData),
						gpxTrack ? saveTrack(trackName, gpxTrack) : Promise.resolve()
					]);
				} catch (e) {
					console.error('Failed saving to IndexedDB', e);
				}
			}
		} else {
			tableData = [];
		}
	});
	onMount(async () => {
		try {
			const { tracks, tables } = await loadAll();
			allTracks = tracks;
			allTables = tables;
		} catch (e) {
			console.error('Failed loading from IndexedDB', e);
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

	async function loadTrack(trackName: string) {
		const track = allTracks[trackName];
		if (track) {
			gpxTrackStore.set(track);
			tableDataStore.set(allTables[trackName] || []);
			handleGpxTrack();
			await saveLastTrackName(trackName);
			console.log(`Loaded track: ${trackName}`);
		} else {
			console.error(`Track not found: ${trackName}`);
		}
		goto('/map');
	}

	async function deleteTrack(trackName: string) {
		if (allTracks[trackName]) {
			delete allTracks[trackName];
			gpxTrackStore.set(null);
			tableDataStore.set([]);
			try {
				await deleteTrackData(trackName);
				console.log(`Deleted track: ${trackName}`);
			} catch (e) {
				console.error('Failed deleting from IndexedDB', e);
			}
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
			<li>Your uploaded tracks will appear here for easy access.</li>
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

<div class="tracks-card">
	<header class="tracks-head">
		<h3>Your tracks</h3>
		<p class="muted">Load to view on map or delete to remove from storage.</p>
	</header>
	<ul class="track-list">
		{#each Object.entries(allTracks) as [trackName, track] (trackName)}
			<li class="track-item">
				<span
					class="track-name"
					title={track.features[0]?.properties?.name || trackName}
					aria-label={track.features[0]?.properties?.name || trackName}
				>
					{shorten(track.features[0]?.properties?.name || trackName)}
				</span>
				<div class="track-actions">
					<button
						class="load-btn"
						onclick={() => {
							loadTrack(trackName);
						}}
					>
						Load
					</button>
					<button
						class="delete-btn"
						onclick={() => {
							deleteTrack(trackName);
						}}
						aria-label="Delete track"
					>
						<svg
							class="trash-icon"
							viewBox="0 0 24 24"
							aria-hidden="true"
							style="display: block; margin: auto;"
						>
							<path
								d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6m4-6v6"
								stroke="#fff"
								stroke-width="2"
								fill="none"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.no-tracks-message {
		text-align: center;
		font-size: 1.1rem;
		color: #4f5fff;
		margin: 1rem 0;
	}
	.info-banner {
		position: relative;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 1.25rem 1.5rem 1.25rem 1.75rem;
		margin: 1.25rem auto;
		max-width: 620px;
		box-shadow: var(--shadow-sm);
		text-align: center;
	}
	.info-banner::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
		border-radius: var(--radius-md) 0 0 var(--radius-md);
		background: linear-gradient(180deg, var(--primary) 0%, var(--primary-700) 100%);
	}
	.info-banner h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.35rem;
		color: var(--text);
		font-weight: 800;
		letter-spacing: 0.01em;
	}
	.info-banner p {
		color: var(--text);
		opacity: 0.9;
		font-size: 1.02rem;
		margin-bottom: 0.5rem;
	}
	.info-banner ul {
		list-style: disc inside;
		color: var(--text);
		opacity: 0.9;
		font-size: 0.98rem;
		margin: 0.5rem 0 0 0;
		padding: 0;
		text-align: left;
		display: inline-block;
	}
	.tracks-card {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-elevated);
		box-shadow: var(--shadow-md);
		max-width: 820px;
		margin: 1.5rem auto;
		overflow: visible;
	}
	.tracks-head {
		padding: 0.85rem 1rem;
		border-bottom: 1px solid var(--border);
		background: color-mix(in oklab, var(--primary) 6%, var(--bg));
		text-align: center;
	}
	.tracks-head h3 {
		margin: 0;
		font-weight: 800;
	}
	.tracks-head .muted {
		margin: 0.25rem 0 0 0;
		color: var(--text-muted);
	}
	.track-list {
		margin: 1rem auto;
		padding: 1rem;
		list-style: none;
		max-width: 720px;
		display: grid;
		gap: 1rem;
	}

	.track-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 1rem 1rem;
		width: 100%;
		background: var(--bg);
		border-radius: 12px;
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--border);
		transition:
			box-shadow 0.18s,
			transform 0.12s,
			border 0.18s;
		/* allow buttons to remain fully visible */
		overflow: visible;
	}

	.track-item:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
		border-color: color-mix(in oklab, var(--primary) 35%, var(--border));
	}

	.track-name {
		font-weight: 700;
		font-size: 1.02rem;
		color: var(--text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		/* allow the name to shrink while actions stay visible */
		flex: 1 1 auto;
		min-width: 0;
		letter-spacing: 0.01em;
	}

	.track-actions {
		display: flex;
		gap: 0.5rem;
		flex: 0 0 auto;
	}
	.track-actions .load-btn,
	.track-actions .delete-btn {
		flex: 0 0 auto;
	}

	.load-btn {
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%);
		color: #fff;
		border: 1px solid color-mix(in oklab, var(--primary) 40%, transparent);
		padding: 0.4rem 0.85rem;
		border-radius: 10px;
		cursor: pointer;
		font-size: 0.95rem;
		box-shadow: 0 10px 18px rgba(59, 130, 246, 0.25);
	}

	.load-btn:hover {
		transform: translateY(-1px);
	}

	.delete-btn {
		background: #ef4444;
		color: #fff;
		border: 1px solid #ef4444;
		padding: 0.4rem 0.7rem;
		border-radius: 10px;
		cursor: pointer;
		display: flex;
		align-items: center;
		box-shadow: 0 10px 18px rgba(239, 68, 68, 0.18);
	}

	.delete-btn:hover {
		transform: translateY(-1px);
	}

	.delete-btn .trash-icon {
		stroke: #fff;
	}

	.trash-icon {
		width: 1.2rem;
		height: 1.2rem;
		stroke-width: 2;
		stroke: currentColor;
		fill: none;
	}
	@media (max-width: 600px) {
		.track-item {
			padding: 0.8rem 0.7rem;
			gap: 0.5rem;
		}
		.track-name {
			font-size: 1rem;
		}
		.load-btn {
			padding: 0.35rem 0.65rem;
			font-size: 0.9rem;
		}
		.delete-btn {
			padding: 0.35rem 0.6rem;
		}
	}

	@media (max-width: 380px) {
		.load-btn {
			padding: 0.3rem 0.56rem;
			font-size: 0.85rem;
		}
		.delete-btn {
			padding: 0.3rem 0.5rem;
		}
	}

	/* Portrait-first safety: on very narrow screens, stack actions below the name */
	@media (max-width: 420px) {
		.track-item {
			flex-wrap: wrap;
		}
		.track-name {
			flex-basis: 100%;
			margin-bottom: 0.25rem;
		}
		.track-actions {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>
