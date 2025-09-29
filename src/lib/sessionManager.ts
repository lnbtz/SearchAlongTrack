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

// Create a new session from current store values
export async function createSessionFromCurrentState(name?: string): Promise<TrackSession> {
	const gpxTrack = get(gpxTrackStore);
	if (!gpxTrack) {
		throw new Error('No GPX track loaded');
	}

	const map = get(mapInstanceStore);
	const mapState = map
		? {
				center: [map.getCenter().lng, map.getCenter().lat] as [number, number],
				zoom: map.getZoom()
			}
		: { center: [0, 0] as [number, number], zoom: 1 };

	const sessionName = name || gpxTrack.features[0]?.properties?.name || `Track ${Date.now()}`;

	const session = await createTrackSession(
		sessionName,
		gpxTrack,
		get(selectedRadiusStore) || 500,
		get(selectedCategoriesStore) || [],
		get(tableDataStore) || [],
		mapState,
		true // Default to panel open
	);

	currentSessionId = session.id;
	return session;
}

// Save current state to the active session
export async function saveCurrentState(): Promise<void> {
	if (!currentSessionId) {
		// If no session is active, create one
		await createSessionFromCurrentState();
		return;
	}

	const map = get(mapInstanceStore);
	const mapState = map
		? {
				center: [map.getCenter().lng, map.getCenter().lat] as [number, number],
				zoom: map.getZoom()
			}
		: { center: [0, 0] as [number, number], zoom: 1 };

	await updateTrackSession(currentSessionId, {
		searchRadius: get(selectedRadiusStore),
		selectedCategories: get(selectedCategoriesStore),
		tableData: get(tableDataStore),
		mapState
		// We don't update panelOpen here as it's handled separately
	});
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
			console.warn('Auto-save failed:', e);
		}
		autoSaveTimeout = null;
	}, delayMs);
}

// Initialize session manager
export function initSessionManager(): void {
	// Set up auto-save on store changes
	selectedRadiusStore.subscribe(() => scheduleAutoSave());
	selectedCategoriesStore.subscribe(() => scheduleAutoSave());
	tableDataStore.subscribe(() => scheduleAutoSave());

	// Save on visibility change and before unload
	if (typeof document !== 'undefined') {
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				if (autoSaveTimeout) {
					clearTimeout(autoSaveTimeout);
					autoSaveTimeout = null;
				}
				saveCurrentState().catch((e) => console.warn('Failed to save on visibility change:', e));
			}
		});

		window.addEventListener('beforeunload', () => {
			saveCurrentState().catch((e) => console.warn('Failed to save before unload:', e));
		});
	}
}
