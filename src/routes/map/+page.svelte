<script lang="ts">
	import Map from './Map.svelte';
	import Results from './Results.svelte';
</script>

<section class="map-section">
	<Map />
	<button
		class="fab"
		title="Scroll to top"
		aria-label="Scroll to top"
		onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>⤒</button
	>
</section>

<section class="results-section">
	<Results />
</section>

<style>
	.map-section {
		position: relative;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: clip;
		box-shadow: var(--shadow-md);
		background: var(--bg-elevated);
	}
	.results-section {
		margin-top: 1rem;
	}

	.fab {
		position: fixed;
		right: 22px;
		bottom: 22px;
		z-index: 40;
		border: 1px solid color-mix(in oklab, var(--primary) 35%, transparent);
		color: white;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 100%);
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		box-shadow: 0 10px 22px rgba(59, 130, 246, 0.35);
		cursor: pointer;
		transition:
			transform 0.08s ease,
			box-shadow 0.2s ease;
	}
	.fab:hover {
		transform: translateY(-2px);
	}
	.fab:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}
</style>
