
import { gpxTrackStore, selectedCategoriesStore } from './stores';
import { get } from 'svelte/store';
import type { OverpassJson } from "overpass-ts";
import { overpass } from "overpass-ts";
import { getCoordinatesAlongTrack } from './util';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

let query: string;

export function searchAlongTrack() {
    const selectedCategories: string[] = get(selectedCategoriesStore);
    const gpxTrack: FeatureCollection<Geometry, GeoJsonProperties> | null = get(gpxTrackStore);

    if (selectedCategories.length > 0 && gpxTrack && gpxTrack.features[0].geometry.type === 'LineString') {
        
        // calculate the start and end of the range in the coordinates
        startOfRange = coordinates[0];
        endOfRange = coordinates[coordinates.length - 1];
        console.log('Start of range:', startOfRange);
        console.log('End of range:', endOfRange);
        // get coordinates every 'radius' meters within range
        coordinatesList = [];
        radius = 1000
        // build query for each category
        // optimize query to be as small as possible
        query = ``;
        overpass(query)
            .then((response) => response.json())
            .then((json) => {
                json = json as OverpassJson;
                console.log('Overpass JSON:', json);
            })



    } else {
        console.log('No categories selected');
    }
}

