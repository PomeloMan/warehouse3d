import * as THREE from 'three';
import * as OrbitControls from 'three-orbitcontrols';
import * as Stats from 'stats.js'
import { Detector } from './detector';
import { DomUtil } from '../utils/domUtil';
import { GeoJson } from '../geojson/geojson';
import { Feature } from '../geojson/feature';
import { FeatureCollection } from '../geojson/feature-collection';
import { Polygon } from '../geojson/polygon';
import { Shelf } from './modal/shelf';
import { Stack } from './modal/stack';
import { Area } from './modal/area';
import { DrawUtil } from '../utils/drawUtil';

export class Map {

  scene: THREE.Scene; // 3d地图渲染场景
  renderer: THREE.WebGLRenderer; // 2、3d地图渲染场景渲染器
  camera: THREE.PerspectiveCamera; // 3d地图渲染场景视点相机
  controls: any; // 3d 缩放旋转平移控制器 OrbitControls
  rayCaster: THREE.Raycaster; // 给模型绑定点击事件
  stats: Stats; // fps 工具

  sceneChanged: boolean = true; // 场景是否改变

  groundXYZ: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }; // 广场原点坐标

  museXY = { X: 0, Y: 0 };
  selectedMesh: any;
  selectedColor: string = '#39FAFA';
  selectionListener: Function | undefined;
  /**
   * 根元素
   */
  private rootElement: HTMLElement;
  /**
   * 绘制内容的 Canvas 元素
   */
  private canvasElement: HTMLCanvasElement;

  constructor(options?: MapOptions) {
    if (!Detector.webgl) {
      console.error("浏览器不支持WebGL 3D");
      return;
    }
    console.info("浏览器支持WebGL 3D");

    // 初始话根元素
    if (options && !!options.rootElement) {
      this.rootElement = options.rootElement;
    } else {
      this.rootElement = DomUtil.createRootEle();
    }
    // 初始话 Canvas 元素
    this.canvasElement = DomUtil.createCanvasEle(this.rootElement);

    // 初始话场景
    this.initScene();
    this.createObjects();
    this.setSelectable(true);
  }

  /**
   * 初始话场景
   */
  initScene() {
    const canvasWidth = this.rootElement.clientWidth;
    const canvasHeight = this.rootElement.clientHeight;

    // 渲染场景
    this.scene = new THREE.Scene();
    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,  // 反锯齿
      canvas: this.canvasElement
    });
    this.renderer.autoClear = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.rootElement.clientWidth, this.rootElement.clientHeight);
    this.renderer.setClearColor(0xf2f2f2, 1.0);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, canvasWidth / canvasHeight, 0.1, 2000);
    this.camera.position.set(0, 500, 500);

    // 在屏幕中显示坐标
    var axes = new THREE.AxesHelper(1200);
    this.scene.add(axes);

    // controls 地图平移旋转缩放 操作工具
    this.controls = new OrbitControls(this.camera, this.canvasElement);
    this.controls.enableKeys = true;

    this.controls.addEventListener('change', () => {
      this.renderer.render(this.scene, this.camera);
    });

    // 白色平行光源  左前上方
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(-1000, 1000, -1000);
    this.scene.add(light);

    // 白色平行光源  右后上方
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1000, 1000, 1000);
    this.scene.add(light);

    // fps
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom);

    this.animate();
  }

  /**
   * 创建模型
   */
  createObjects() {
    var loader = new THREE.FileLoader();
    this.drawGround(960, 630, { x: 10, y: 10 });
    // this.drawStacks();
    loader.load('assets/shelves.json', (geojson: string) => {
      this.drawShelf(JSON.parse(geojson));
    })
    loader.load('assets/area.json', (geojson: string) => {
      this.drawArea(JSON.parse(geojson));
    })
  }

  /**
   * 绘制广场
   * @param length 长
   * @param width 宽
   * @param startPoint 起始点坐标 默认 {x: 0, y: 0}
   */
  drawGround(length, width, startPoint?: { x, y }) {
    this.reDraw();
    this.clearObj();

    if (!startPoint) {
      startPoint = { x: 0, y: 0 };
    }
    let ground = new THREE.Shape()
      .moveTo(startPoint.x, startPoint.y)
      .lineTo(startPoint.x, width + startPoint.y)
      .lineTo(length + startPoint.x, width + startPoint.y)
      .lineTo(length + startPoint.x, startPoint.y)
      .lineTo(startPoint.x, startPoint.y);

    // https://threejs.org/docs/#api/en/geometries/ExtrudeGeometry
    let extrudeSettings = { // 矩形
      steps: 1,
      depth: 2,
      bevelEnabled: false
    };
    this.groundXYZ = {
      x: startPoint.x,
      y: startPoint.y,
      z: extrudeSettings.depth
    }
    // This object extrudes a 2D shape to a 3D geometry.
    let groundGeometry = new THREE.ExtrudeGeometry(ground, extrudeSettings);
    let groundMesh = new THREE.Mesh(groundGeometry, new THREE.MeshPhongMaterial({ color: '#FFFFFF' }));
    groundMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2); // 将模型从y轴旋转到z轴

    groundMesh.userData.type = 'area';

    this.scene.add(groundMesh);
  }

  /**
   * 绘制货架
   * @param geojson 
   */
  drawShelf(geojson: GeoJson) {
    this.reDraw();
    let shelf = new Shelf();
    if (geojson.type === 'Feature') {
      const feature: Feature = geojson;
      if (feature && feature.properties && feature.properties.type === 'shelf') {
        const geometry = feature.geometry;
        if (geometry && geometry.type === 'Polygon') {
          const polygon: Polygon = feature.geometry;
          let coordinates = polygon.coordinates;
          shelf.vectors = [];
          coordinates.forEach((rings: Array<any>) => {
            rings.forEach(point => {
              shelf.vectors.push(new THREE.Vector2(point[0], point[1]));
            });
          })
          let shape = new THREE.Shape(shelf.vectors);

          shelf.height = feature.properties.height || shelf.height;
          shelf.width = feature.properties.width || shelf.width;
          shelf.levels = feature.properties.levels || shelf.levels;
          shelf.direction = feature.properties.direction || shelf.direction;

          this.drawShelfLevels(shape, shelf);
        }
      }
    } else if (geojson.type === 'FeatureCollection') {
      const collection: FeatureCollection = geojson;
      collection.features.forEach(feature => {
        this.drawShelf(feature)
      })
    }
  }

  /**
   * 绘制货架的每一层
   */
  drawShelfLevels(shape, shelf) {
    let heightArr = [];
    const depth = 1; // 层面高度
    if (shelf.height instanceof Array) {
      heightArr = shelf.height;
    } else {
      for (let index = 0; index < shelf.levels; index++) {
        heightArr.push(shelf.height);
      }
    }
    let currentHeight = this.groundXYZ.z;
    const shelfLevelGroup = new THREE.Group();
    shelfLevelGroup.userData = {
      type: 'Shelf',
      color: '#fff',
      opacity: 1
    }
    for (let index = 0; index < shelf.levels; index++) {
      const levelGroup = new THREE.Group();
      // 绘制货架每层上下方的面
      let levelGeo = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: false
      });
      let levelMat = new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 1, transparent: true });

      let levelBotMesh = new THREE.Mesh(levelGeo, levelMat);
      levelBotMesh.userData.opacity = 1;
      levelBotMesh.position.set(0, currentHeight, 0);

      currentHeight = currentHeight + heightArr[index]

      let levelTopMesh = new THREE.Mesh(levelGeo, levelMat);
      levelTopMesh.userData.opacity = 1;
      levelTopMesh.position.set(0, currentHeight - depth, 0);

      levelBotMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      levelTopMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

      levelGroup.add(levelBotMesh);
      levelGroup.add(levelTopMesh);

      // 绘制每层的4个角
      let points = shape.getPoints();
      if (
        points[0].x === points[points.length - 1].x &&
        points[1].y === points[points.length - 1].y
      ) {
        points = points.slice(0, points.length - 1);
      }

      let poleLength, poleWidth; // 定义柱子的长与宽
      if (shelf.direction === 'vertical') {
        poleLength = shelf.width || shelf.pole.length, poleWidth = shelf.pole.width;
      } else if (shelf.direction === 'horizontal') {
        poleLength = shelf.pole.width, poleWidth = shelf.width || shelf.pole.length;
      }
      let poleGeo = new THREE.BoxBufferGeometry(poleLength, heightArr[index], poleWidth); // 长/高/宽
      let poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 1, transparent: true });

      // 添加货柜四个角
      // let poleMeshsw = new THREE.Mesh(poleGeo, poleMat); // 西南角
      // poleMeshsw.position.set(points[0].x + poleLength / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[0].y + poleLength / 2));
      // let poleMeshse = new THREE.Mesh(poleGeo, poleMat); // 东南角
      // poleMeshse.position.set(points[1].x - poleLength / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[1].y + poleLength / 2));
      // let poleMeshne = new THREE.Mesh(poleGeo, poleMat); // 东北角
      // poleMeshne.position.set(points[2].x - poleLength / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[2].y - poleLength / 2));
      // let poleMeshnw = new THREE.Mesh(poleGeo, poleMat); // 西北角
      // poleMeshnw.position.set(points[3].x + poleLength / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[3].y - poleLength / 2));

      // shelfLevelGroup.add(poleMeshsw);
      // shelfLevelGroup.add(poleMeshse);
      // shelfLevelGroup.add(poleMeshne);
      // shelfLevelGroup.add(poleMeshnw);

      // 添加货柜2边的柱子
      let poleMeshfront = new THREE.Mesh(poleGeo, poleMat);
      poleMeshfront.userData.opacity = 1;
      poleMeshfront.position.set(points[0].x + poleLength / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[0].y + poleWidth / 2));
      let poleMeshbackend = new THREE.Mesh(poleGeo, poleMat);
      poleMeshbackend.userData.opacity = 1;
      poleMeshbackend.position.set(points[2].x + poleLength / 2 - poleLength, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[2].y - poleWidth / 2));

      levelGroup.add(poleMeshfront);
      levelGroup.add(poleMeshbackend);

      levelGroup.userData = {
        type: 'ShelfLevel',
        color: '#fff',
        opacity: 1
      };

      shelfLevelGroup.add(levelGroup);
      this.scene.add(shelfLevelGroup);
    }
  }

  /**
   * 绘制库位
   */
  drawStacks() {
    var loader = new THREE.FileLoader();
    loader.load('assets/stack.json', (geojson: string) => {
      this.drawStack(JSON.parse(geojson));
    })
  }

  /**
   * 绘制单个库位
   * @param geojson
   */
  drawStack(geojson: GeoJson) {
    this.reDraw();
    let stack = {} as Stack;
    if (geojson.type === 'Feature') {
      const feature: Feature = geojson;
      if (feature && feature.properties && feature.properties.type === 'stack') {
        const geometry = feature.geometry;
        const depth: any = feature.properties.height || 10;
        if (geometry && geometry.type === 'Polygon') {
          const polygon: Polygon = feature.geometry;
          let coordinates = polygon.coordinates;
          stack.vectors = [];
          coordinates.forEach((rings: Array<any>) => {
            rings.forEach(point => {
              stack.vectors.push(new THREE.Vector2(point[0], point[1]));
            });
          })
          let shape = new THREE.Shape(stack.vectors);
          let stackGeo = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: false
          });
          let stackMat = new THREE.MeshLambertMaterial({ color: 'red', opacity: 0.5, transparent: true });

          let stackMesh = new THREE.Mesh(stackGeo, stackMat);
          stackMesh.position.set(0, 2, 0);
          stackMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

          this.scene.add(stackMesh);
        }
      }
    } else if (geojson.type === 'FeatureCollection') {
      const collection: FeatureCollection = geojson;
      collection.features.forEach(feature => {
        this.drawShelf(feature)
      })
    }
  }

  /**
   * 绘制固定区域
   */
  drawArea(geojson: GeoJson) {
    this.reDraw();
    let area = new Area();
    if (geojson.type === 'Feature') {
      const feature: Feature = geojson;
      if (feature && feature.properties && feature.properties.type === 'area') {
        const geometry = feature.geometry;
        const depth: any = feature.properties.height || 10;
        if (geometry && geometry.type === 'Polygon') {
          const polygon: Polygon = feature.geometry;
          area.color = feature.properties.color ? feature.properties.color : area.color;
          let coordinates = polygon.coordinates;
          area.vectors = [];
          coordinates.forEach((rings: Array<any>) => {
            rings.forEach(point => {
              area.vectors.push(new THREE.Vector2(point[0], point[1]));
            });
          })
          let shape = new THREE.Shape(area.vectors);
          let areaGeo = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            bevelEnabled: false
          });

          let areakMat = new THREE.MeshLambertMaterial({
            color: area.color,
            opacity: 0.7,
            transparent: true,
          });

          let areaMesh = new THREE.Mesh(areaGeo, areakMat);
          areaMesh.position.set(0, 2, 0);
          areaMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

          areaMesh.userData.type = 'area';

          this.scene.add(areaMesh);
        }
      }
    } else if (geojson.type === 'FeatureCollection') {
      const collection: FeatureCollection = geojson;
      collection.features.forEach(feature => {
        this.drawArea(feature)
      })
    }
  }

  /**
   * 设置场景中的对象是否可以被选中
   */
  setSelectable(selectable: boolean) {
    if (selectable) {
      this.rayCaster = new THREE.Raycaster();
      this.rootElement.addEventListener('mousedown', this.remenberXY.bind(this), false);
      this.rootElement.addEventListener('mouseup', this.onSelectObject.bind(this), false);
      this.rootElement.addEventListener('touchstart', this.onSelectObject.bind(this), false);
    } else {
      this.rootElement.removeEventListener('mousedown', this.remenberXY.bind(this), false);
      this.rootElement.removeEventListener('mouseup', this.onSelectObject.bind(this), false);
      this.rootElement.removeEventListener('touchstart', this.onSelectObject.bind(this), false);
    }
    return this;
  }

  /**
   * 记录鼠标初始位置
   */
  remenberXY(event: MouseEvent) {
    if (event.button != 0)
      return;
    else {
      this.museXY.X = event.screenX;
      this.museXY.Y = event.screenY;
    }
  }

  // 当场景元素设置为“可选”。鼠标点击或者触摸屏点击时执行函数，来处理xxxxxxxxxx选中
  onSelectObject(event: MouseEvent) {
    if (event.button != 0)
      return;
    if (event.screenX !== this.museXY.X || event.screenY !== this.museXY.Y)
      return;
    this.reDraw();
    // 查找相交的对象
    event.preventDefault();
    var mouse = new THREE.Vector2();

    // TODO: 触屏交互
    // 	mouse.x = ((<TouchEvent>event).touches[0].clientX / this.canvasEle.clientWidth) * 2 - 1;
    // 	mouse.y = -((<TouchEvent>event).touches[0].clientY / this.canvasEle.clientHeight) * 2 + 1;
    mouse.x = ((<MouseEvent>event).clientX / this.canvasElement.clientWidth) * 2 - 1;
    mouse.y = -((<MouseEvent>event).clientY / this.canvasElement.clientHeight) * 2 + 1;

    // var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    // vector.unproject(this.camera);

    // this.rayCaster.set(this.camera.position, vector.sub(this.camera.position).normalize());
    this.rayCaster.setFromCamera(mouse, this.camera);

    let intersects = this.rayCaster.intersectObjects(this.scene.children, true);

    // 有可选中的obj
    if (intersects.length > 0) {
      this.scene.children.forEach((obj: any) => {
        this.fadeOut(obj);
      });
      for (var i = 0; i < intersects.length; i++) {
        let selectedObj = intersects[i].object;
        if (selectedObj.userData.type === 'area') {
          // continue;
        }
        if (!(selectedObj.parent instanceof THREE.Scene)) {
          selectedObj = selectedObj.parent;
        }
        if (selectedObj instanceof THREE.Mesh) {
          // 恢复为以前的颜色
          if (this.selectedMesh) {
            this.reset(this.selectedMesh);
          }
          this.selectedMesh = selectedObj as THREE.Mesh;
          // 存储当前颜色
          this.selectedMesh.currentHex = this.selectedMesh.material.color.getHex();
          // 设置新的选中颜色
          this.selectedMesh.material.color = new THREE.Color(this.selectedColor);
          this.selectedMesh.material.opacity = 0.7;
          // 设置选中后显示模型名称
          // 计算模型的uv坐标供材质贴图使用
          // DrawUtil.assignUVs(this.selectedMesh.geometry);
          // this.selectedMesh.material.map = new THREE.CanvasTexture(DomUtil.createTextCanvas(this.selectedMesh.userData.type));

          if (this.selectionListener) {
            this.selectionListener(this.selectedMesh.id); //notify the listener
          }
          break;
        } else if (selectedObj instanceof THREE.Group) {
          // 恢复为以前的颜色
          if (this.selectedMesh === selectedObj) {
            this.scene.children.forEach((obj: any) => {
              this.fadeIn(obj);
            });
            this.reset(this.selectedMesh);
            this.selectedMesh = null;
            return;
          }
          this.selectedMesh = selectedObj;

          if (this.selectedMesh.parent && this.selectedMesh.parent.userData.type === 'Shelf') {
            this.reset(this.selectedMesh.parent);
          }

          this.selectedMesh.children.forEach(mesh => {
            mesh.material.color = new THREE.Color(this.selectedColor);
            mesh.material.opacity = 0.7;
          });
          break;
        }
      }
    }
  }

  /**
   * 将模型还原
   * @param obj THREE.Object3D
   */
  fadeIn(obj) {
    if (obj.type === 'Mesh') {
      obj.material.opacity = obj.userData.opacity || 0.7;
    } else if (obj.type === 'Group') {
      obj.children.forEach((child: any) => {
        this.fadeIn(child)
      })
    }
  }

  /**
   * 将模型淡出
   * @param obj THREE.Object3D
   */
  fadeOut(obj) {
    if (obj.type === 'Mesh') {
      if (!obj.userData.opacity) {
        obj.userData.opacity = obj.material.opacity;
      }
      obj.material.opacity = 0.1;
    } else if (obj.type === 'Group') {
      obj.children.forEach((child: any) => {
        this.fadeOut(child)
      })
    }
  }

  /**
   * 还原模型初始状态(颜色等属性)
   * @param object3d 
   */
  reset(object3d: any, color?: any) {
    if (object3d.type === 'Mesh') {
      if (!!color) {
        object3d.material.color = new THREE.Color(color);
      } else {
        object3d.material.color.setHex(object3d.currentHex);
      }
      object3d.material.opacity = object3d.userData.opacity;
    } else if (object3d.type === 'Group') {
      for (let i = 0; i < object3d.children.length; i++) {
        this.reset(object3d.children[i], object3d.userData.color);
      }
    }
  }

  /**
   * 清空场景中绘制的对象
   */
  clearObj() {
    let stableObjs = [];
    while (this.scene.children.length) {
      if (this.scene.children[0].type === 'DirectionalLight'
        || this.scene.children[0] instanceof THREE.AxesHelper) {
        stableObjs.push(this.scene.children[0]);
      }
      this.scene.remove(this.scene.children[0]);
    }
    stableObjs.forEach(element => {
      this.scene.add(element);
    });
  }

  /**
   * 更新场景
   */
  animate() {
    this.stats.begin();
    requestAnimationFrame(this.animate.bind(this));

    if (this.sceneChanged) {
      this.controls.update();
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      // 更新labels
      // if (this.showNames || this.isShowPubPoints) {
      //   // this.updateLabels();
      // }
    }
    this.sceneChanged = false;
    this.stats.end();
  }

  /**
	 * 标识重新场景改变，出发animate重新绘制
	 */
  reDraw() {
    this.sceneChanged = true;
  }
}

export class MapOptions {
  rootElement?: HTMLElement;
  selectable?: boolean;
}