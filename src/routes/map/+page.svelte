<script lang="ts">
	import Map from './Map.svelte';
    import welcome from '$lib/images/svelte-welcome.webp';
    import welcomeFallback from '$lib/images/svelte-welcome.png';
</script>

<svelte:head>
    <title>Map</title>
    <meta name="description" content="Search along GPS Track" />
</svelte:head>

<section>
    <h1>
        <span class="welcome">
			<picture>
				<source srcset={welcome} type="image/webp" />
				<img src={welcomeFallback} alt="Welcome" />
			</picture>
		</span>
        <br />Search along GPS Track app
    </h1>
    <Map />
</section>