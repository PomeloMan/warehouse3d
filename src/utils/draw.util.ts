import {
  Shape,
  Mesh,
  ExtrudeGeometry,
  ExtrudeGeometryOptions,
  BoxGeometry,
  Vector2,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
} from 'three';

export class DrawUtil {

  /**
   * 计算模型的uv坐标供材质贴图使用
   * @param geometry 
   */
  static assignUVs(geometry: any) {
    geometry.computeBoundingBox();
    var max = geometry.boundingBox.max,
      min = geometry.boundingBox.min;
    var offset = new Vector2(0 - min.x, 0 - min.y);
    var range = new Vector2(max.x - min.x, max.y - min.y);
    var faces = geometry.faces;
    geometry.faceVertexUvs[0] = [];
    for (var i = 0; i < faces.length; i++) {
      var v1 = geometry.vertices[faces[i].a],
        v2 = geometry.vertices[faces[i].b],
        v3 = geometry.vertices[faces[i].c];
      geometry.faceVertexUvs[0].push([
        new Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
        new Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
        new Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
      ]);
    }
    geometry.uvsNeedUpdate = true;
  }

  /**
   * 构造立方几何 BoxGeometry
   * @param width 长(x)
   * @param height 高(y)
   * @param depth 深(z)
   * @param matType 材质类型
   * @param matParam 材质参数，对应材质类型
   * @param position 坐标，默认 {x:0, y:0, z:0}
   * @param userData 自定义数据
   */
  static createBoxMesh(
    geo: { width, height, depth, widthSegments?, heightSegments?, depthSegments?},
    matType: MaterialType,
    matParam,
    position: { x, y, z } = { x: 0, y: 0, z: 0 },
    userData?: any
  ): Mesh {
    const geometry = new BoxGeometry(geo.width, geo.height, geo.depth, geo.widthSegments, geo.heightSegments, geo.depthSegments);
    const mesh = new Mesh(geometry, this.createMaterial(matType, matParam));
    mesh.position.set(position.x, position.y, position.z);

    if (!!userData) {
      mesh.userData = { ...mesh.userData, ...userData };
    }
    return mesh;
  }

  /**
   * 绘制拉伸几何 ExtrudeGeometry
   * @param points 几何点集合
   * @param matType 材质类型
   * @param matParam 材质参数，对应材质类型
   * @param position 坐标，默认 {x:0, y:0, z:0}
   * @param userData 自定义数据
   * @param eventListeners 监听事件
   * @reference https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry
   */
  static createExtrudeMesh(
    points: Array<THREE.Vector2>,
    options: ExtrudeGeometryOptions,
    matType: MaterialType,
    matParam,
    position: { x, y, z } = { x: 0, y: 0, z: 0 },
    userData?: any,
    eventListeners?: Array<{ name: string, event: (event: any) => void }>
  ): Mesh {
    // This object extrudes a 2D shape to a 3D geometry.
    const geometry = new ExtrudeGeometry(new Shape(points), options);
    this.assignUVs(geometry);
    const mesh = new Mesh(geometry, this.createMaterial(matType, matParam));
    mesh.position.set(position.x, position.y, position.z);

    if (!!userData) {
      mesh.userData = { ...mesh.userData, ...userData };
    }

    if (eventListeners && eventListeners.length > 0) {
      eventListeners.forEach(listener => {
        mesh.addEventListener(listener.name, listener.event);
      })
    }
    return mesh;
  }

  /**
   * 创建材质
   * @param type MaterialType
   * @param parameters 材质参数
   */
  private static createMaterial(type: MaterialType, parameters) {
    if (type === MaterialType.MeshBasicMaterial) {
      return new MeshBasicMaterial(parameters);
    } else if (type === MaterialType.MeshLambertMaterial) {
      return new MeshLambertMaterial(parameters);
    } else if (type === MaterialType.MeshPhongMaterial) {
      return new MeshPhongMaterial(parameters);
    }
  }
}

/**
 * 材质类型
 * @reference https://threejs.org/docs/index.html#api/en/materials/Material
 */
export enum MaterialType {
  MeshBasicMaterial = 'MeshBasicMaterial',
  MeshLambertMaterial = 'MeshLambertMaterial',
  MeshPhongMaterial = 'MeshPhongMaterial'
}