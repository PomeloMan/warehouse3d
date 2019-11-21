export class WarehouseConfig {

  /**
   * 广场高度
   */
  groundHeight: number = 2;
  /**
   * 平面高度
   */
  surfaceHeight: number = 1;
  /**
   * 绘制柱子等自定义模型时其宽度是否被覆盖。默认 true
   * true 则会在原模型内部绘制自定义模型，不超出原模型的长度
   * false 则会在原模型外部绘制自定义模型，总超度超出原模型
   */
  useInheritStyle: boolean = true;
  /**
   * 是否显示模型名称的镜头临界点
   */
  criticalPoint: number = 300;
  /**
   * 是否显示模型标注
   */
  isShowMeshLabel: boolean = false;
}
