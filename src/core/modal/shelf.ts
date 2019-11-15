/**
 * 货架对象
 */
export class Shelf {
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
  length: number = 5;
  width: number = 5;
}