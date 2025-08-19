import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveTrack,
  saveTable,
  getTrack,
  getTable,
  deleteTrackData,
  listTrackNames,
  loadAll,
  saveMapState,
  getMapState,
  saveLastTrackName,
  getLastTrackName
} from './storage';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { TableRow } from './results';

function sampleTrack(name: string): FeatureCollection<Geometry, GeoJsonProperties> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [[10, 50], [11, 51]] },
        properties: { name }
      }
    ]
  };
}

const rows: TableRow[] = [
  {
    name: 'Cafe',
    type: 'amenity',
    category: 'ice_cafe',
    location: { lat: 50, lon: 10 },
    distanceFromRoute: 0,
    distanceOnRoute: 0
  }
];

// Clear localStorage and indexedDB between tests
function deleteDB(name: string) {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}

beforeEach(async () => {
  localStorage.clear();
  await deleteDB('sat-db');
});

describe('storage (IndexedDB)', () => {
  it('saves and loads track and table', async () => {
    const name = 'TestTrack';
    const track = sampleTrack(name);
    await saveTrack(name, track);
    await saveTable(name, rows);

    const [t, tbl] = await Promise.all([getTrack(name), getTable(name)]);
    expect(t?.features[0].properties?.name).toBe(name);
    expect(tbl?.[0].name).toBe('Cafe');

    const names = await listTrackNames();
    expect(names).toContain(name);

    const all = await loadAll();
    expect(Object.keys(all.tracks)).toContain(name);
    expect(Object.keys(all.tables)).toContain(name);
  });

  it('deletes track and table', async () => {
    const name = 'DeleteMe';
    await saveTrack(name, sampleTrack(name));
    await saveTable(name, rows);

    await deleteTrackData(name);

    const [t, tbl] = await Promise.all([getTrack(name), getTable(name)]);
    expect(t).toBeUndefined();
    expect(tbl).toBeUndefined();
  });

  // Migration test removed: current storage does not export migrateFromLocalStorage

  it('saves and restores map state + last track name', async () => {
    const state = { center: [7.1, 50.2] as [number, number], zoom: 8 };
    await saveMapState(state);
    await saveLastTrackName('Recent');

    const [s, last] = await Promise.all([getMapState(), getLastTrackName()]);
    expect(s?.center).toEqual(state.center);
    expect(s?.zoom).toBe(8);
    expect(last).toBe('Recent');
  });
});
