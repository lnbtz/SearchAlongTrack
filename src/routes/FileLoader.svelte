<script lang="ts">
	import toGeoJSON from '@mapbox/togeojson';
	import { gpxTrackStore } from '$lib/stores';
	import { handleGpxTrack } from '$lib/util';
	import { searchAlongTrack } from '$lib/api';
	import { buildTableData } from '$lib/results';

	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';

	type LoadingState = 'idle' | 'uploading' | 'searching' | 'done';
	let loadingState: LoadingState = $state('idle');

	async function search() {
		if (!get(gpxTrackStore)) {
			return alert('Please upload a GPX file first.');
		}
		loadingState = 'searching';
		await searchAlongTrack();
		await buildTableData();
		loadingState = 'done';
	}

	let loading = $state(false);
	let progress = $state(0);

	async function handleChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		loadingState = 'uploading';
		loading = true;

		const reader = new FileReader();
		reader.onprogress = (event) => {
			if (event.lengthComputable) {
				progress = Math.round((event.loaded / event.total) * 100);
			}
		};
		reader.onload = async () => {
			const xml = new DOMParser().parseFromString(reader.result as string, 'application/xml');
			const geojson = toGeoJSON.gpx(xml);
			gpxTrackStore.set(geojson);
			handleGpxTrack();
			loading = false;
			progress = 100;
			await search();
		};
		reader.readAsText(file);
	}
</script>

<div class="info-banner">
	<h2>Welcome to the Search Along Track App</h2>

	<p>To get started:</p>
	<ul>
		<li>
			<span class="highlight">1. Upload</span> a GPX track file. Then wait for the results along your
			track and navigate to the Map Tab.
		</li>
		<li>
			<span class="highlight">2. Go to the <b>Map</b> tab</span> to view the results on the map.
		</li>
		<li>
			To see previous search results, navigate to the <b>Load</b> tab.
		</li>
	</ul>
</div>

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
	{#if loading && loadingState === 'uploading'}
		<div class="progress-bar">
			<div class="progress-bar-inner" style="--progress: {progress}%"></div>
		</div>
	{:else if loadingState === 'searching'}
		<div class="loadingState">
			<span class="loader"></span>
			🔎 Searching for Points of Interest along the GPX Track...
		</div>
	{:else if loadingState === 'done'}
		<div class="result-banner">
			<span class="result-icon">✅</span>
			<span class="result-text">Search completed! Results are ready.</span>
		</div>
		<div class="centered-button">
			<button class="search-button" onclick={() => goto('/map')}>View Results on Map</button>
		</div>
	{/if}
</div>

<style>
	.result-banner {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
		padding: 10px;
		border-radius: 5px;
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 10px;
	}
	.result-icon {
		font-size: 24px;
	}
	.result-text {
		font-size: 16px;
	}
	.loadingState {
		display: flex;
		align-items: center;
		gap: 10px;
		background: linear-gradient(90deg, #e3f0ff 0%, #f6fafd 100%);
		border: 1px solid #b3d1fa;
		border-radius: 6px;
		padding: 12px 20px;
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.08);
		color: #235390;
		font-size: 17px;
		font-weight: 500;
		margin-top: 10px;
		animation: loadingBannerPulse 1.5s infinite alternate;
	}

	@keyframes loadingBannerPulse {
		0% {
			box-shadow: 0 2px 8px rgba(66, 103, 178, 0.08);
			background: linear-gradient(90deg, #e3f0ff 0%, #f6fafd 100%);
		}
		100% {
			box-shadow: 0 4px 16px rgba(66, 103, 178, 0.18);
			background: linear-gradient(90deg, #d0e7ff 0%, #eaf6ff 100%);
		}
	}
	.loader {
		border: 4px solid rgba(0, 123, 255, 0.2);
		border-left-color: #007bff;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		animation: spin 1s linear infinite;
		display: inline-block;
		background: none;
		box-shadow: none;
		aspect-ratio: 1 / 1;
	}
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.3);
		}
		50% {
			box-shadow: 0 0 0 8px rgba(0, 123, 255, 0.1);
		}
	}
	.search-button {
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
	.search-button:hover {
		background: #365899;
		box-shadow: 0 4px 16px rgba(66, 103, 178, 0.18);
		transform: translateY(-1px) scale(1.02);
	}
	.search-button:active {
		background: #31497a;
		transform: scale(0.98);
		box-shadow: 0 1px 4px rgba(66, 103, 178, 0.08);
	}
	.search-button:focus {
		outline: none;
		box-shadow: 0 0 0 2px #a3bffa;
	}
	.info-banner {
		background: linear-gradient(90deg, #e0e7ff 0%, #f0f4ff 100%);
		border: 1.5px solid #b3c6ff;
		border-radius: 1rem;
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
