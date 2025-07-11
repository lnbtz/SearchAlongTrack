<script lang="ts">
	import toGeoJSON from '@mapbox/togeojson';
	import { gpxTrackStore } from '$lib/stores';
	import { handleGpxTrack } from '$lib/util';

	let loading = false;
	let progress = 0;
	let showTrackLoadedBanner = false;

	function handleChange(e: Event) {
		showTrackLoadedBanner = true;
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		loading = true;
		progress = 0;

		const reader = new FileReader();
		reader.onprogress = (event) => {
			if (event.lengthComputable) {
				progress = Math.round((event.loaded / event.total) * 100);
			}
		};
		reader.onload = () => {
			const xml = new DOMParser().parseFromString(reader.result as string, 'application/xml');
			const geojson = toGeoJSON.gpx(xml);
			gpxTrackStore.set(geojson);
			handleGpxTrack();
			loading = false;
			progress = 100;
		};
		reader.readAsText(file);
	}
</script>

{#if !loading && $gpxTrackStore?.features?.length}
	{#if showTrackLoadedBanner}
		<div class="track-info">
			<span class="track-icon">✅</span>
			<span class="track-name">
				{#if $gpxTrackStore?.features[0]?.properties?.name}
					{$gpxTrackStore.features[0].properties.name}
				{:else}
					Track loaded!
				{/if}
			</span>
			<button class="close-btn" onclick={() => (showTrackLoadedBanner = false)} aria-label="Close"
				>&times;</button
			>
		</div>
	{:else}
		<div class="centered-button">
			<button
				class="upload-new-btn"
				onclick={() => {
					gpxTrackStore.set(null);
					showTrackLoadedBanner = false;
				}}
			>
				Upload new GPX track
			</button>
		</div>
	{/if}
{:else}
	<div class="upload-container">
		<div class="upload-title">Load GPX File</div>
		<div class="upload-desc">
			1. Upload a GPX file to visualize your track on the map.<br />
			Drag &amp; drop or click below to select a file.
		</div>
		<label class="upload-label" for="file-input">
			<span class="upload-icon">📁</span>
			<span class="upload-text">{loading ? 'Uploading...' : 'Click or Drag GPX file here'}</span>
		</label>
		<input id="file-input" type="file" accept=".gpx" onchange={handleChange} />
		{#if loading}
			<div class="progress-bar">
				<div class="progress-bar-inner" style="--progress: {progress}%"></div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.centered-button {
		display: flex; 
		justify-content: center; 
		align-items: center; 
		margin-top: 2rem;
	}
	.upload-new-btn {
		background: #4267b2;
		color: #fff;
		border: 1.5px solid #31497a;
		padding: 10px 26px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 17px;
		font-weight: 500;
		letter-spacing: 0.5px;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.1);
		transition:
			background 0.2s,
			box-shadow 0.2s,
			transform 0.1s;
	}
	.upload-new-btn:hover {
		background: #365899;
		box-shadow: 0 4px 16px rgba(66, 103, 178, 0.18);
		transform: translateY(-1px) scale(1.02);
	}
	.upload-new-btn:active {
		background: #31497a;
		transform: scale(0.98);
		box-shadow: 0 1px 4px rgba(66, 103, 178, 0.08);
	}
	.upload-new-btn:focus {
		outline: none;
		box-shadow: 0 0 0 2px #a3bffa;
	}
	.close-btn {
		top: 1rem;
		right: 1rem;
		background: transparent;
		border: none;
		font-size: 1.2rem;
		color: #4f5fff;
		cursor: pointer;
		transition: color 0.2s;
	}

	.track-info {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f7fa;
		border-radius: 1rem;
		box-shadow: 0 2px 12px rgba(60, 80, 180, 0.08);
		padding: 1.5rem 2rem;
		margin: 2rem auto;
		max-width: 400px;
		gap: 1rem;
	}
	.track-icon {
		font-size: 1.1rem;
		color: #4f5fff;
	}
	.track-name {
		font-size: 1rem;
		font-weight: 600;
		color: #2d3a5a;
		letter-spacing: 0.01em;
	}
	.upload-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
		border-radius: 1rem;
		box-shadow: 0 4px 24px rgba(60, 80, 180, 0.08);
		max-width: 400px;
		margin: 2rem auto;
	}

	.upload-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #2d3a5a;
		margin-bottom: 0.5rem;
	}

	.upload-desc {
		color: #5a6b8a;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.upload-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #fff;
		border: 2px dashed #7b8cff;
		border-radius: 0.75rem;
		padding: 2rem 2.5rem;
		cursor: pointer;
		transition: border-color 0.2s;
		margin-bottom: 1rem;
	}

	.upload-label:hover {
		border-color: #4f5fff;
		background: #f5f7ff;
	}

	.upload-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		color: #4f5fff;
		animation: bounce 1.2s infinite alternate;
	}

	@keyframes bounce {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(-8px);
		}
	}

	.upload-text {
		font-size: 1rem;
		color: #4f5fff;
		font-weight: 500;
	}

	input[type='file'] {
		display: none;
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background: #e0e7ff;
		border-radius: 3px;
		overflow: hidden;
		margin-top: 1rem;
	}

	.progress-bar-inner {
		height: 100%;
		background: linear-gradient(90deg, #7b8cff 0%, #4f5fff 100%);
		width: var(--progress, 0%);
		transition: width 0.3s;
	}
</style>
