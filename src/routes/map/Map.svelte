<script lang="ts">
	import type { Geometry, GeoJsonProperties } from 'geojson';
	import { onDestroy, onMount } from 'svelte';
	import {
		gpxTrackStore,
		selectedRangeTrackStore,
		tableDataDisplayStore,
		tableDataStore,
		mapInstanceStore,
		markersStore
	} from '$lib/stores';
	import { get } from 'svelte/store';
	import { displayType, type TableRow } from '$lib/results';
	import MapControls from './MapControls.svelte';
	import { getCategoryIconUrl } from '$lib/icons';
	import { recomputeTableDataDisplay } from '$lib/util';
	import maplibregl from 'maplibre-gl';
	import {
		getLastTrackName,
		getMapState,
		saveMapState,
		getTrack,
		getTable,
		type MapState
	} from '$lib/storage';

	const markerWidth = 32; // Size of the marker in pixels
	const markerHeight = 36;
	let mapContainer: HTMLDivElement;
	let map: maplibregl.Map;
	let lastMapState: { center: [number, number]; zoom: number } | null = null;

	onMount(async () => {
		const maplibrePkg = await import('maplibre-gl');
		const maplibregl = maplibrePkg.default ?? maplibrePkg; // CJS default
		const { GeolocateControl } = maplibregl;
		await import('maplibre-gl/dist/maplibre-gl.css');
		// Seed with last map state if available
		const restored = await getMapState().catch(() => undefined);
		map = new maplibregl.Map({
			container: mapContainer,
			style: `https://api.maptiler.com/maps/openstreetmap/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
			zoom: restored?.zoom ?? 1,
			attributionControl: false
		});
		if (restored?.center) {
			map.setCenter({ lng: restored.center[0], lat: restored.center[1] });
		}
		map.on('style.load', () => {
			const gpxTrack = get(gpxTrackStore);
			if (gpxTrack) {
				addOrUpdateGpxTrack(gpxTrack);
			}
			const selectedRangeTrack = get(selectedRangeTrackStore);
			if (selectedRangeTrack) {
				addOrUpdateSelectedRangeGpxTrack(selectedRangeTrack);
			}
			const tableData = get(tableDataDisplayStore);
			addOrUpdateTableDataDisplay(tableData);
		});
		map.addControl(
			new GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: true
			})
		);
		mapInstanceStore.set(map);
		// ensure filtered table reflects current controls initially
		recomputeTableDataDisplay();
	});
	onDestroy(async () => {
		if (map) {
			const center = map.getCenter();
			const zoom = map.getZoom();
			lastMapState = { center: [center.lng, center.lat], zoom };
			try {
				await saveMapState(lastMapState);
			} catch (e) {
				console.warn('Failed to persist map state', e);
			}
		}
	});

	// If nothing in stores yet, try restoring last loaded track + its POIs from IndexedDB
	onMount(async () => {
		if (!get(gpxTrackStore)) {
			try {
				const lastName = await getLastTrackName();
				if (lastName) {
					const [track, table] = await Promise.all([getTrack(lastName), getTable(lastName)]);
					if (track) {
						gpxTrackStore.set(track);
					}
					if (table) {
						tableDataStore.set(table);
					}
				}
			} catch (e) {
				console.warn('Restore last session failed', e);
			}
		}
	});
	// When the map is ready, make sure we properly handle page visibility changes
	function setupPageVisibilityHandling() {
		// Handle visibility changes - save state when page is hidden, restore on visible
		document.addEventListener('visibilitychange', async () => {
			// When page becomes hidden, ensure we save all state
			if (document.visibilityState === 'hidden' && map) {
				// Save map state
				const center = map.getCenter();
				const zoom = map.getZoom();
				const mapState: MapState = { center: [center.lng, center.lat], zoom };
				try {
					await saveMapState(mapState);
					console.log('Saved map state on visibility change');
				} catch (e) {
					console.warn('Failed to save map state on visibility change', e);
				}
			}
		});
	}

	gpxTrackStore.subscribe((geojson) => {
		if (map && geojson) {
			addOrUpdateGpxTrack(geojson);
		}
	});

	selectedRangeTrackStore.subscribe((geojson) => {
		if (geojson) {
			addOrUpdateSelectedRangeGpxTrack(geojson);
		}
	});

	tableDataDisplayStore.subscribe((tableData) => {
		addOrUpdateTableDataDisplay(tableData);
	});

	// Ensure the filtered view refreshes when new raw results arrive
	tableDataStore.subscribe(() => {
		recomputeTableDataDisplay();
	});

	// When the map is initialized
	mapInstanceStore.subscribe((mapInstance) => {
		if (mapInstance) {
			setupPageVisibilityHandling();
		}
	});

	function addOrUpdateSelectedRangeGpxTrack(
		geojson: GeoJSON.FeatureCollection<Geometry, GeoJsonProperties>
	) {
		if (map) {
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
	}

	function addOrUpdateGpxTrack(geojson: GeoJSON.FeatureCollection<Geometry, GeoJsonProperties>) {
		if (map) {
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
			if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
				bbox = geometry.coordinates.reduce(
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
	}

	function addOrUpdateTableDataDisplay(tableData: TableRow[]) {
		if (!map) return;
		if (tableData) {
			// Remove existing markers
			let markers: maplibregl.Marker[] = get(markersStore);
			markers.forEach((marker) => {
				marker.remove();
			});
			markers = []; // Clear the markers array
			tableData.forEach((row) => {
				const el = document.createElement('div');
				el.className = 'marker';
				el.style.backgroundImage = `url(${getCategoryIconUrl(row.category ? row.category : '')})`;
				el.style.position = 'absolute';
				el.style.width = `${markerWidth}px`;
				el.style.height = `${markerHeight}px`;
				const popup = new maplibregl.Popup({ offset: markerHeight });
				popup.setHTML(buildPopupHTML(row));
				const marker = new maplibregl.Marker({ element: el })
					.setLngLat([row.location.lon, row.location.lat])
					.setPopup(popup)
					.addTo(map);
				markers.push(marker); // Store the marker in the array
			});
			markersStore.set(markers); // Update the store with the new markers
		} else {
			// If no table data, clear markers
			let markers: maplibregl.Marker[] = get(markersStore);
			markers.forEach((marker) => {
				marker.remove();
			});
			markersStore.set([]); // Clear the store
		}
	}

	function buildPopupHTML(row: TableRow) {
		return `
				<div style="
					font-weight: bold;
					font-size: 1rem;
					border-radius: 6px;
					padding: 2px 6px;
					margin-bottom: 4px;
					color: var(--text, #fff);
					background: var(--bg-elevated, #fff); /* adapts to theme */
				">
					${displayType(row.type) || 'Unknown type'}
				</div>
				<div style="
					background: rgba(255, 80, 80, 0.7); /* moderate semi-transparent red */
					border-radius: 6px;
					padding: 2px 6px;
					margin-bottom: 4px;
					color: var(--text, #fff); /* uses theme text color */
				">
					<span style="font-weight: bold;">Name: </span>
					${row.name ? `<span>${row.name}</span>` : '<span>n/a</span>'}
				</div>
				<div style="
					background: rgba(80, 255, 80, 0.7); /* moderate semi-transparent green */
					border-radius: 6px;
					padding: 2px 6px;
					margin-bottom: 4px;
					color: var(--text, #fff); /* uses theme text color */
				">
					<span style="font-weight: bold;">Distance on route: </span>
					${row.distanceOnRoute !== undefined ? `<span>${row.distanceOnRoute.toFixed(1)} km</span>` : 'n/a'}
				</div>
				<div style="
					background: rgba(80, 160, 255, 0.7); /* moderate semi-transparent blue */
					border-radius: 6px;
					padding: 2px 6px;
					margin-bottom: 4px;
					color: var(--text, #fff); /* uses theme text color */
				">
					<span style="font-weight: bold;">Distance from route: </span>
					${row.distanceFromRoute !== undefined ? `<span>ca. ${row.distanceFromRoute.toFixed(0)} m</span>` : 'n/a'}
				</div>
				${
					row.openingHours
						? `<div style="font-weight: bold;"><span>Opening hours: </span> <span>${row.openingHours
								.split(';')
								.map((segment, i, arr) => `${segment.trim()}${i < arr.length - 1 ? '<br />' : ''}`)
								.join('')}</span></div>`
						: ''
				}
				${
					row.website
						? `<a
								href="${row.website}"
								target="_blank"
								rel="noopener noreferrer"
								title="Open website"
								aria-label="Open website"
								style="font-weight: bold; display: inline-flex; align-items: center; gap: 4px;"
							>Website<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<circle cx="12" cy="12" r="10" stroke-width="2" />
									<path
										d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"
										stroke-width="2"
									/>
								</svg>
							</a>`
						: ''
				}
				${row.description ? `<div><span style="font-weight: bold;">Description: </span> <span>${row.description}</span></div>` : ''}
				${row.phoneNumber ? `<div><span style="font-weight: bold;">Phone: </span> <a href="tel:${row.phoneNumber}">${row.phoneNumber}</a></div>` : ''}
				<a
					class="clickable"
					title="Copy coordinates to clipboard"
					href="#"
					onclick="navigator.clipboard.writeText('${row.location?.lat},${row.location?.lon}'); return false;"
				>
					Copy Coordinates to Clipboard
				</a>
				<br />
				<div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
				<a
					title="Open in Google Maps"
					aria-label="Open in Google Maps"
					href=https://www.google.com/maps/search/?api=1&query=${row.location?.lat},${row.location?.lon}
					target="_blank"
					rel="noopener noreferrer"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 92.3 132.3"
						width="18"
						height="18"
					><path
						fill="#1a73e8"
						d="M60.2 2.2C55.8.8 51 0 46.1 0 32 0 19.3 6.4 10.8 16.5l21.8 18.3L60.2 2.2z"
					/><path
						fill="#ea4335"
						d="M10.8 16.5C4.1 24.5 0 34.9 0 46.1c0 8.7 1.7 15.7 4.6 22l28-33.3-21.8-18.3z"
					/><path
						fill="#4285f4"
						d="M46.2 28.5c9.8 0 17.7 7.9 17.7 17.7 0 4.3-1.6 8.3-4.2 11.4 0 0 13.9-16.6 27.5-32.7-5.6-10.8-15.3-19-27-22.7L32.6 34.8c3.3-3.8 8.1-6.3 13.6-6.3"
					/><path
						fill="#fbbc04"
						d="M46.2 63.8c-9.8 0-17.7-7.9-17.7-17.7 0-4.3 1.5-8.3 4.1-11.3l-28 33.3c4.8 10.6 12.8 19.2 21 29.9l34.1-40.5c-3.3 3.9-8.1 6.3-13.5 6.3"
					/><path
						fill="#34a853"
						d="M59.1 109.2c15.4-24.1 33.3-35 33.3-63 0-7.7-1.9-14.9-5.2-21.3L25.6 98c2.6 3.4 5.3 7.3 7.9 11.3 9.4 14.5 6.8 23.1 12.8 23.1s3.4-8.7 12.8-23.2"
					/></svg
					>
				</a>
				<a
					aria-label="Open in Apple Maps"
					title="Open in Apple Maps"
					href=https://maps.apple.com/?q=${row.location?.lat},${row.location?.lon}
					target="_blank"
					rel="noopener noreferrer"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
						<path
							fill="#e0e0e0"
							d="M35.13 42H19V30C19 30 35.48 42 35.13 42zM6.3 10.87c.1-.33.22-.65.38-.96C7.36 8.46 8.54 7.3 10 6.64 10.149 6.565 11 13 11 13S6.193 11.207 6.3 10.87z"
						></path><path fill="#7cb342" d="M18 6H20V23H18z"></path><path
							fill="#ffcdd2"
							d="M11,18v23.73c-0.35-0.09-0.68-0.21-1-0.37c-2.36-1.08-4-3.47-4-6.23V18H11z"
						></path><path
							fill="#aed581"
							d="M42,25v10.13c0,0.36-0.03,0.71-0.09,1.05L20,20.6V6h3C23,16.48,31.52,25,42,25z"
						></path><path
							fill="#bdbdbd"
							d="M12 14h-2V6.64c.32-.16.65-.28 1-.37.32-.1.66-.17 1-.2C12.28 6.02 12 14 12 14zM18 32H20V42H18z"
						></path><path
							fill="#f9a825"
							d="M42,35.02v0.11c0,0.36-0.03,0.71-0.09,1.05c-0.06,0.43-0.16,0.84-0.31,1.23 c-0.82,2.36-2.9,4.13-5.44,4.5C35.83,41.97,35.48,42,35.13,42h-0.57l-3.02-2.15c-0.01,0-0.01-0.01-0.01-0.01l-4.5-3.2 c0,0-0.01,0-0.01-0.01l-6.36-4.52L20,31.65l-1-0.72l-1-0.71l-0.91-0.64L16.28,29l-2.49-1.77L12.06,26L12,25.96l-1-0.71l-1-0.72 L9.26,24H9.25L6,21.69v-8.82c0-0.69,0.1-1.37,0.3-2,0.1-0.33,0.22-0.65,0.38-0.96L10,12.27l2,1.42l1,0.71l5,3.55l1,0.71l0.55,0.39 L20,19.37v0.01l14.73,10.47l1.6,1.14l2.66,1.89l0.98,0.7L42,35.02z"
						></path><path
							fill="#fdd835"
							d="M41.91,36.18c-0.06,0.43-0.16,0.84-0.31,1.23c-0.82,2.36-2.9,4.13-5.44,4.5l-2.72-1.93 c-0.01,0.01-0.01,0.01-0.02,0l-1.49-1.08l-4.15-2.94c0,0,0,0-0.01-0.01l-1.51-1.08l-5.07-3.6L20,30.42l-1-0.71L18,29l-1.53-1.09 h-0.01l-2.31-1.65L13,25.45l-1-0.72l-1-0.71l-1-0.71l-0.11-0.08L6,20.47v-7.6c0-0.69,0.1-1.37,0.3-2L10,13.5l1,0.71l2,1.42l5,3.55 l1,0.71l1,0.71v0.01l12.41,8.81l1.89,1.35c0,0,0,0.01,0.01,0.01l4.6,3.26l0.88,0.63L41.91,36.18z"
						></path><path
							fill="#ef9a9a"
							d="M12,33v8.94c-0.34-0.04-0.68-0.11-1-0.21c-0.35-0.09-0.68-0.21-1-0.37V32L12,33z"
						></path><path
							fill="#fafafa"
							d="M19,6v36h-6.13c-0.3,0-0.59-0.02-0.87-0.06c-0.34-0.04-0.68-0.11-1-0.21V6.27 c0.32-0.1,0.66-0.17,1-0.2C12.28,6.02,12.57,6,12.87,6H19z"
						></path><path fill="#3996e8" d="M18,6v17h-6V6.052C12.28,6.015,12.57,6,12.87,6H18z"
						></path><path
							fill="#1976d2"
							d="M38.77,29.04c0,0-0.77,0.96-2.77,0.96s-3-1-3-1s-1,1-3,1s-2.77-0.96-2.77-0.96 C26.45,30.16,26,31.53,26,33c0,3.87,3.13,7,7,7s7-3.13,7-7C40,31.53,39.55,30.16,38.77,29.04z"
						></path><path
							fill="#d84315"
							d="M38,33H28c0-0.42,0.05-0.83,0.15-1.23C28.72,31.92,29.34,32,30,32c1.28,0,2.29-0.31,3-0.64 c0.71,0.33,1.72,0.64,3,0.64c0.66,0,1.28-0.08,1.85-0.23C37.95,32.17,38,32.58,38,33z"
						></path><path
							fill="#fbc02d"
							d="M10 12.27L10 13.5 10 24.53 11 25.25 11 14.21 11 12.98zM20 19.38L20 31.65 19 30.93 19 18.66z"
						></path><path fill="#1976d2" d="M15 21A7 7 0 1 0 15 35A7 7 0 1 0 15 21Z"
						></path><path
							fill="#e89c23"
							d="M10 12.27L10 13.5 11 14.21 11 12.98zM19 18.66L19 19.89 20 20.6 20 19.37z"
						></path><path
							fill="#e9e9e9"
							d="M42,16.96V26c-11.03,0-20-8.97-20-20h9.04C31.52,11.83,36.17,16.48,42,16.96z"
						></path><path
							fill="#7cb342"
							d="M42,13v4.96C35.62,17.48,30.52,12.38,30.05,6H35C38.87,6,42,9.13,42,13z"
						></path><path
							fill="#aed581"
							d="M42,13v3.96C36.17,16.48,31.52,11.83,31.04,6H35C38.87,6,42,9.13,42,13z"
						></path><g
							><path
								fill="#7cb342"
								d="M23,6h-1c0,11.03,8.97,20,20,20v-1C31.52,25,23,16.48,23,6z"
							></path></g
						><g
							><path fill="#fafafa" d="M15 24L12 32 15 30 18 32z"></path><path
								fill="#fff"
								d="M38.45,30.48C37.88,30.76,37.08,31,36,31c-1.39,0-2.39-0.41-3-0.77C32.39,30.59,31.39,31,30,31 c-1.08,0-1.88-0.24-2.45-0.52C27.19,31.26,27,32.11,27,33c0,3.31,2.69,6,6,6s6-2.69,6-6C39,32.11,38.81,31.26,38.45,30.48z M33,38 c-2.415,0-4.434-1.721-4.899-4h9.798C37.434,36.279,35.415,38,33,38z M28,33c0-0.422,0.051-0.834,0.151-1.233 C28.724,31.922,29.343,32,30,32c1.283,0,2.288-0.308,3-0.641C33.712,31.692,34.717,32,36,32c0.657,0,1.276-0.078,1.849-0.233 C37.949,32.166,38,32.578,38,33H28z"
							></path><path
								fill="#fff"
								d="M32.125 35.24c0 0 0-.625-.625-.625s-.625.625-.625.625h.375c0-.114.043-.25.25-.25.066 0 .242 0 .25.25 0 .215-.291.549-.487.707l-.013.01-.375.325v.036.298h1.25V36.24h-.628C31.497 36.24 32.125 35.74 32.125 35.24zM33.4 35.615c.125-.102.225-.243.225-.427 0-.316-.28-.573-.625-.573s-.625.257-.625.573c0 .184.1.325.225.427-.125.102-.225.243-.225.427 0 .316.28.573.625.573s.625-.257.625-.573C33.625 35.858 33.525 35.717 33.4 35.615zM33 34.99c.135 0 .25.091.25.198 0 .106-.157.19-.25.228-.092-.037-.25-.121-.25-.228C32.75 35.079 32.862 34.99 33 34.99zM33 36.24c-.138 0-.25-.089-.25-.198 0-.106.157-.19.25-.228.092.037.25.121.25.228C33.25 36.149 33.135 36.24 33 36.24zM34.499 34.99c.104 0 .138.033.163.067.057.075.087.207.087.382v.354c0 .175-.03.307-.086.381-.026.034-.06.067-.162.067-.105 0-.139-.033-.165-.067-.057-.075-.087-.206-.087-.38v-.355c0-.175.03-.307.086-.381C34.362 35.023 34.396 34.99 34.499 34.99M34.499 34.615c-.199 0-.352.071-.461.214s-.163.346-.163.608v.355c0 .261.055.463.164.607.109.144.264.215.463.215.198 0 .351-.071.46-.214.109-.143.163-.346.163-.608v-.354c0-.262-.055-.465-.164-.608C34.852 34.687 34.698 34.615 34.499 34.615L34.499 34.615z"
							></path></g
						>
					</svg>
				</a>
				<a
					aria-label="Open in Komoot"
					title="Open on Komoot"
					href=https://www.komoot.com/de-de/plan/@${row.location?.lat},${row.location?.lon},14.742z?
					target="_blank"
					rel="noopener noreferrer"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 120 120"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M118.322 74.0303C126.071 41.8197 106.241 9.42631 74.0303 1.67762C41.8197 -6.07107 9.42631 13.7592 1.67762 45.9698C-6.07107 78.1803 13.7592 110.574 45.9698 118.322C78.1803 126.071 110.574 106.241 118.322 74.0303Z"
							fill="white"
						/>
						<path
							d="M8.64907 59.9929C8.64907 31.6855 31.6912 8.64343 59.9986 8.64343C88.3229 8.64343 111.348 31.6855 111.348 59.9929C111.348 71.387 107.691 82.1377 100.784 91.1616L75.0326 65.4106C75.676 63.6499 75.9977 61.8214 75.9977 59.976C75.9977 51.1553 68.8192 43.9769 59.9986 43.9769C51.1779 43.9769 43.9995 51.1553 43.9995 59.976C43.9995 61.8214 44.3211 63.6499 44.9645 65.4106L19.2136 91.1616C12.306 82.1547 8.64907 71.387 8.64907 59.9929Z"
							fill="url(#paint0_linear)"
						/>
						<path
							d="M50.5853 72.115L59.9985 57.4365L69.4118 72.0981L94.9257 97.612C85.3939 106.467 73.0179 111.342 59.9985 111.342C46.9792 111.342 34.6031 106.467 25.0714 97.612L50.5853 72.115Z"
							fill="url(#paint1_linear)"
						/>
						<defs>
							<linearGradient
								id="paint0_linear"
								x1="59.9981"
								y1="8.65109"
								x2="59.9981"
								y2="111.344"
								gradientUnits="userSpaceOnUse"
							>
								<stop stop-color="#8FCE3C" />
								<stop offset="1" stop-color="#64A322" />
							</linearGradient>
							<linearGradient
								id="paint1_linear"
								x1="59.9981"
								y1="8.65109"
								x2="59.9981"
								y2="111.344"
								gradientUnits="userSpaceOnUse"
							>
								<stop stop-color="#8FCE3C" />
								<stop offset="1" stop-color="#64A322" />
							</linearGradient>
						</defs>
					</svg>
				</a>
			</div>`;
	}
</script>

<div class="map-wrapper">
	<div bind:this={mapContainer} id="map"></div>
	<MapControls />
</div>

<style>
	.map-wrapper {
		position: relative;
	}
	#map {
		width: 100%;
		height: min(100vh, 860px);
		min-height: 420px;
		overflow: hidden;
	}

	/* Ensure map popups are fully opaque and high-contrast */
	:global(.maplibregl-popup) {
		filter: none !important;
		opacity: 1 !important;
	}
	:global(.maplibregl-popup-content) {
		background: var(--bg-elevated) !important;
		color: var(--text) !important;
		border: 1px solid var(--border) !important;
		border-radius: var(--radius-md) !important;
		box-shadow: var(--shadow-lg) !important;
		font-family: var(--font-body) !important;
	}
	:global(.maplibregl-popup-close-button) {
		color: var(--text) !important;
		opacity: 1 !important;
		font-weight: 700;
	}
	:global(.maplibregl-popup-tip) {
		border-top-color: var(--bg-elevated) !important;
		border-bottom-color: var(--bg-elevated) !important;
	}

	/* Structured, readable popup content */
	:global(.sat-popup) {
		display: grid;
		gap: 8px;
	}
	:global(.sat-header) {
		font-weight: 800;
		color: var(--primary-700);
		letter-spacing: 0.2px;
	}
	:global(.sat-row) {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 10px;
		align-items: center;
		padding: 8px 10px;
		border-radius: 10px;
		border: 1px solid var(--border);
		background: var(--bg);
	}
	:global(.sat-success) {
		background: color-mix(in oklab, var(--accent) 12%, var(--bg) 88%);
	}
	:global(.sat-info) {
		background: color-mix(in oklab, var(--primary) 12%, var(--bg) 88%);
	}
	:global(.sat-label) {
		font-weight: 700;
		color: var(--text);
		opacity: 0.9;
	}
	:global(.sat-value) {
		font-weight: 700;
		color: var(--text);
	}
	:global(.sat-card) {
		border: 1px dashed var(--border);
		border-radius: 10px;
		padding: 8px 10px;
		background: var(--bg);
	}
	:global(.sat-card-title) {
		font-weight: 800;
		margin-bottom: 4px;
	}
	:global(.sat-card-body) {
		color: var(--text);
		opacity: 0.95;
	}
	:global(.sat-link) {
		color: var(--primary-700);
		text-decoration: underline;
		font-weight: 600;
	}
	:global(.sat-actions) {
		display: flex;
		gap: 8px;
		margin-top: 2px;
	}
	:global(.sat-chip) {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 999px;
		background: color-mix(in oklab, var(--primary) 12%, var(--bg-elevated) 88%);
		color: var(--primary-700);
		border: 1px solid color-mix(in oklab, var(--primary) 35%, transparent);
		text-decoration: none;
		font-weight: 700;
		font-size: 0.9rem;
	}
</style>
