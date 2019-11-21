export interface Geometry {
	/**
	 * 要素类型（"Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"）
	 */
  type: string;
}

export enum GeometryType {
  Polygon = 'Polygon'
}