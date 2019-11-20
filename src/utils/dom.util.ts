export class DomUtil {

  // 创建根元素
  static createRootEle(): HTMLElement {
    let rootEle = document.createElement('div');
    rootEle.style.width = '100%';
    rootEle.style.height = '100%';
    rootEle.style.top = '0px';
    rootEle.style.left = '0px';
    rootEle.style.position = 'absolute';
    rootEle.style.overflow = "hidden"
    rootEle.id = 'threeroot';
    document.body.appendChild(rootEle);
    document.body.style.margin = '0';
    return rootEle;
  }

  /**
   * 创建 Canvas 元素
   * @param pEle 父级元素
   * @param logo 是否创建右下角logo元素
   */
  static createCanvasEle(pEle: HTMLElement, logo: boolean = false): HTMLCanvasElement {
    let canvasEle = document.createElement('canvas');
    canvasEle.style.width = '100%';
    canvasEle.style.height = '100%';
    pEle.appendChild(canvasEle);

    if (!!logo) {
      createLogoEle(pEle);
    }

    return canvasEle;

    function createLogoEle(pEle: HTMLElement): HTMLElement {
      let logoEle = document.createElement('a');
      logoEle.href = 'https://github.com/PomeloMan/warehouse3d';
      logoEle.innerText = 'Warehouse';
      logoEle.style.color = "#ff4d4f";
      logoEle.style.width = '100px';
      logoEle.style.height = '20px';
      logoEle.style.bottom = '10px';
      logoEle.style.right = '20px';
      logoEle.style.position = 'absolute';
      logoEle.style.textDecoration = 'none';
      pEle.appendChild(logoEle);
      return logoEle;
    }
  }

  /**
   * 绘制文本
   * @param text 文本内容
   * @param backgroundColor 画布背景色,默认:rgba(255,255,255,0)
   * @param color 文字颜色,默认:rgba(0,0,0,1)
   * @param width 画布长,默认64
   * @param height 画布宽,默认64
   * @param fontSize 字体大小,默认12
   */
  static createTextCanvas(
    text: string,
    backgroundColor = 'rgba(255, 255, 255, 0)',
    color = 'rgba(0, 0, 0, 1)',
    width: number = 64,
    height: number = 64,
    fontSize = 12
  ) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      ctx.font = fontSize + 'px " bold';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // ctx.fillText(text, width / 2, height / 2);

      // 文字换行
      var chr = text.split("");
      var temp = "";
      var row = [];
      for (var a = 0; a < chr.length; a++) {
        if (ctx.measureText(temp).width > (width - 12)) {
          row.push(temp);
          temp = "";
        }
        temp += chr[a];
      }
      row.push(temp);
      for (var b = 0; b < row.length; b++) {
        ctx.fillText(row[b], width / 2, 0 + (b + 1) * 12);
      }
    }
    return canvas;
  }
}