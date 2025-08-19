// Simple IndexedDB wrapper for saving GPX tracks and result tables
// Uses idb-keyval for minimal, reliable storage

import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { TableRow } from './results';

// Lazy import to avoid SSR issues
let idb: typeof import('idb-keyval') | null = null;
async function ensureIDB() {
  if (!idb && typeof window !== 'undefined') {
    idb = await import('idb-keyval');
  }
  return idb;
}

const DB_NAME = 'sat-db';
const TRACKS_STORE = 'tracks';
const TABLES_STORE = 'tables';
const META_STORE = 'meta';

async function getStores() {
  await ensureSchema();
  const lib = await ensureIDB();
  if (!lib) throw new Error('IndexedDB not available');
  const { createStore } = lib;
  const tracksStore = createStore(DB_NAME, TRACKS_STORE);
  const tablesStore = createStore(DB_NAME, TABLES_STORE);
  const metaStore = createStore(DB_NAME, META_STORE);
  return { ...lib, tracksStore, tablesStore, metaStore };
}

let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;
  if (typeof indexedDB === 'undefined') return;

  // First open the DB to inspect existing stores
  const info = await new Promise<{ version: number; hasTracks: boolean; hasTables: boolean; hasMeta: boolean }>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => {
      const db = req.result;
      const hasTracks = db.objectStoreNames.contains(TRACKS_STORE);
      const hasTables = db.objectStoreNames.contains(TABLES_STORE);
      const hasMeta = db.objectStoreNames.contains(META_STORE);
      const version = db.version;
      db.close();
      resolve({ version, hasTracks, hasTables, hasMeta });
    };
    req.onupgradeneeded = () => {
      // Fresh DB, create all stores at version 1
      const db = req.result;
      if (!db.objectStoreNames.contains(TRACKS_STORE)) db.createObjectStore(TRACKS_STORE);
      if (!db.objectStoreNames.contains(TABLES_STORE)) db.createObjectStore(TABLES_STORE);
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve({ version: 1, hasTracks: true, hasTables: true, hasMeta: true });
  });

  if (info.hasTracks && info.hasTables && info.hasMeta) {
    schemaReady = true;
    return;
  }
  // Upgrade DB to add any missing stores by bumping the version
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, info.version + 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TRACKS_STORE)) db.createObjectStore(TRACKS_STORE);
      if (!db.objectStoreNames.contains(TABLES_STORE)) db.createObjectStore(TABLES_STORE);
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
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

export async function saveTrack(
  name: string,
  data: FeatureCollection<Geometry, GeoJsonProperties>
) {
  const { set, tracksStore } = await getStores();
  await set(name, data, tracksStore);
}

export async function saveTable(name: string, data: TableRow[]) {
  const { set, tablesStore } = await getStores();
  await set(name, data, tablesStore);
}

export async function getTrack(
  name: string
): Promise<FeatureCollection<Geometry, GeoJsonProperties> | undefined> {
  const { get, tracksStore } = await getStores();
  return get(name, tracksStore);
}

export async function getTable(name: string): Promise<TableRow[] | undefined> {
  const { get, tablesStore } = await getStores();
  return get(name, tablesStore);
}

export async function deleteTrackData(name: string) {
  const { del, tracksStore, tablesStore } = await getStores();
  await Promise.all([del(name, tracksStore), del(name, tablesStore)]);
}

export async function listTrackNames(): Promise<string[]> {
  const { keys, tracksStore } = await getStores();
  const ks = (await keys(tracksStore)) as readonly IDBValidKey[];
  return ks.map((k: IDBValidKey) => String(k));
}

export async function loadAll(): Promise<{
  tracks: Record<string, FeatureCollection<Geometry, GeoJsonProperties>>;
  tables: Record<string, TableRow[]>;
}> {
  const { get, keys, tracksStore, tablesStore } = await getStores();
  const result = { tracks: {} as Record<string, FeatureCollection<Geometry, GeoJsonProperties>>, tables: {} as Record<string, TableRow[]> };
  const tKeys = (await keys(tracksStore)) as readonly IDBValidKey[];
  const nameKeys: string[] = tKeys.map((k: IDBValidKey) => String(k));
  const tracks = await Promise.all(nameKeys.map((name: string) => get(name, tracksStore)));
  const tables = await Promise.all(nameKeys.map((name: string) => get(name, tablesStore)));
  nameKeys.forEach((name: string, i: number) => {
    const track = tracks[i] as FeatureCollection<Geometry, GeoJsonProperties> | undefined;
    if (track) result.tracks[name] = track;
    const table = tables[i] as TableRow[] | undefined;
    if (table) result.tables[name] = table;
  });
  return result;
}

// Map state + last used track name
export type MapState = { center: [number, number]; zoom: number };

export async function saveMapState(state: MapState) {
  const { set, metaStore } = await getStores();
  await set('lastMapState', state, metaStore);
}

export async function getMapState(): Promise<MapState | undefined> {
  const { get, metaStore } = await getStores();
  return get('lastMapState', metaStore);
}

export async function saveLastTrackName(name: string) {
  const { set, metaStore } = await getStores();
  await set('lastTrackName', name, metaStore);
}

export async function getLastTrackName(): Promise<string | undefined> {
  const { get, metaStore } = await getStores();
  return get('lastTrackName', metaStore);
}
