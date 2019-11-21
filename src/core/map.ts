import * as THREE from 'three';
import * as OrbitControls from 'three-orbitcontrols';
import * as Stats from 'stats.js'
import { Detector } from './detector';
import { DomUtil } from '../utils/dom.util';
import { GeoJson } from '../geojson/geojson';
import { Feature } from '../geojson/feature';
import { FeatureCollection } from '../geojson/feature-collection';
import { Polygon } from '../geojson/polygon';
import { Shelf, ShelfListener, ShelfLevelListener } from './modal/shelf';
import { Stack } from './modal/stack';
import { Area } from './modal/area';
import { DrawUtil, MaterialType } from '../utils/draw.util';
import { GeoJsonUtil } from '../utils/geojson.util';
import { Warehouse, Type } from './modal/warehouse';
import { GroundListener } from './modal/ground';
import { EventType } from './event/event-type';
import { Theme, DefaultTheme } from '../themes/default.theme';
import { GeometryType } from '../geojson/Geometry';
import { WarehouseConfig } from '../configs/warehouse.config';

// const area = require('../assets/json/area.json');
// const shelf = require('../assets/json/shelf.json');
// const stack = require('../assets/json/stack.json');

export class Map {

  /**
   * 仓库数据
   */
  warehouse: Warehouse;
  /**
   * 主题
   */
  theme: Theme;
   /**
   * 配置
   */
  config: WarehouseConfig = new WarehouseConfig();

  scene: THREE.Scene; // 3d地图渲染场景
  renderer: THREE.WebGLRenderer; // 2、3d地图渲染场景渲染器
  camera: THREE.PerspectiveCamera; // 3d地图渲染场景视点相机
  controls: any; // 3d 缩放旋转平移控制器 OrbitControls
  rayCaster: THREE.Raycaster; // 给模型绑定点击事件
  stats: Stats; // fps 工具
  sceneChanged: boolean = true; // 场景是否改变

  museXY = { X: 0, Y: 0 };
  selectedMesh: any;
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

    // 初始化主题
    if (!options || !options.theme) {
      this.theme = new DefaultTheme();
    }

    // 初始化根元素
    if (options && !!options.rootElement) {
      this.rootElement = options.rootElement;
    } else {
      this.rootElement = DomUtil.createRootEle();
    }
    // 初始化 Canvas 元素
    this.canvasElement = DomUtil.createCanvasEle(this.rootElement);

    // 初始化场景
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
    this.renderer.setClearColor(this.theme.background, 1.0);

    // 相机
    this.camera = new THREE.PerspectiveCamera(50, canvasWidth / canvasHeight, 0.1, 2000);
    this.camera.position.set(0, 500, 500);

    // 在屏幕中显示坐标
    var axes = new THREE.AxesHelper(1200);
    this.scene.add(axes);

    // controls 地图平移旋转缩放 操作工具
    this.controls = new OrbitControls(this.camera, this.canvasElement);
    this.controls.maxPolarAngle = 0.9 * Math.PI / 2; // 设置镜头最大下视角度(鼠标上下移动)
    this.controls.minDistance = 200; // 设置相机距离原点的最小距离(鼠标滚轮向前滚动)
    this.controls.maxDistance = 1000; // 设置镜头最大视距(鼠标滚轮向后滚动)
    this.controls.enableKeys = true;

