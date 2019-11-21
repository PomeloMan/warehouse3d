import { Warehouse, Type } from "../core/modal/warehouse";
import { FeatureCollection } from "../geojson/feature-collection";
import { Feature } from "../geojson/feature";
import { WarehouseConfig } from "../configs/warehouse.config";
import { GeometryType } from "../geojson/Geometry";

export class GeoJsonUtil {

  /**
   * 根据 url 加载数据
   * @param url 
   */
  static loadByUrl(url: string): Warehouse {
    return null;
  }

  /**
   * 格式化 GeoJson 数据
   * @param geojson 
   */
  static parse(geojson: string, config: WarehouseConfig): Warehouse {
    const obj: FeatureCollection = JSON.parse(geojson);
    if (obj.type === 'FeatureCollection') {
      const warehouse = new Warehouse();
      obj.features.forEach((feature: Feature) => {
        if (feature.properties && feature.properties.type === Type.AREA) {
          this.calc(feature.geometry, config.coefficient);
          warehouse.areas.features.push(feature);
        } else if (feature.properties && feature.properties.type === Type.SHELF) {
          this.calc(feature.geometry, config.coefficient);
          warehouse.shelves.features.push(feature);
        } else if (feature.properties && feature.properties.type === Type.STACK) {
          this.calc(feature.geometry, config.coefficient);
          warehouse.stacks.features.push(feature);
        }
      });
      return warehouse;
    }
    return null;
  }

  static calc(geometry, coefficient) {
    if (geometry.type === GeometryType.Polygon) {
      const coordinates = geometry.coordinates;
      coordinates.forEach(coord => {
        coord.forEach(point => {
          point[0] = point[0] * coefficient;
          point[1] = point[1] * coefficient;
        })
      })
    }
  }
}