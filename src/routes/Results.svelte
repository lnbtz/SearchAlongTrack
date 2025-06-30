<script lang="ts">
	import { type TableRow } from '$lib/results';

	export let tableData: TableRow[];
	let selectedCategories: string[] = [];
</script>
<!--
	Search along GPS track results page.
	This page displays the results of the search along the GPS track.
	It includes a table with the results and checkboxes to filter the results by category.
-->
<label>
	<input type="checkbox" bind:group={selectedCategories} value="vending-machines" />
	Vending Machines
</label>
<label>
	<input type="checkbox" bind:group={selectedCategories} value="gas-stations" />
	Gas Stations
</label>
<label>
	<input type="checkbox" bind:group={selectedCategories} value="supermarkets" />
	Supermarkets
</label>
<label>
	<input type="checkbox" bind:group={selectedCategories} value="shelters" />
	Shelters
</label>
<label>
	<input type="checkbox" bind:group={selectedCategories} value="bakery" />
	Bakery
</label>
<label>
	<input type="checkbox" bind:group={selectedCategories} value="kiosks" />
	Kiosks
</label>
<label>
	<input type="checkbox" bind:group={selectedCategories} value="toilets" />
	Toilets
</label>

<table>
	<thead>
		<tr>
			<th>Type</th>
			<th>Name</th>
			<th>Opening Hours</th>
			<th>Distance to Track</th>
			<th>Distance on Route</th>
			<th>Location (Lat, Lon)</th>
		</tr>
	</thead>
	<tbody>
		{#each tableData as row}
			<tr>
				<td>{row.type}</td>
				<td>{row.name}</td>
				<td>{row.openingHours}</td>
				<td>{row.distanceFromRoute} m</td>
				<td>{row.distanceOnRoute} km</td>
				<td
					class="clickable-coords"
					title="Click to copy to clipboard"
					on:click={() =>
						navigator.clipboard.writeText(`${row.location?.lat}, ${row.location?.lon}`)}
				>
					{row.location?.lat}, {row.location?.lon}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	.clickable-coords {
		cursor: pointer;
		color: #2563eb;
		text-decoration: underline;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-family: system-ui, sans-serif;
		background: #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		border-radius: 8px;
		overflow: hidden;
	}

	th,
	td {
		padding: 0.75rem 1rem;
		text-align: left;
		border-bottom: 1px solid #e5e7eb;
	}

	th {
		background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%);
		font-weight: 600;
		letter-spacing: 0.03em;
		color: #374151;
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr:hover {
		background: #f9fafb;
		transition: background 0.2s;
	}

	td {
		color: #4b5563;
	}

	@media (max-width: 700px) {
		table,
		thead,
		tbody,
		th,
		td,
		tr {
			display: block;
		}
		thead {
			display: none;
		}
		tr {
			margin-bottom: 1rem;
			box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
			border-radius: 6px;
			background: #fff;
		}
		td {
			padding: 0.75rem;
			border-bottom: none;
			position: relative;
		}
		td:before {
			content: attr(data-label);
			font-weight: 600;
			color: #6b7280;
			display: block;
			margin-bottom: 0.25rem;
		}
	}
</style>
