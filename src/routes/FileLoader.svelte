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
		console.log('Starting search along track...');
		loadingState = 'searching';
		await searchAlongTrack();
		console.log('Search completed, building table data...');
		await buildTableData();
		console.log('Table data built, updating state...');
		loadingState = 'done';
	}

	let loading = $state(false);
	let progress = $state(0);

	function onDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		const file = event.dataTransfer?.files?.[0];
		if (file) processFile(file);
	}

	async function handleChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		await processFile(file);
	}

	async function processFile(file: File) {
		if (!file.name.toLowerCase().endsWith('.gpx')) {
			alert('Please select a GPX file (.gpx)');
			return;
		}
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
			track.
		</li>
		<li>
			<span class="highlight">2. Go to the <a href="/map"><b>Map</b></a> tab</span> to view the results on the map.
		</li>
		<li>
			To see previous search results, navigate to the <a href="/load"><b>Load</b></a> tab.
		</li>
	</ul>
</div>

<div class="upload-card">
	{#if !loading && loadingState === 'idle'}
		<header class="card-head">
			<h3>Load a GPX track</h3>
			<p class="muted">Drag & drop your .gpx file here or click to browse.</p>
		</header>
		<label class="dropzone" for="file-input" ondragover={onDragOver} ondrop={onDrop}>
			<div class="dz-badge">GPX</div>
			<div class="dz-icon">📁</div>
			<div class="dz-text">Click to choose a file or drop it here</div>
			<div class="dz-sub">Supported format: .gpx</div>
		</label>
		<input id="file-input" type="file" accept=".gpx" onchange={handleChange} />
	{:else if loading && loadingState === 'uploading'}
		<div class="state state-uploading">
			<div class="progress"><div class="bar" style="--progress: {progress}%"></div></div>
			<p class="muted">Uploading… {progress}%</p>
		</div>
	{:else if loadingState === 'searching'}
		<div class="state state-searching">
			<span class="spinner" aria-hidden="true"></span>
			<p>Searching for points of interest along your track…</p>
		</div>
	{:else if loadingState === 'done'}
		<div class="state state-done">
			<div class="success">✅ Results are ready</div>
			<button class="cta" onclick={() => goto('/map')}>View Results on Map</button>
		</div>
	{/if}
</div>

<style>
    .upload-card {
        display: grid;
        gap: 1rem;
        padding: 1.25rem;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--bg-elevated);
        box-shadow: var(--shadow-md);
        max-width: 560px;
        margin: 1.5rem auto;
    }
    .card-head h3 { margin: 0; font-weight: 800; letter-spacing: .2px; }
    .card-head .muted { margin: .25rem 0 0 0; color: var(--text-muted); }

    .dropzone {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: .25rem;
        padding: 2rem 1.5rem;
        border: 2px dashed color-mix(in oklab, var(--primary) 55%, var(--border));
        border-radius: var(--radius-lg);
        background: color-mix(in oklab, var(--primary) 8%, var(--bg));
        cursor: pointer;
        transition: border-color .2s ease, background .2s ease, transform .06s ease;
    }
    .dropzone:hover { transform: translateY(-1px); background: color-mix(in oklab, var(--primary) 12%, var(--bg)); }
    .dz-badge { font-weight: 800; color: var(--primary-700); background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 999px; padding: 2px 8px; }
    .dz-icon { font-size: 2rem; }
    .dz-text { font-weight: 700; }
    .dz-sub { font-size: .9rem; color: var(--text-muted); }

    .state { display: grid; gap: .5rem; align-items: center; justify-items: center; text-align: center; }
    .progress { width: 100%; height: 8px; background: var(--bg); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
    .bar { height: 100%; background: linear-gradient(90deg, var(--primary) 0%, var(--primary-700) 100%); width: var(--progress, 0%); transition: width .3s ease; }
    .spinner { width: 22px; height: 22px; border: 3px solid color-mix(in oklab, var(--primary) 20%, transparent); border-top-color: var(--primary-700); border-radius: 999px; animation: spin 1s linear infinite; }
    .state-searching p { margin: 0; font-weight: 600; color: var(--primary-700); }
    .success { color: #16a34a; font-weight: 800; }
    .cta {
        margin-top: .25rem;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%);
        color: #fff; border: 1px solid color-mix(in oklab, var(--primary) 40%, transparent);
        padding: .6rem 1.1rem; border-radius: 10px; font-weight: 700; cursor: pointer;
        box-shadow: 0 10px 22px rgba(59,130,246,.35);
        transition: transform .08s ease, box-shadow .2s ease;
    }
    .cta:hover { transform: translateY(-1px); }

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
    /* old loader unused */
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
    .info-banner li { margin-bottom: 0.2rem; }
    .info-banner a { color: var(--primary-700); text-decoration: underline; font-weight: 700; }
    .info-banner .highlight {
        background: color-mix(in oklab, var(--primary) 10%, var(--bg));
        color: var(--primary-700);
        padding: 0.1em 0.4em;
        border: 1px solid color-mix(in oklab, var(--primary) 35%, transparent);
        border-radius: 0.45em;
        font-weight: 700;
    }

	@keyframes bounce {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(-8px);
		}
	}


	input[type='file'] {
		display: none;
	}

</style>
