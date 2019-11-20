import { Warehouse, Type } from "../core/modal/warehouse";
import { FeatureCollection } from "../geojson/feature-collection";
import { Feature } from "../geojson/feature";

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
  static parse(geojson: string): Warehouse {
    const obj: FeatureCollection = JSON.parse(geojson);
    if (obj.type === 'FeatureCollection') {
      const warehouse = new Warehouse();
      obj.features.forEach((feature: Feature) => {
        if (feature.properties && feature.properties.type === Type.AREA) {
          warehouse.areas.features.push(feature);
        } else if (feature.properties && feature.properties.type === Type.SHELF) {
          warehouse.shelves.features.push(feature);
        } else if (feature.properties && feature.properties.type === Type.STACK) {
          warehouse.stacks.features.push(feature);
        }
      });
      return warehouse;
    }
    return null;
  }
}