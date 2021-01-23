function shape(mapBuilder) {
  /*  this.copy=copy;
    this.cobj=cobj;
    this.xp=xp;
    this.canvasW=copy.offsetWidth;
    this.canvasH=copy.offsetHeight;*/
  this.fillStyle = '#000'
  this.strokeStyle = '#000'
  this.lineWidth = 1
  this.type = 'line'
  this.style = 'stroke'
  this.history = []
  this.biannum = 5
  this.jiaonum = 5
  this.xpsize = 10
  this.isback = true
  //画轨道图
  this.pathNodes = []
  this.mapBuilder = null
  //计算下一个排序值
  this.curSortId = 0

  //绘图用canva
  this.canvas2d = null
  //缩放比例
  this.scaleX = 1
  this.scaleY = 1
  //当前地图显示的div
  this.div = null
  this.domCanvas = null
  //判断是否加载成功
  this.loaded = false
  //判断的是否附加到div上
  this.attached = false

  this.selectfunc = null

  this.startMousePosition = {
    x: 0,
    y: 0,
  }
  ;(this.curPathNode = null), (this.mapBuilder = mapBuilder)
  /*this.mapBuilder.canvas2d=this.cobj;
    this.mapBuilder.dom=this.copy;*/
  //机器人轨道图绑定
  this.mapBuilder.bindToDiv($('.canvas'))
  this.mapBuilder.mapController.redrawPath()
}

//获取像素的值
shape.prototype.getPixelValue = function (px) {
  if (px) {
    return parseInt(px.replace('px', ''))
  }
}

