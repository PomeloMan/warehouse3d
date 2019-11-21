import * as THREE from 'three';

/**
 * 货架对象
 */
export class Shelf {
  id: any; // 货架编号
  levels: number = 5; // 货架一共有几层。默认5层
  width: number = 15; // 货架x轴长度。默认15
  height: number | Array<number> = 20; // 货架每层的高度。默认20
  direction: 'vertical' | 'horizontal' = 'vertical'; // 方向：垂直或水平，默认垂直。此变量用于添加货架2边的柱子
  vectors: Array<THREE.Vector2>;
  pole: Pole = new Pole();
}

/**
 * 货架柱子
 */
export class Pole {
  width: number = 5; // 长
  depth: number = 5; // 宽(深)
}


/**
 * 货架事件
 */
export class ShelfListener {

  static click = function (event) {

  }
}

/**
 * 货架层位事件
 */
export class ShelfLevelListener {
  static click = function (event) {

  }
}