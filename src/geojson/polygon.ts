import { Geometry } from './Geometry'

export class Polygon implements Geometry {

  type: string = 'Polygon';
  coordinates?: Array<Array<number>>;
}