shape.prototype = {
  init: function () {
    this.cobj.fillStyle = this.fillStyle
    this.cobj.strokeStyle = this.strokeStyle
    this.cobj.lineWidth = this.lineWidth
    this.xp.style.display = 'none'
  },
  bindToDiv: function () {
    this.mapBuilder = new MapBuilder()
    this.mapBuilder.canvas2d = this.cobj
    this.mapBuilder.dom = this.copy
    //机器人轨道图绑定
    this.mapBuilder.bindToDiv($('.canvas'))
    this.mapBuilder.mapController.redrawPath()
  },
  draw: function () {
    var that = this
    that.copy.onmousedown = function (e) {
      that.init()
      var startx = e.offsetX
      var starty = e.offsetY
      //当断当前是否有轨道点
      //document.write("<script language=javascript src='js/mapbuilder.js'></script>");

      var angle = 0
      switch (parseInt(that.type)) {
        case MapBuilderConstant.TOOL_ADD_PATHNODE_LINE:
          angle = 0
          break
        case MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90:
          angle = 90
          break
        case MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90MINUS:
          angle = -90
          break
      }
      console.log(
        'that.type:' +
          that.type +
          ',that.pathNodes:' +
          that.mapBuilder.mapController.pathNodes.length +
          ',angle:' +
          angle
      )
      //that.curPathNode=that.mapBuilder.mapController.addNewPathNode(startx, starty, angle,1)
      /* that.copy.onmousemove=function(e){
                that.cobj.clearRect(0,0,that.canvasW,that.canvasH);
                if (that.history.length!=0){
                    that.cobj.putImageData(that.history[that.history.length-1],0,0)
                }
                var endx=e.offsetX;
                var endy=e.offsetY;
                // that[that.type](startx,starty,endx,endy)
            };
            that.copy.onmouseup=function(){
                that.history.push(that.cobj.getImageData(0,0,that.canvasW,that.canvasH));
                that.mapBuilder.pushAction(MapBuilderConstant.ACTION_ADD_OBJECT,that.curPathNode);
                that.copy.onmousemove=null;
                that.copy.onmouseup=null;
            }*/
    }
  },
  pen: function () {
    var that = this
    that.copy.onmousedown = function (e) {
      that.init()
      var startx = e.offsetX
      var starty = e.offsetY
      that.cobj.beginPath()
      that.cobj.moveTo(startx, starty)
      that.copy.onmousemove = function (e) {
        var endx = e.offsetX
        var endy = e.offsetY
        that.cobj.lineTo(endx, endy)
        that.cobj.stroke()
      }
      that.copy.onmouseup = function (e) {
        that.history.push(
          that.cobj.getImageData(0, 0, that.canvasW, that.canvasH)
        )
        that.copy.onmousemove = null
        that.copy.onmouseup = null
      }
    }
  },
  line: function (x, y, x1, y1) {
    this.cobj.beginPath()
    this.cobj.moveTo(x, y)
    console.log('x,y ' + x + ':' + y + ' x1,y1 ' + x1 + ':' + y1)
    this.cobj.lineTo(x1, y1)
    this.cobj.stroke()
  },
  arc: function (x, y, x1, y1) {
    this.cobj.beginPath()
    var r = Math.sqrt((x1 - x) * (x1 - x) + (y1 - y) * (y1 - y))
    this.cobj.arc(x, y, r, 0, 2 * Math.PI)
    this.cobj[this.style]()
  },
  rect: function (x, y, x1, y1) {
    this.cobj.beginPath()
    this.cobj.rect(x, y, x1 - x, y1 - y)
    this.cobj[this.style]()
  },
  bian: function (x, y, x1, y1) {
    var angle = ((360 / this.biannum) * Math.PI) / 180
    var r = Math.sqrt((x1 - x) * (x1 - x) + (y1 - y) * (y1 - y))
    this.cobj.beginPath()
    for (var i = 0; i < this.biannum; i++) {
      this.cobj.lineTo(x + r * Math.cos(angle * i), y + r * Math.sin(angle * i))
    }
    this.cobj.closePath()
    this.cobj[this.style]()
  },
  jiao: function (x, y, x1, y1) {
    var angle = ((360 / (this.jiaonum * 2)) * Math.PI) / 180
    var r = Math.sqrt((x1 - x) * (x1 - x) + (y1 - y) * (y1 - y))
    var r1 = r / 3
    this.cobj.beginPath()
    for (var i = 0; i < this.jiaonum * 2; i++) {
      if (i % 2 == 0) {
        this.cobj.lineTo(
          x + r * Math.cos(angle * i),
          y + r * Math.sin(angle * i)
        )
      } else {
        this.cobj.lineTo(
          x + r1 * Math.cos(angle * i),
          y + r1 * Math.sin(angle * i)
        )
      }
    }
    this.cobj.closePath()
    this.cobj[this.style]()
  },
  pathNityP: function (x, y, x1, y1) {
    /*this.cobj.beginPath();
        this.cobj.moveTo(x,y);
        if(y1 <= y) {
            this.cobj.quadraticCurveTo(x, y1,
                x1, y1);
        }

        //目标点在当前点下方
        if(y1 > y) {
            this.cobj.quadraticCurveTo(x1, y,
                x1, y1);
        }
        //this.cobj.closePath();
        this.cobj[this.style]();
        console.log('x,y '+x+":"+y+' x1,y1 '+x1+":"+y1);*/
    console.log('进入正九十度方法')
    this.mapBuilder.setTool(MapBuilderConstant.TOOL_ADD_PATHNODE)
    this.mapBuilder.setToolMode(MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90)
  },
  pathNityN: function (x, y, x1, y1) {
    this.cobj.beginPath()
    this.cobj.moveTo(x, y)
    //目标点在当前点上方
    if (y1 <= y) {
      this.cobj.quadraticCurveTo(x1, y, x1, y1)
    }
    //目标点在当前点下方
    if (y1 > y) {
      this.cobj.quadraticCurveTo(x, y1, x1, y1)
    }
    //this.cobj.closePath();
    this.cobj[this.style]()
  },
  clear: function () {
    var that = this
    that.copy.onmousemove = function (e) {
      var endx = e.offsetX
      var endy = e.offsetY
      var left = endx - that.xpsize / 2
      var top = endy - that.xpsize / 2
      if (left < 0) {
        left = 0
      }
      if (left > that.canvasW - that.xpsize) {
        left = that.canvasW - that.xpsize
      }
      if (top < 0) {
        top = 0
      }
      if (top > that.canvasH - that.xpsize) {
        top = that.canvasH - that.xpsize
      }
      that.xp.style.cssText =
        'display:block;left:' +
        left +
        'px;top:' +
        top +
        'px;width:' +
        that.xpsize +
        'px;height:' +
        that.xpsize +
        'px'
    }
    that.copy.onmousedown = function () {
      that.copy.onmousemove = function (e) {
        var endx = e.offsetX
        var endy = e.offsetY
        var left = endx - that.xpsize / 2
        var top = endy - that.xpsize / 2
        if (left < 0) {
          left = 0
        }
        if (left > that.canvasW - that.xpsize) {
          left = that.canvasW - that.xpsize
        }
        if (top < 0) {
          top = 0
        }
        if (top > that.canvasH - that.xpsize) {
          top = that.canvasH - that.xpsize
        }
        that.xp.style.cssText =
          'display:block;left:' +
          left +
          'px;top:' +
          top +
          'px;width:' +
          that.xpsize +
          'px;height:' +
          that.xpsize +
          'px'
        that.cobj.clearRect(left, top, that.xpsize, that.xpsize)
      }
      that.copy.onmouseup = function () {
        that.history.push(
          that.cobj.getImageData(0, 0, that.canvasW, that.canvasH)
        )
        that.copy.onmousemove = null
        that.copy.onmouseup = null
        that.clear()
      }
    }
  },
}

export default shape
