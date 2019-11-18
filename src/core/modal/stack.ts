/**
 * 库位对象
 */
export class Stack {
  id: any;
  height: number = 15; // 库位高度，默认 15
  shelfId: any; // 库位所在货架
  shelfLevel: number; // 库位所在货架层
  vectors: Array<THREE.Vector2>;
}