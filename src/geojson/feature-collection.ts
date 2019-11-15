import { GeoJson } from "./geojson";
import { Feature } from "./feature";

export class FeatureCollection implements GeoJson {

  type: string = 'FeatureCollection';
  features?: Array<Feature>;
}