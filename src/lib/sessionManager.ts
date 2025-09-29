// Session management system that coordinates between stores and IndexedDB
import { get } from 'svelte/store';
import {
	gpxTrackStore,
	selectedCategoriesStore,
	selectedRadiusStore,
	tableDataStore,
	mapInstanceStore
} from './stores';
import {
	type TrackSession,
	getTrackSession,
	updateTrackSession,
	getLastTrackSession,
	createTrackSession,
	deleteTrackSession
} from './storage';

let currentSessionId: string | null = null;

// Helper function to prepare current state data for saving (used by both create and update)
function prepareCurrentStateData() {
	const gpxTrack = get(gpxTrackStore);
	if (!gpxTrack) {
		return null;
	}

	// Safely extract map state without any references to the map instance
	const map = get(mapInstanceStore);
	let mapState: { center: [number, number]; zoom: number };

	if (map && typeof map.getCenter === 'function' && typeof map.getZoom === 'function') {
		try {
			const center = map.getCenter();
			mapState = {
				center: [Number(center.lng), Number(center.lat)] as [number, number],
				zoom: Number(map.getZoom())
			};
		} catch (mapError) {
			console.warn('Error extracting map state:', mapError);
			mapState = { center: [0, 0] as [number, number], zoom: 1 };
		}
	} else {
		mapState = { center: [0, 0] as [number, number], zoom: 1 };
	}

	// Get current store values, with sensible defaults - ensure all data is serializable
	const rawCategories = get(selectedCategoriesStore) || [];
	const rawTableData = get(tableDataStore) || [];

	const currentCategories = rawCategories.filter((cat) => typeof cat === 'string');
	const currentRadius = Number(get(selectedRadiusStore)) || 500;
	const currentTableData = rawTableData.map((row) => ({
		type: String(row.type || ''),
		category: row.category ? String(row.category) : undefined,
		description: row.description ? String(row.description) : undefined,
		name: row.name ? String(row.name) : undefined,
		website: row.website ? String(row.website) : undefined,
		phoneNumber: row.phoneNumber ? String(row.phoneNumber) : undefined,
		location: {
			lat: Number(row.location?.lat || 0),
			lon: Number(row.location?.lon || 0)
		},
		openingHours: row.openingHours ? String(row.openingHours) : undefined,
		distanceFromRoute: Number(row.distanceFromRoute || 0),
		distanceOnRoute: Number(row.distanceOnRoute || 0),
		indexOfRoute: row.indexOfRoute ? Number(row.indexOfRoute) : undefined
	}));

	// Sanitize GPX track to ensure it's fully serializable
	const sanitizedGpxTrack = {
		type: gpxTrack.type,
		features: gpxTrack.features.map((feature) => ({
			type: feature.type,
			geometry: feature.geometry,
			properties: feature.properties
				? Object.fromEntries(
						Object.entries(feature.properties).filter(
							([, value]) =>
								typeof value === 'string' ||
								typeof value === 'number' ||
								typeof value === 'boolean' ||
								value === null
						)
					)
				: null
		}))
	};

	return {
		gpxTrack: sanitizedGpxTrack,
		searchRadius: currentRadius,
		selectedCategories: currentCategories,
		tableData: currentTableData,
		mapState
	};
}

// Create a new session from current store values
export async function createSessionFromCurrentState(name?: string): Promise<TrackSession> {
	try {
		const stateData = prepareCurrentStateData();
		if (!stateData) {
			throw new Error('No GPX track loaded');
		}

		const sessionName =
			name || stateData.gpxTrack.features[0]?.properties?.name || `Track ${Date.now()}`;

		const session = await createTrackSession(
			sessionName,
			stateData.gpxTrack,
			stateData.searchRadius,
			stateData.selectedCategories, // This will default to all categories in createTrackSession if empty
			stateData.tableData,
			stateData.mapState,
			true // Default to panel open
		);

		currentSessionId = session.id;
		return session;
	} catch (error) {
		console.error('Error in createSessionFromCurrentState:', error);
		throw error;
	}
} // Save current state to the active session
export async function saveCurrentState(): Promise<void> {
	try {
		const stateData = prepareCurrentStateData();

		// If no track is loaded, nothing to save
		if (!stateData) {
			return;
		}

		if (!currentSessionId) {
			// If no session is active, create one
			await createSessionFromCurrentState();
			return;
		}

		// Use the same data preparation that worked for initial save
		const updateData = {
			searchRadius: stateData.searchRadius,
			selectedCategories: stateData.selectedCategories,
			tableData: stateData.tableData,
			mapState: stateData.mapState
		};

		await updateTrackSession(currentSessionId, updateData);
	} catch (error) {
		console.error('Error in saveCurrentState:', error);
		throw error;
	}
}

