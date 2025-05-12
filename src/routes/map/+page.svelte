<script lang="ts">
	import Map from './Map.svelte';
    import welcome from '$lib/images/svelte-welcome.webp';
    import welcomeFallback from '$lib/images/svelte-welcome.png';
	import FileLoader from './loaders/FileLoader.svelte';
	import KomootLoader from './loaders/KomootLoader.svelte';
	import StravaLoader from './loaders/StravaLoader.svelte';

</script>

<svelte:head>
    <title>Map</title>
    <meta name="description" content="Search along GPS Track" />
</svelte:head>


<section>
    <h1>
        Search along GPS Track app
    </h1>
    <Map />
</section>