    // 操作控制器重新渲染场景
    this.controls.addEventListener(EventType.CHANGE, () => {
      if (this.camera.position.y <= this.config.criticalPoint && !this.config.isShowMeshLabel) {
        this.config.isShowMeshLabel = true;
        this.updateLabels();
      } else if (this.camera.position.y > this.config.criticalPoint && this.config.isShowMeshLabel) {
        this.config.isShowMeshLabel = false;
        this.updateLabels();
      }
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

    // grid
    var helper: any = new THREE.GridHelper(2000, 200); // 2000/200 一个格子的边长为 10
    helper.position.set(0, 0, 0);
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    this.scene.add(helper);

    this.animate();
  }

  /**
   * 创建模型
   */
  createObjects() {
    // this.drawArea(area);
    // this.drawShelf(shelf);
    // this.drawStack(stack);
    var loader = new THREE.FileLoader();

    loader.load('assets/json/all.json', (geojson: string) => {
      this.warehouse = GeoJsonUtil.parse(geojson);

      this.drawGround(960, 630, { x: 10, y: 10, z: 0 });
      this.drawArea(this.warehouse.areas);
      this.drawShelf(this.warehouse.shelves);
      this.drawStack(this.warehouse.stacks);
    })

    // loader.load('assets/json/area.json', (geojson: string) => {
    //   this.drawArea(JSON.parse(geojson));
    // })
    // loader.load('assets/json/shelves.json', (geojson: string) => {
    //   this.drawShelf(JSON.parse(geojson));
    //   loader.load('assets/json/stacks.json', (geojson: string) => {
    //     this.drawStack(JSON.parse(geojson));
    //   })
    // })
  }

  /**
   * 绘制广场
   * @param width 长
   * @param depth 深
   * @param point 起始点坐标，默认：{x: 0, y: 0, z: 0}
   */
  drawGround(width, depth, point: { x, y, z } = { x: 0, y: 0, z: 0 }) {
    this.reDraw();

    let ground = new THREE.Shape()
      .moveTo(point.x, point.y)
      .lineTo(point.x, depth + point.y)
      .lineTo(width + point.x, depth + point.y)
      .lineTo(width + point.x, point.y)
      .lineTo(point.x, point.y);

    // 设置纹理
    // @reference https://threejs.org/docs/index.html#api/en/textures/Texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load('assets/images/stone.jpg');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);

    const groundMesh = DrawUtil.createExtrudeMesh(
      ground.getPoints(),
      { steps: 1, depth: this.config.groundHeight, bevelEnabled: false },
      MaterialType.MeshPhongMaterial,
      { ...this.theme.ground, bumpMap: texture },
      { x: 0, y: 0, z: 0 },
      { type: Type.GROUND, material: { ...this.theme.ground } },
      [{ name: EventType.CLICK, event: GroundListener.click }]
    );
    // 添加事件
    // groundMesh.addEventListener(EventType.CLICK, GroundListener.click);

    groundMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2); // 将模型从y轴旋转到z轴
    this.scene.add(groundMesh);

    return groundMesh;
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
      if (feature && feature.properties && feature.properties.type === Type.SHELF) {
        shelf = { ...shelf, ...feature.properties };

        const geometry = feature.geometry;
        if (geometry && geometry.type === GeometryType.Polygon) {
          const polygon: Polygon = feature.geometry;
          let coordinates = polygon.coordinates;
          shelf.vectors = [];
          coordinates.forEach((rings: Array<any>) => {
            rings.forEach(point => {
              shelf.vectors.push(new THREE.Vector2(point[0], point[1]));
            });
          })
          let shape = new THREE.Shape(shelf.vectors);

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
    if (shelf.height instanceof Array) {
      heightArr = shelf.height;
    } else {
      for (let index = 0; index < shelf.levels; index++) {
        heightArr.push(shelf.height);
      }
    }
    let currentHeight = this.config.groundHeight;
    const shelfGroup = new THREE.Group();
    shelfGroup.userData = {
      material: {
        ...this.theme.shelf,
      },
      ...shelf
    }
    for (let index = 0; index < shelf.levels; index++) {
      const levelGroup = new THREE.Group();
      // 绘制货架每层上下方的面
      let levelGeo = new THREE.ExtrudeGeometry(shape, {
        depth: this.config.surfaceHeight,
        bevelEnabled: false
      });
      let levelMat = new THREE.MeshLambertMaterial(this.theme.shelf.level);

      let levelBotMesh = new THREE.Mesh(levelGeo, levelMat);
      levelBotMesh.userData.material = { ...this.theme.shelf.level };
      levelBotMesh.position.set(0, currentHeight, 0);

      currentHeight = currentHeight + heightArr[index]

      let levelTopMesh = new THREE.Mesh(levelGeo, levelMat);
      levelTopMesh.userData.material = { ...this.theme.shelf.level };
      levelTopMesh.position.set(0, currentHeight - this.config.surfaceHeight, 0);

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

      let poleWidth, poleDepth; // 定义柱子的长与宽
      if (shelf.direction === 'vertical') {
        poleWidth = shelf.width || shelf.pole.width, poleDepth = shelf.pole.depth;
      } else if (shelf.direction === 'horizontal') {
        poleWidth = shelf.pole.depth, poleDepth = shelf.width || shelf.pole.width;
      }
      let poleGeo = new THREE.BoxBufferGeometry(poleWidth, heightArr[index], poleDepth); // 长/高/宽
      let poleMat = new THREE.MeshLambertMaterial(this.theme.shelf.pole);

      // 添加货柜四个角
      // let poleMeshsw = new THREE.Mesh(poleGeo, poleMat); // 西南角
      // poleMeshsw.position.set(points[0].x + poleWidth / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[0].y + poleWidth / 2));
      // let poleMeshse = new THREE.Mesh(poleGeo, poleMat); // 东南角
      // poleMeshse.position.set(points[1].x - poleWidth / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[1].y + poleWidth / 2));
      // let poleMeshne = new THREE.Mesh(poleGeo, poleMat); // 东北角
      // poleMeshne.position.set(points[2].x - poleWidth / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[2].y - poleWidth / 2));
      // let poleMeshnw = new THREE.Mesh(poleGeo, poleMat); // 西北角
      // poleMeshnw.position.set(points[3].x + poleWidth / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[3].y - poleWidth / 2));

      // shelfLevelGroup.add(poleMeshsw);
      // shelfLevelGroup.add(poleMeshse);
      // shelfLevelGroup.add(poleMeshne);
      // shelfLevelGroup.add(poleMeshnw);

      // 添加货柜2边的柱子
      let poleMeshfront = new THREE.Mesh(poleGeo, poleMat);
      poleMeshfront.userData.material = { ...this.theme.shelf.pole };
      if (this.config.useInheritStyle) {
        poleMeshfront.position.set(points[0].x + poleWidth / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[0].y + poleDepth / 2));
      } else {
        if (shelf.direction === 'vertical') {
          // z轴最后 - poleDepth 为预留柱子宽，不占用货架总宽。
          poleMeshfront.position.set(points[0].x + poleWidth / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[0].y + poleDepth / 2 - poleDepth));
        } else if (shelf.direction === 'horizontal') {
          // x轴最后 - poleWidth 为预留柱子宽，不占用货架总宽。
          poleMeshfront.position.set(points[0].x + poleWidth / 2 - poleWidth, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[0].y + poleDepth / 2));
        } else {
          poleMeshfront.position.set(points[0].x + poleWidth / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[0].y + poleDepth / 2));
        }
      }

