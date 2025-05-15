<script lang="ts">
	import Map from './Map.svelte';
    import FileLoader from './loaders/FileLoader.svelte';
    import SearchBox from './SearchBox.svelte';
</script>

<svelte:head>
	<title>Map</title>
	<meta name="description" content="Search along GPS Track" />
</svelte:head>

<section>
	<h1>Search along GPS Track app</h1>

	<FileLoader />
	<br />
	<SearchBox />
	<br />
	<Map />
</section>
