<script lang="ts">
    import { lastSearchQueryStore, searchResultsCacheStore } from "$lib/stores";
    import { buildTableData } from "$lib/util";
    let tableData: any[] = [];

    $: if ($lastSearchQueryStore) {
        tableData = buildTableData();
    }
</script>

<table>
    <thead>
        <tr>
            <th>Type</th>
            <th>Name</th>
            <th>Description</th>
            <th>Distance to Track</th>
            <th>Closest Waypoint</th>
        </tr>
    </thead>
    <tbody>
        <!-- Example static row, replace with {#each} when you have data -->
        <tr>
            <td>Example Type</td>
            <td>Example Name</td>
            <td>Example Description</td>
            <td>123 m</td>
            <td>1.23 km</td>
        </tr>
    </tbody>
</table>