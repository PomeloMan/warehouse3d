import { Geometry } from './Geometry'
import { GeoJson } from "./geojson";

/**
 * GeoJSON 中的 geometry 属性，包含要素类型、坐标点、属性字段信息
 */
export class Feature implements GeoJson {

  id?: any;
  type: string = 'Feature';
  geometry?: Geometry;
  properties?: Properties;
}

export class Properties {
  id?: any;
  type?: any;
  color?: any;
  levels?: number;
  height?: number | Array<number>;
  width?: number;
  direction?: 'vertical' | 'horizontal';
}