// Load a session and update all stores
export async function loadSession(sessionId: string): Promise<void> {
	const session = await getTrackSession(sessionId);
	if (!session) {
		throw new Error(`Session ${sessionId} not found`);
	}

	// Update stores with session data
	gpxTrackStore.set(session.gpxTrack);
	selectedRadiusStore.set(session.searchRadius);
	selectedCategoriesStore.set(session.selectedCategories);
	tableDataStore.set(session.tableData);

	// Update map if available
	const map = get(mapInstanceStore);
	if (map && session.mapState) {
		map.setCenter(session.mapState.center);
		map.setZoom(session.mapState.zoom);
	}

	currentSessionId = sessionId;
}

// Load the most recent session
export async function loadLastSession(): Promise<boolean> {
	try {
		const lastSession = await getLastTrackSession();
		if (lastSession) {
			await loadSession(lastSession.id);
			return true;
		}

		return false;
	} catch (e) {
		console.warn('Failed to load last session:', e);
		return false;
	}
}

// Get current session info
export function getCurrentSessionId(): string | null {
	return currentSessionId;
}

export async function getCurrentSession(): Promise<TrackSession | null> {
	if (!currentSessionId) return null;
	return (await getTrackSession(currentSessionId)) || null;
}

// Delete current session
export async function deleteCurrentSession(): Promise<void> {
	if (currentSessionId) {
		await deleteTrackSession(currentSessionId);
		currentSessionId = null;

		// Clear stores
		gpxTrackStore.set(null);
		selectedRadiusStore.set(500);
		selectedCategoriesStore.set([]);
		tableDataStore.set([]);
	}
}

// Auto-save functionality
let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleAutoSave(delayMs: number = 2000): void {
	if (autoSaveTimeout) {
		clearTimeout(autoSaveTimeout);
	}

	autoSaveTimeout = setTimeout(async () => {
		try {
			await saveCurrentState();
		} catch (e) {
			console.error('Auto-save failed:', e);
			// Additional debugging for DataCloneError
			if (e instanceof Error && e.name === 'DataCloneError') {
				console.error('DataCloneError detected - checking store contents:');
				console.log('gpxTrackStore:', typeof get(gpxTrackStore));
				console.log('selectedCategoriesStore:', get(selectedCategoriesStore));
				console.log('selectedRadiusStore:', get(selectedRadiusStore));
				console.log('tableDataStore length:', get(tableDataStore)?.length);
				console.log('mapInstanceStore:', typeof get(mapInstanceStore));
			}
		}
		autoSaveTimeout = null;
	}, delayMs);
}

// Force immediate save (useful for onDestroy, page refresh, etc.)
export async function forceSave(): Promise<void> {
	if (autoSaveTimeout) {
		clearTimeout(autoSaveTimeout);
		autoSaveTimeout = null;
	}
	await saveCurrentState();
} // Initialize session manager
export function initSessionManager(): void {
	// Defer initialization to avoid interfering with other components
	if (typeof window !== 'undefined') {
		// Use setTimeout to ensure other components initialize first
		setTimeout(() => {
			// Set up auto-save on store changes
			selectedRadiusStore.subscribe(() => scheduleAutoSave());
			selectedCategoriesStore.subscribe(() => scheduleAutoSave());
			tableDataStore.subscribe(() => scheduleAutoSave());

			setupEventListeners();
		}, 0);
	}
}

function setupEventListeners(): void {
	// Save on visibility change and before unload
	if (typeof document !== 'undefined') {
		// Check if we're on mobile to avoid touch interference
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent
		);

		// On mobile, be more conservative with event listeners
		let visibilityTimeout: ReturnType<typeof setTimeout> | null = null;

		// Only add visibilitychange listener if not on mobile or use longer delay
		const visibilityDelay = isMobile ? 500 : 100; // Longer delay on mobile

		document.addEventListener(
			'visibilitychange',
			() => {
				if (document.visibilityState === 'hidden') {
					// Debounce visibility change to avoid interfering with touch events
					if (visibilityTimeout) {
						clearTimeout(visibilityTimeout);
					}

					visibilityTimeout = setTimeout(() => {
						if (autoSaveTimeout) {
							clearTimeout(autoSaveTimeout);
							autoSaveTimeout = null;
						}
						saveCurrentState().catch((e) =>
							console.warn('Failed to save on visibility change:', e)
						);
					}, visibilityDelay); // Longer delay on mobile devices
				}
			},
			{ passive: true }
		); // Use passive listener to improve performance

		window.addEventListener('beforeunload', () => {
			// Use forceSave for synchronous save on page unload
			forceSave().catch((e) => console.warn('Failed to save before unload:', e));
		});

		// Also handle page refresh specifically
		window.addEventListener(
			'pagehide',
			() => {
				forceSave().catch((e) => console.warn('Failed to save on page hide:', e));
			},
			{ passive: true }
		);
	}
}
