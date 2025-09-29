// Comprehensive IndexedDB wrapper for saving complete track sessions
// Uses idb-keyval for minimal, reliable storage

import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { TableRow } from './results';
import { OSMCategoriesMap } from './osm-constants';

// Comprehensive track data structure
export interface TrackSession {
	id: string;
	name: string;
	createdAt: number;
	lastModified: number;
	// Track data
	gpxTrack: FeatureCollection<Geometry, GeoJsonProperties>;
	// Search parameters
	searchRadius: number;
	selectedCategories: string[];
	// Results
	tableData: TableRow[];
	// Map state
	mapState: {
		center: [number, number];
		zoom: number;
	};
	// UI state
	panelOpen: boolean;
}

// Lazy import to avoid SSR issues
let idb: typeof import('idb-keyval') | null = null;
async function ensureIDB() {
	if (!idb && typeof window !== 'undefined') {
		idb = await import('idb-keyval');
	}
	return idb;
}

const DB_NAME = 'sat-db';
const SESSIONS_STORE = 'sessions';

async function getStores() {
	await ensureSchema();
	const lib = await ensureIDB();
	if (!lib) throw new Error('IndexedDB not available');
	const { createStore } = lib;
	const sessionsStore = createStore(DB_NAME, SESSIONS_STORE);
	return { ...lib, sessionsStore };
}

let schemaReady = false;
async function ensureSchema() {
	if (schemaReady) return;
	if (typeof indexedDB === 'undefined') return;

	// First open the DB to inspect existing stores
	const info = await new Promise<{
		version: number;
		hasSessions: boolean;
	}>((resolve, reject) => {
		const req = indexedDB.open(DB_NAME);
		req.onsuccess = () => {
			const db = req.result;
			const hasSessions = db.objectStoreNames.contains(SESSIONS_STORE);
			const version = db.version;
			db.close();
			resolve({ version, hasSessions });
		};
		req.onupgradeneeded = () => {
			// Fresh DB, create all stores at version 1
			const db = req.result;
			if (!db.objectStoreNames.contains(SESSIONS_STORE)) db.createObjectStore(SESSIONS_STORE);
		};
		req.onerror = () => reject(req.error);
		req.onblocked = () => resolve({ version: 1, hasSessions: true });
	});

	if (info.hasSessions) {
		schemaReady = true;
		return;
	}
	// Upgrade DB to add any missing stores by bumping the version
	await new Promise<void>((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, info.version + 1);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(SESSIONS_STORE)) db.createObjectStore(SESSIONS_STORE);
		};
		req.onsuccess = () => {
			req.result.close();
			schemaReady = true;
			resolve();
		};
		req.onerror = () => reject(req.error);
		req.onblocked = () => resolve();
	});
}

// Helper function to generate a unique session ID
function generateSessionId(track: FeatureCollection<Geometry, GeoJsonProperties>): string {
	const str = JSON.stringify(track);
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const chr = str.charCodeAt(i);
		hash = (hash << 5) - hash + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return `session-${Math.abs(hash)}`;
}

// Save a complete track session
export async function saveTrackSession(session: TrackSession): Promise<void> {
	const { set, sessionsStore } = await getStores();
	session.lastModified = Date.now();
	await set(session.id, session, sessionsStore);
}

// Get a track session by ID
export async function getTrackSession(id: string): Promise<TrackSession | undefined> {
	const { get, sessionsStore } = await getStores();
	return get(id, sessionsStore);
}

// Get all available categories as default
function getAllCategories(): string[] {
	return Array.from(OSMCategoriesMap.keys());
}

// Create a new track session
export async function createTrackSession(
	name: string,
	gpxTrack: FeatureCollection<Geometry, GeoJsonProperties>,
	searchRadius: number = 500,
	selectedCategories: string[] = [],
	tableData: TableRow[] = [],
	mapState: { center: [number, number]; zoom: number } = { center: [0, 0], zoom: 1 },
	panelOpen: boolean = true
): Promise<TrackSession> {
	const id = generateSessionId(gpxTrack);
	// Use all categories as default if none provided
	const finalCategories = selectedCategories.length > 0 ? selectedCategories : getAllCategories();

	const session: TrackSession = {
		id,
		name,
		createdAt: Date.now(),
		lastModified: Date.now(),
		gpxTrack,
		searchRadius,
		selectedCategories: finalCategories,
		tableData,
		mapState,
		panelOpen
	};

	await saveTrackSession(session);
	return session;
}

// Update an existing track session
export async function updateTrackSession(
	id: string,
	updates: Partial<Omit<TrackSession, 'id' | 'createdAt'>>
): Promise<void> {
	const existingSession = await getTrackSession(id);
	if (!existingSession) {
		throw new Error(`Session ${id} not found`);
	}

	const updatedSession: TrackSession = {
		...existingSession,
		...updates,
		lastModified: Date.now()
	};

	await saveTrackSession(updatedSession);
}

// Delete a track session
export async function deleteTrackSession(id: string): Promise<void> {
	const { del, sessionsStore } = await getStores();
	await del(id, sessionsStore);
}

// List all track sessions
export async function listTrackSessions(): Promise<TrackSession[]> {
	const { get, keys, sessionsStore } = await getStores();
	const sessionKeys = (await keys(sessionsStore)) as readonly IDBValidKey[];
	const sessions = await Promise.all(sessionKeys.map((key) => get(key, sessionsStore)));
	return sessions.filter((session): session is TrackSession => session !== undefined);
}

// Get the most recently modified track session
export async function getLastTrackSession(): Promise<TrackSession | undefined> {
	const sessions = await listTrackSessions();
	if (sessions.length === 0) return undefined;

	return sessions.reduce((latest, current) =>
		current.lastModified > latest.lastModified ? current : latest
	);
}
