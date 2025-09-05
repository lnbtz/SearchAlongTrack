<script lang="ts">
	import Header from './Header.svelte';
	import '../app.css';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { registerServiceWorker } from '$lib/serviceWorkerRegistration';
	import { initPersistentStores } from '$lib/persistentStore';
	import { onMount } from 'svelte';

	injectSpeedInsights();
	let { children } = $props();
	
	// Register service worker and initialize persistent stores
	onMount(() => {
		registerServiceWorker();
		initPersistentStores();
	});
</script>

<div class="app">
	<Header />

	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background:
			radial-gradient(1200px 600px at 10% -10%, rgba(59, 130, 246, 0.12), transparent 55%),
			radial-gradient(1200px 800px at 110% -20%, rgba(34, 197, 94, 0.1), transparent 50%);
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem 1rem 2rem 1rem;
		width: 100%;
		max-width: 70rem;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>
