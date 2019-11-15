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

  // 创建 Canvas 元素
  static createCanvasEle(pEle: HTMLElement): HTMLCanvasElement {
    let canvasEle = document.createElement('canvas');
    canvasEle.style.width = '100%';
    canvasEle.style.height = '100%';
    pEle.appendChild(canvasEle);

    createLogoEle(pEle);

    return canvasEle;

    function createLogoEle(pEle: HTMLElement): HTMLElement {
      let logoEle = document.createElement('a');
      logoEle.innerText = "";
      logoEle.style.color = "red";
      logoEle.style.width = '100px';
      logoEle.style.height = '20px';
      logoEle.style.bottom = '10px';
      logoEle.style.right = '20px';
      logoEle.style.position = 'absolute';
      pEle.appendChild(logoEle);
      return logoEle;
    }
  }

  /**
   * 
   * @param text 
   */
  static createTextCanvas(text: string, width: number = 64, height: number = 64) {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(170, 92, 64, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = 12 + 'px " bold';
      ctx.fillStyle = '#fff';
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