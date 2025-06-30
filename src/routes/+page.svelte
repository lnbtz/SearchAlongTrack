<script lang="ts">
	import Map from './Map.svelte';
    import FileLoader from './loaders/FileLoader.svelte';
    import SearchBox from './SearchBox.svelte';
	import Results from './Results.svelte';
	import { tableDataStore } from '$lib/stores';
	import type { TableRow } from '$lib/results';

	
	let tableData: TableRow[] = [];
	tableDataStore.subscribe((content) => {
		if (content) {
			tableData = content;
		} else {
			tableData = [];
		}
	});
</script>

<svelte:head>
	<title>Map</title>
	<meta name="description" content="Search along GPS Track" />
</svelte:head>

<section>

	<FileLoader />
	<br />
	<SearchBox />
	<br />
	<Map />
	<br />
	<br />
	{#if tableData}
		<Results {tableData} />
	{/if}
</section>
