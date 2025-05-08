/**
 * Represents a GPX source that can be loaded and parsed into GeoJSON format.
 * 
 * @interface GpxSource
 * 
 * @property {string} id - A unique identifier for the GPX source.
 * @property {string} name - The name of the GPX source.
 * @property {string} icon - The path to a logo or icon representing the GPX source.
 * @property {() => Promise<FeatureCollection<LineString>>} load - A function that loads and parses the GPX source,
 * returning a GeoJSON FeatureCollection of LineString features.
 */
import type { FeatureCollection, LineString } from 'geojson';

export interface GpxSource {
  id: string;
  name: string;
  icon: string; // path to a logo or icon
  load: () => Promise<FeatureCollection<LineString>>; // returns parsed GPX as GeoJSON
}
