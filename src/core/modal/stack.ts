import * as THREE from 'three';

/**
 * 库位对象
 */
export class Stack {
  id: any;
  height: number | Array<number> = 15; // 库位高度，默认 15
  shelfId: any; // 库位所在货架
  shelfLevel: number; // 库位所在货架层
  vectors: Array<THREE.Vector2>;
}

/**
 * 库位事件
 */
export class StackListener {

  static click = function (event) {
    console.log(event.target) // Target Mesh
  }
}