      let poleMeshbackend = new THREE.Mesh(poleGeo, poleMat);
      poleMeshbackend.userData.material = { ...this.theme.shelf.pole };
      if (this.config.useInheritStyle) {
        poleMeshbackend.position.set(points[2].x + poleWidth / 2 - poleWidth, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[2].y - poleDepth / 2));
      } else {
        if (shelf.direction === 'vertical') {
          // z轴最后 + poleDepth 为预留柱子宽，不占用货架总宽。
          poleMeshbackend.position.set(points[2].x + poleWidth / 2 - poleWidth, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[2].y - poleDepth / 2 + poleDepth));
        } else if (shelf.direction === 'horizontal') {
          // x轴最后不 - poleWidth 为预留柱子宽，不占用货架总宽。
          poleMeshbackend.position.set(points[2].x + poleWidth / 2, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[2].y - poleDepth / 2));
        } else {
          poleMeshbackend.position.set(points[2].x + poleWidth / 2 - poleWidth, heightArr[index] / 2 + currentHeight - heightArr[index], -(points[2].y - poleDepth / 2));
        }
      }

      levelGroup.add(poleMeshfront);
      levelGroup.add(poleMeshbackend);

      levelGroup.userData = {
        type: Type.SHELF_LEVEL,
        coordinate: { y: currentHeight },
        level: index + 1 // 从 1 开始
      };

      // 添加层位点击事件
      levelGroup.addEventListener(EventType.CLICK, ShelfLevelListener.click);
      shelfGroup.add(levelGroup);
      // 添加货架事件
      shelfGroup.addEventListener(EventType.CLICK, ShelfListener.click);
      this.scene.add(shelfGroup);
    }
  }

  /**
   * 绘制库位
   * @param geojson
   */
  drawStack(geojson: GeoJson) {
    this.reDraw();
    let stack = new Stack();
    if (geojson.type === 'Feature') {
      const feature: Feature = geojson;
      if (feature && feature.properties && feature.properties.type === 'stack') {
        stack = { ...stack, ...feature.properties };
        // 找到指定货架
        const shelf = this.target(stack.shelfId, Type.SHELF);
        if (!shelf) {
          console.warn('找不到货架：[' + stack.shelfId + ']');
          return;
        }
        // feature.properties.height -- 用户定义的库位高度
        // shelf.userData.height[stack.shelfLevel - 1] -- 用户定义的库位对应的货架层高
        // shelf.userData.height -- 用户定义的货架层高
        // stack.height -- 默认的库位高度
        stack.height = (feature.properties.height || shelf.userData.height[stack.shelfLevel - 1] || shelf.userData.height || stack.height) - this.config.surfaceHeight * 2;

        const geometry = feature.geometry;
        if (geometry && geometry.type === GeometryType.Polygon) {
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
            depth: stack.height,
            bevelEnabled: false
          });
          let stackMat = new THREE.MeshLambertMaterial(this.theme.stack);

          let currentHeight = 0;
          if (shelf.userData.height instanceof Array) {
            currentHeight += this.config.surfaceHeight;
            for (let index = 1; index < stack.shelfLevel; index++) {
              currentHeight += shelf.userData.height[index - 1];
            }
          } else {
            currentHeight += this.config.surfaceHeight;
            for (let index = 1; index < stack.shelfLevel; index++) {
              currentHeight += shelf.userData.height;
            }
          }
          // 设置该库位对应货架的 y 轴位置（由货架每层高度计算得出）
          const y = this.config.groundHeight + currentHeight;

          let stackMesh = new THREE.Mesh(stackGeo, stackMat);
          stackMesh.position.set(0, y, 0);
          stackMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

          stackMesh.userData = {
            ...stack,
            material: {
              ...this.theme.stack
            }
          };

          this.scene.add(stackMesh);
        }
      }
    } else if (geojson.type === 'FeatureCollection') {
      const collection: FeatureCollection = geojson;
      collection.features.forEach(feature => {
        this.drawStack(feature)
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
      if (feature && feature.properties && feature.properties.type === Type.AREA) {
        area = { ...area, ...feature.properties };

        const geometry = feature.geometry;
        const depth: any = feature.properties.height || 10;
        if (geometry && geometry.type === GeometryType.Polygon) {
          const polygon: Polygon = feature.geometry;
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

          const style = this.theme.area(area.color);
          let areakMat = new THREE.MeshLambertMaterial(style);

          let areaMesh = new THREE.Mesh(areaGeo, areakMat);
          areaMesh.position.set(0, 2, 0);
          areaMesh.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

          areaMesh.userData = {
            ...area,
            material: {
              ...style
            }
          };

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
      this.fadeOutAll();
      for (var i = 0; i < intersects.length; i++) {
        let selectedObj: any = intersects[i].object;
        if (selectedObj.userData.type === 'ground') {
          if (selectedObj.hasEventListener('click', GroundListener.click)) { // 检查是否有点击事件
            selectedObj.dispatchEvent({ type: 'click', message: 'vroom vroom!' }); // 触发点击事件
          }
          this.fadeInAll();
          if (this.selectedMesh) {
            this.reset(this.selectedMesh);
            this.selectedMesh = null;
          }
          break;
        }
        if (selectedObj.userData.type === Type.AREA) {
          this.fadeInAll();
          // 恢复为以前的颜色
          if (this.selectedMesh) {
            this.reset(this.selectedMesh);
            this.selectedMesh = null;
          }

          this.handleAreaObj(selectedObj);
          break; // 只处理数组第一个即最近的一个模型
          // continue;
        }
        this.handleSelectedObj(intersects[i].object);
        break; // 只处理数组第一个即最近的一个模型
      }
    }
  }

  /**
   * 处理 Area, 显示/隐藏文字标注
   */
  handleAreaObj(selectedObj) {
    if (selectedObj.userData.type !== Type.AREA) {
      return;
    }
    if (!selectedObj.userData.name) {
      return;
    }
    if (!!selectedObj.userData.showName) { // 隐藏名称
      selectedObj.userData.showName = false;
      this.scene.remove(selectedObj.userData.nameMesh);
    } else { // 显示名称
      const size = 100;
      // 计算最大最小
      selectedObj.geometry.computeBoundingBox();
      var box = selectedObj.geometry.boundingBox;
      var vertices = [];
      vertices.push((box.max.x - box.min.x) / 2 + box.min.x, (box.max.y - box.min.y) / 2 + box.min.y, (box.max.z - box.min.z));
      var geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      var material = new THREE.PointsMaterial({
        size: size,
        map: new THREE.CanvasTexture(DomUtil.createTextCanvas(selectedObj.userData.name)),
        // blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      });
      var points = new THREE.Points(geometry, material);
      points.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      this.scene.add(points);
      selectedObj.userData.showName = true;
      selectedObj.userData.nameMesh = points;
    }
  }

  /**
   * 处理选中模型
   */
  handleSelectedObj(selectedObj) {
    // 如果 selectedObj 父对象不是 THREE.Scene，则获取其父对象进行操作，一般为 THREE.Group
    if (!(selectedObj.parent instanceof THREE.Scene)) {
      selectedObj = selectedObj.parent;
    }

    // 恢复为以前的颜色
    if (this.selectedMesh === selectedObj) {
      this.fadeInAll();
      this.reset(this.selectedMesh);
      this.selectedMesh = null;
      return;
    }

    // 之前选中模型恢复为原始状态
    if (this.selectedMesh) {
      this.reset(this.selectedMesh, 'color');
      this.selectedMesh = null;
    }

    if (selectedObj instanceof THREE.Mesh) {
      this.selectedMesh = selectedObj as THREE.Mesh;
      // 存储当前颜色
      this.selectedMesh.currentHex = this.selectedMesh.material.color.getHex();
      // 设置新的选中颜色
      this.selectedMesh.material.color = new THREE.Color(this.theme.selectedColor);
      this.selectedMesh.material.opacity = 0.7;

      // 如果选中模型是库位，则找到库位相关的货架及层位，还原对应层位的状态
      if (this.selectedMesh.userData.type === 'Stack') {
        let shelfMesh = this.selectedMesh.userData.shelfMesh;
        if (!shelfMesh) {
          shelfMesh = this.scene.children.find(obj =>
            obj.userData && obj.userData.type === 'Shelf' && obj.userData.id === this.selectedMesh.userData.shelfId
          )
          this.selectedMesh.userData.shelfMesh = shelfMesh;
        }
        this.reset(shelfMesh.children[this.selectedMesh.userData.shelfLevel - 1]);
      }

      if (this.selectionListener) {
        this.selectionListener(this.selectedMesh.id); //notify the listener
      }
    } else if (selectedObj instanceof THREE.Group) {
      this.selectedMesh = selectedObj;

      // 如果选中模型的父模型的类型是货架，则重置货架所有子模型
      if (this.selectedMesh.parent && this.selectedMesh.parent.userData.type === 'Shelf') {
        this.reset(this.selectedMesh.parent);
        // 选中货架，还原对应货架的库位状态
        let stackMesh = this.selectedMesh.parent.userData.stackMesh;
        if (!stackMesh) {
          stackMesh = this.scene.children.filter(obj =>
            obj.userData &&
            obj.userData.type === 'Stack' &&
            obj.userData.shelfId === this.selectedMesh.parent.userData.id
          )
          this.selectedMesh.userData.stackMesh = stackMesh;
        }
        // 获取层位信息并还原层位状态
        stackMesh = stackMesh.filter(obj =>
          obj.userData.shelfLevel === this.selectedMesh.userData.level
        );
        this.reset(stackMesh);
      }

      // 给选中模型添加状态（选中颜色）
      this.selectedMesh.children.forEach(mesh => {
        mesh.material.color = new THREE.Color(this.theme.selectedColor);
        mesh.material.opacity = mesh.userData.material.opacity || this.selectedMesh.userData.material.opacity; // 还原透明度
      });
    }
  }

  /**
   * 还原场景内所有模型
   */
  private fadeInAll() {
    this.scene.children.forEach(obj => {
      this.fadeIn(obj);
    })
  }

  /**
   * 还原指定模型
   * private
   * @param obj THREE.Object3D
   */
  private fadeIn(obj) {
    if (obj.type === 'Mesh') {
      obj.material.opacity = obj.userData.material.opacity || 0.7;
    } else if (obj.type === 'Group') {
      obj.children.forEach((child: any) => {
        this.fadeIn(child)
      })
    }
  }

  /**
   * 淡出场景内所有模型
   */
  private fadeOutAll() {
    this.scene.children.forEach(obj => {
      this.fadeOut(obj);
    })
  }

  /**
   * 淡出模型
   * private
   * @param obj THREE.Object3D
   */
  private fadeOut(obj) {
    if (obj.type === 'Mesh') {
      if (obj.userData.material && !obj.userData.material.opacity) {
        obj.userData.material.opacity = obj.material.opacity;
      }
      obj.material.opacity = 0.1;
    } else if (obj.type === 'Group') {
      obj.children.forEach((child: any) => {
        this.fadeOut(child)
      })
    }
  }

  /**
   * 找到指定模型
   * @id userData.id
   * @type userData.type
   */
  private target(id, type) {
    return this.scene.children.find(obj => obj.userData.id === id && obj.userData.type === type)
  }

  /**
   * 还原模型初始状态(颜色等属性)
   * @param object3d 
   */
  reset(object3d: any, type?: 'color' | 'opacity') {
    if (object3d.type === 'Mesh') {
      if (type === 'color') {
        object3d.material.color = new THREE.Color(object3d.userData.material.color);
      } else if (type === 'opacity') {
        object3d.material.opacity = object3d.userData.material.opacity;
      } else {
        object3d.material.color = new THREE.Color(object3d.userData.material.color);
        object3d.material.opacity = object3d.userData.material.opacity;
      }
    } else if (object3d.type === 'Group') {
      for (let i = 0; i < object3d.children.length; i++) {
        this.reset(object3d.children[i], type);
      }
    } else if (object3d instanceof Array) {
      object3d.forEach(obj => {
        this.reset(obj);
      })
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
    }
    this.sceneChanged = false;
    this.stats.end();
  }

  /**
   * 更新文字标注
   */
  updateLabels() {
    this.scene.children.forEach(obj => {
      this.handleAreaObj(obj);
    })
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
  theme?: Theme;
}