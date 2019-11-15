# warehouse3d
 该项目使用 [three.js](https://github.com/mrdoob/three.js) 完成仓库的三维图形建模，同时使用 [three-orbitcontrols](https://github.com/fibo/three-orbitcontrols) 完成三维视图的控制（旋转，拉伸，收缩等操作）。

## 安装
```
npm install
```
## 运行
```
npm run serve
```
## 建模
1. 数据格式参照 [GeoJson](https://geojson.org/), 测试数据格式参考 [http://geojson.io/](http://geojson.io/)
   ```
   {
     "type": "Feature",
     "geometry": {
       "type": "Point",
       "coordinates": [125.6, 10.1]
     },
     "properties": {
       "name": "Dinagat Islands"
     }
   }
   ```
2. 生成场景
   ```
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
   ```
3. 更新场景
    ```
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
   ```
4. 清空场景模型
   ```
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
   ```
## 部署
1. 安装node进程管理工具[PM2](https://pm2.keymetrics.io/)
   ```
   npm install pm2 -g
   ```
2. 配置PM2配置文件 pm2.config.js
   ```
   module.exports = {
     apps: [
       {
         name: "express", // app name in pm2
         script: "./bin/www",
         watch: true,
         instances: 2, // 启动实例
         exec_mode: "cluster", // 多服务模式
         increment_var: 'PORT', // 一个实例对应一个端口，端口自增
         env: {
           "PORT": 3000,
           "NODE_ENV": "development"
         },
         env_prod: {
           "PORT": 80,
           "NODE_ENV": "production",
         }
       }
     ]
   }
   ```
3. 启动服务
   ```
   pm2 start pm2.config.js --env prod
   ```
   ![serve](./public/readme/serve.png)
   按如上配置运行后 ip:80 或 ip:81 都可访问接口