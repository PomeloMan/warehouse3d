import { Map } from "./core/Map";

// 添加全局方法，打包后引入js可直接使用 window.warehouse()
(<any>window).warehouse = (options?) => {
  return new Map(options);
}

export class Warehouse {
  map: Map;

  constructor(options?) {
    this.map = new Map(options);
  }
}