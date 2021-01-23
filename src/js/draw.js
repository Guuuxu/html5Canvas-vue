import MapBuilder from './mapbuilder'
import shape from './shape'
import MapBuilderConstant from './mapbuilder-constant'
$(function () {
  //menu
  $('.menu li').click(function () {
    var index = $(this).index('.menu li')
    $('.option').css({ display: 'none' }).eq(index).css({ display: 'block' })
    $('.menu li').removeClass('active').css({ boxShadow: 'none' })
    $(this).css({ boxShadow: '0px 0.5px 10px #333 inset' })
    $(this).addClass('active')
  })
  $('.option li').click(function () {
    $('.option li').css('color', '#000').css('text-shadow', 'none')
    $(this).css('color', '#000').css('text-shadow', '0 0 3px #000')
  })
  //    画板功能
  var canvas = document.getElementsByTagName('canvas')[0]
  var copy = document.getElementsByClassName('copy')[0]
  var xp = $('.xp')[0]
  var cobj = canvas.getContext('2d')
  var mapBuilder = null
  mapBuilder = new MapBuilder()
  var MapBuilderM = mapBuilder
  //var obj=new shape(copy,cobj,xp,mapBuilder);
  var obj = new shape(mapBuilder)
  //铅笔
  $('.option:eq(1) li').on('click', function () {
    if ($(this).attr('data-role') == 'pen') {
      obj.pen()
    } else if ($(this).attr('data-role') == '3') {
      MapBuilderM.setTool(MapBuilderConstant.TOOL_SELECT)
      MapBuilderM.setToolMode(MapBuilderConstant.TOOL_SELECT_MODE_DEFAULT)
    } else {
      obj.type = $(this).attr('data-role')
      switch (parseInt(obj.type)) {
        case MapBuilderConstant.TOOL_ADD_PATHNODE_LINE:
          MapBuilderM.setTool(MapBuilderConstant.TOOL_ADD_PATHNODE)
          MapBuilderM.setToolMode(MapBuilderConstant.TOOL_ADD_PATHNODE_LINE)
          break
        case MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90:
          MapBuilderM.setTool(MapBuilderConstant.TOOL_ADD_PATHNODE)
          MapBuilderM.setToolMode(MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90)
          break
        case MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90MINUS:
          MapBuilderM.setTool(MapBuilderConstant.TOOL_ADD_PATHNODE)
          MapBuilderM.setToolMode(
            MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90MINUS
          )
          break
      }
      /*
          if ($(this).attr("data-role")=="bian"){
              obj.biannum=prompt("请输入边数",5)
          }
          if ($(this).attr("data-role")=="jiao"){
              obj.jiaonum=prompt("请输入角",5)
          }*/

      obj.draw()
    }
  })
  //操作
  $('.option:eq(2) li').on('click', function () {
    if ($(this).attr('data-role') == 'save') {
    } else if ($(this).attr('data-role') == 'delete') {
      MapBuilderM.remove()
    } else if ($(this).attr('data-role') == 'revoke') {
      MapBuilderM.revoke()
    } else if ($(this).attr('data-role') == 'align_left') {
      MapBuilderM.alignLeft()
    } else if ($(this).attr('data-role') == 'align_right') {
      MapBuilderM.alignRight()
    } else if ($(this).attr('data-role') == 'align_top') {
      MapBuilderM.alignTop()
    } else if ($(this).attr('data-role') == 'align_bottom') {
      MapBuilderM.alignBottom()
    }
  })
  //橡皮擦
  $('.menu li:last').on('click', function () {
    obj.clear()
  })
  $('.option:last input').change(function () {
    obj.xpsize = $(this).val()
  })
  //颜色
  $('.option:eq(2) input').change(function () {
    obj[$(this).attr('data-role')] = $(this).val()
  })
  //实心还是空心
  $('.option:eq(3) li').click(function () {
    obj.style = $(this).attr('data-role')
    obj.draw()
  })
  //线条粗细
  $('.option:eq(4) li:not(.input)').click(function () {
    obj.lineWidth = $(this).attr('data-role')
    obj.draw()
  })
  $('.input input').change(function () {
    obj.lineWidth = $(this).val()
    obj.draw()
  })
  //    返回
  $('.back').on('click', function () {
    if (obj.history.length == 0) {
      cobj.clearRect(0, 0, canvas.width, canvas.height)
      setTimeout(function () {
        alert('请勿操作！')
      }, 10)
    }
    if (obj.isback) {
      if (obj.history.length == 1) {
        obj.history.pop()
        cobj.clearRect(0, 0, canvas.width, canvas.height)
      } else {
        obj.history.pop()
        cobj.putImageData(obj.history.pop(), 0, 0)
      }
    } else {
      cobj.putImageData(obj.history.pop(), 0, 0)
    }
    obj.isback = false
  })
  //保存
  $('.save').on('click', function () {
    if (obj.history.length > 0) {
      location.href = canvas.toDataURL().replace('image/png', 'stream/octet')
    }
  })

  //新建
  $('.new').on('click', function () {
    if (obj.history.length > 0) {
      var yes = confirm('温馨提示：是否保存！')
      if (yes) {
        location.href = canvas.toDataURL().replace('image/png', 'stream/octet')
      }
      obj.history = []
      obj.clearRect(0, 0, canvas.width, canvas.height)
    }
  })
})
