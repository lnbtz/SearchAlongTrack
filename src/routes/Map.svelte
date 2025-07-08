<script lang="ts">
	import { onMount } from 'svelte';
	import maplibregl from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import {
		gpxTrackStore,
		selectedRangeTrackStore,
		tableDataDisplayStore,
		mapInstanceStore,

		polyAroundTrackStore

	} from '$lib/stores';

	const markerSize = 15; // Size of the marker in pixels
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;

	let markers: maplibregl.Marker[] = []; // Array to hold markers

	onMount(() => {
		map = new maplibregl.Map({
			container: mapContainer,
			style: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
			zoom: 1,
			attributionControl: false
		});
		mapInstanceStore.set(map);
	});
	gpxTrackStore.subscribe((geojson) => {
		if (map && geojson) {
			if (!map.getSource('gpx-track')) {
				map.addSource('gpx-track', {
					type: 'geojson',
					data: geojson
				});

				map.addLayer({
					id: 'gpx-track-line',
					type: 'line',
					source: 'gpx-track',
					layout: {
						'line-join': 'round',
						'line-cap': 'round'
					},
					paint: {
						'line-color': '#ff0000', // Red color for the track
						'line-width': 4
					}
				});
			} else {
				const source = map.getSource('gpx-track') as maplibregl.GeoJSONSource;
				source.setData(geojson);
			}
			const geometry = geojson.features[0].geometry;
			let bbox: number[] | undefined = undefined;
			if (geometry.type === 'LineString' && Array.isArray((geometry as any).coordinates)) {
				bbox = (geometry as { coordinates: number[][] }).coordinates.reduce(
					(acc: number[], coord: number[]) => {
						acc[0] = Math.min(acc[0], coord[0]);
						acc[1] = Math.min(acc[1], coord[1]);
						acc[2] = Math.max(acc[2], coord[0]);
						acc[3] = Math.max(acc[3], coord[1]);
						return acc;
					},
					[Infinity, Infinity, -Infinity, -Infinity]
				);
			}
			if (bbox) {
				map.fitBounds(
					[
						[bbox[0], bbox[1]],
						[bbox[2], bbox[3]]
					],
					{
						padding: { top: 20, bottom: 20, left: 20, right: 20 }
					}
				);
			}
		}
	});
	selectedRangeTrackStore.subscribe((geojson) => {
		if (map && geojson) {
			if (!map.getSource('selected-range-track')) {
				map.addSource('selected-range-track', {
					type: 'geojson',
					data: geojson
				});

				map.addLayer({
					id: 'selected-range-track-line',
					type: 'line',
					source: 'selected-range-track',
					layout: {
						'line-join': 'round',
						'line-cap': 'round'
					},
					paint: {
						'line-color': '#00ff00', // Green color for the selected range
						'line-width': 4
					}
				});
			} else {
				const source = map.getSource('selected-range-track') as maplibregl.GeoJSONSource;
				source.setData(geojson);
			}
		}
	});
	tableDataDisplayStore.subscribe((tableData) => {
		if (map && tableData) {
			console.log('Updating markers on map with table data:', tableData);
			// Remove existing markers
			markers.forEach((marker) => {
				marker.remove();
			});
			markers = []; // Clear the markers array
			tableData.forEach((row) => {
				const el = document.createElement('div');
				el.className = 'marker';
				el.style.backgroundImage = getIcon(row.category? row.category : '');
				el.style.position = 'absolute';
				el.style.width = `${markerSize}px`;
				el.style.height = `${markerSize}px`;
				el.addEventListener('click', () => {
					console.log('Marker clicked:', row.type);
					console.log('Marker location:', row.location);
				});
				const popup = new maplibregl.Popup({ offset: 25 }).setText(row.type);
				popup.setHTML(
					`<strong>${row.type}</strong><br>
					Distance on route: ${row.distanceOnRoute.toFixed(2)} m<br>
					Distance from route: ${row.distanceFromRoute.toFixed(2)} m<br>`
				);
				
				const marker = new maplibregl.Marker({ element: el })
					.setLngLat([row.location.lon, row.location.lat])
					.setPopup(popup)
					.addTo(map);
				markers.push(marker); // Store the marker in the array
			});
		}
	});
	// polyAroundTrackStore.subscribe((polygon) => {
	// 	if (map && polygon) {
	// 		if (!map.getSource('poly-around-track')) {
	// 			map.addSource('poly-around-track', {
	// 				type: 'geojson',
	// 				data: polygon
	// 			});

	// 			map.addLayer({
	// 				id: 'poly-around-track-fill',
	// 				type: 'fill',
	// 				source: 'poly-around-track',
	// 				paint: {
	// 					'fill-color': '#0000ff', // Blue color for the polygon around the track
	// 					'fill-opacity': 0.3
	// 				}
	// 			});
	// 		} else {
	// 			const source = map.getSource('poly-around-track') as maplibregl.GeoJSONSource;
	// 			source.setData(polygon);
	// 		}
	// 	}
	// });

	// selectedPointsStoreAlongTrackStore.subscribe((coordinates) => {
	// 	if (coordinates) {
	// 		if (!map.getSource('coordinates')) {
	// 			map.addSource('coordinates', {
	// 				type: 'geojson',
	// 				data: coordinates
	// 			});

	// 			map.addLayer({
	// 				id: 'coordinates-circle',
	// 				type: 'circle',
	// 				source: 'coordinates',
	// 				paint: {
	// 					'circle-radius': 4,
	// 					'circle-color': '#0000ff', // Blue color for the coordinates
	// 					'circle-opacity': 0.8
	// 				}
	// 			});
	// 		} else {
	// 			const source = map.getSource('coordinates') as maplibregl.GeoJSONSource;
	// 			source.setData(coordinates);
	// 		}
	// 	}
	// });
	// searchBbox
	// bboxAroundSelectedTrackStore.subscribe((bbox) => {
	// 	if (bbox) {
	// 		if (!map.getSource('bbox')) {
	// 			map.addSource('bbox', {
	// 				type: 'geojson',
	// 				data: bbox
	// 			});

	// 			map.addLayer({
	// 				id: 'bbox-circle',
	// 				type: 'circle',
	// 				source: 'bbox',
	// 				paint: {
	// 					'circle-radius': 4,
	// 					'circle-color': '#0000ff', // Blue color for the coordinates
	// 					'circle-opacity': 0.8
	// 				}
	// 			});
	// 		} else {
	// 			const source = map.getSource('bbox') as maplibregl.GeoJSONSource;
	// 			source.setData(bbox);
	// 		}
	// 	}
	// }
	// );


	function getIcon(category: string): string {
		if (!category) {
			return 'url(/icons/default.svg)'; // Default icon if type is not provided
		}
		// switch (type) {
		// 	case 'vending_machine':
		// 		return 'url(/icons/vending_machine.svg)';
		// 	case 'shelter':
		// 		return 'url(/icons/shelter.svg)';
		// 	case 'ice_cafe':
		// 		return 'url(/icons/ice_cafe.svg)';
		// 	case 'fuel':
		// 		return 'url(/icons/fuel.svg)';
		// 	case 'supermarket':
		// 		return 'url(/icons/supermarket.svg)';
		// 	case 'bakery':
		// 		return 'url(/icons/bakery.svg)';
		// 	case 'kiosk':
		// 		return 'url(/icons/kiosk.svg)';
		// 	case 'drinking_water':
		// 		return 'url(/icons/drinking_water.svg)';
		// 	case 'toilets':
		// 		return 'url(/icons/toilets.svg)';
		// 	case 'restaurant':
		// 		return 'url(/icons/restaurant.svg)';
		// 	case 'camp_site':
		// 		return 'url(/icons/camp_site.svg)';
		// 	case 'bicycle_repair':
		// 		return 'url(/icons/bicycle_repair.svg)';
		// 	case 'accommodation':
		// 		return 'url(/icons/accommodation.svg)';
		// }
		return `url(/icons/${category}.svg)`;
	}
</script>


<div bind:this={mapContainer} id="map"></div>

<style>
	#map {
		width: 100%;
		height: 100vh;
		overflow: hidden;
	}
</style>
