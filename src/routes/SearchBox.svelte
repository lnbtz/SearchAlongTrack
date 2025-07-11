<script lang="ts">
	import { searchAlongTrack } from '$lib/api';
	import { buildTableData } from '$lib/results';
	import { gpxTrackStore } from '$lib/stores';

	import { get, writable } from 'svelte/store';

	let loadingState = writable<string>('idle');
	async function search() {
		if (!get(gpxTrackStore)) {
			return alert('Please upload a GPX file first.');
		}
		loadingState.set('searching');
		await sleep(2000); // pauses for 2 second
		await searchAlongTrack();
		await sleep(100);
		loadingState.set('processing');
		await sleep(100);
		await buildTableData();
		await sleep(100);
		loadingState.set('done');
	}
	function sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	let showBanner = true;
</script>

<div class="search-box">
	{#if $loadingState === 'idle'}
		<button onclick={search} class="search-button"> Search for Points of Interest along the GPX Track </button>
	{:else if $loadingState === 'searching'}
		<div class="loadingState">
			<span class="loader"></span>
			🔎 Searching for Points of Interest along the GPX Track...
		</div>
	{:else if $loadingState === 'processing'}
		<div class="loadingState">
			<span class="loader"></span>
			⏳ Processing results...
		</div>
	{:else if $loadingState === 'done'}
		{#if showBanner}
			<div class="result-banner">
				<span class="result-icon">✅</span>
				<span class="result-text">
					Search completed! Results are ready.<br />
					<small>Use the range and radius slider to show results in the selected range.</small>
				</span>
				<button class="close-btn" onclick={() => (showBanner = false)} aria-label="Close"
					>&times;</button
				>
			</div>
		{/if}
	{/if}
</div>

<style>
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
	.search-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 20px;
	}
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
		animation:
			spin 1s linear infinite,
			pulse 1.2s ease-in-out infinite;
		display: inline-block;
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
		box-shadow: 0 2px 8px rgba(66, 103, 178, 0.10);
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

</style>
