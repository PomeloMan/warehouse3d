import { FeatureCollection } from "../../geojson/feature-collection";

/**
 * 仓库对象
 */
export class Warehouse {
  id: any;
  areas: FeatureCollection = new FeatureCollection();
  shelves: FeatureCollection = new FeatureCollection();
  stacks: FeatureCollection = new FeatureCollection();
}

/**
 * 仓库子模型所有类别
 */
export enum Type {
  GROUND = 'ground', // 平面
  AREA = 'area', // 区域
  SHELF = 'shelf', // 货架
  STACK = 'stack' // 库位
}