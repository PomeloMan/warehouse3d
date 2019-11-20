import * as THREE from 'three';

/**
 * 区域对象
 */
export class Area {
  id: any;
  name: string;
  color;
  vectors: Array<THREE.Vector2>;
}

export enum AreaColor {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
  WARNING = 'warning',
  DANGER = 'danger',
  SUCCESS = 'success'
}