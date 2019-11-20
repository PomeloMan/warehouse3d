import { AreaColor } from "../core/modal/area";

export interface Theme {
  name: string;
  background: any;
  selectedColor: any;
  ground: any;
  shelf: any;
  stack: any;
  area: any;
}

/**
 * 使用 Ant Design 色值
 * https://ant.design/docs/spec/colors-cn
 */
export class DefaultTheme implements Theme {
  /**
   * 样式名称
   */
  name = 'default';
  /**
   * 场景背景色
   */
  background = '#f5f5f5'; // gray-3
  /**
   * 模型选中颜色
   */
  selectedColor = '#69c0ff'; // blue-4
  /**
   * 平面样式
   */
  ground = {
    color: '#bfbfbf', // gray-6
    opacity: 1,
    transparent: true
  }
  /**
   * 货架样式
   */
  shelf = {
    opacity: 1,
    transparent: true,
    pole: { // 货架柱子样式
      color: '#bae7ff', // blue-2
      opacity: 1,
      transparent: true,
    },
    level: { // 货架层面样式
      color: '#ffd591', // orange-3
      opacity: 1,
      transparent: true,
    }
  }
  /**
   * 库位样式
   */
  stack = {
    color: '#fadb14', // yellow-8
    opacity: 0.7,
    transparent: true
  }

  area(type?: AreaColor) {
    let style;
    switch (type) {
      case AreaColor.PRIMARY:
        style = {
          color: '#8c8c8c', // gray-7
          opacity: 0.7,
          transparent: true
        }
        break;
      case AreaColor.SECONDARY:
        style = {
          color: '#9e9e9e',
          opacity: 0.7,
          transparent: true
        }
        break;
      case AreaColor.TERTIARY:
        style = {
          color: '#bdbdbd',
          opacity: 0.7,
          transparent: true
        }
        break;
      case AreaColor.WARNING:
        style = {
          color: '#fff566', // yellow-4
          opacity: 0.7,
          transparent: true
        }
        break;
      case AreaColor.DANGER:
        style = {
          color: '#ff7875', // red-4
          opacity: 0.7,
          transparent: true
        }
        break;
      case AreaColor.SUCCESS:
        style = {
          color: '#95de64', // green-4
          opacity: 0.7,
          transparent: true
        }
        break;
    }
    return style;
  }
}