<template>
  <div class="box">
    <button class="btn">首页</button>
    <ul class="menu">
      <li class="active">文件</li>
      <li>画图</li>
      <li>操作</li>
      <!--<li>颜色</li>
        <li>类型</li>
        <li>线条宽度</li>
        <li>橡皮擦</li>-->
    </ul>
    <div class="body">
      <div class="tool">
        <ul class="option op-active">
          <li class="new">新建</li>
          <li class="save">保存</li>
          <li class="back">返回</li>
        </ul>
        <ul class="option">
          <li data-role="0">直线</li>
          <!--<li data-role="pen">铅笔</li>
                <li data-role="arc">圆</li>
                <li data-role="rect">矩形</li>
                <li data-role="jiao">多角形</li>
                <li data-role="bian">多边形</li>-->
          <li data-role="1">90度圆弧</li>
          <li data-role="2">-90度圆弧</li>
          <li data-role="3">指针工具</li>
        </ul>
        <ul class="option">
          <li data-role="save">保存</li>
          <li data-role="revoke">撤销</li>
          <li data-role="delete">删除</li>
          <li data-role="align_left">左对齐</li>
          <li data-role="align_right">右对齐</li>
          <li data-role="align_top">上对齐</li>
          <li data-role="align_bottom">下对齐</li>
        </ul>
      </div>
      <div class="canvas">
        <canvas width="1000" height="600"
          >您的电脑不支持canvas.请升级浏览器或使用谷歌浏览器！</canvas
        >
        <!--<div class="copy"></div>
            <div class="xp"></div>-->
      </div>
    </div>
  </div>
</template>

<script>
import '../js/draw'
export default {
  mounted() {
    $('.btn').click(function() {
      console.log('click')
    })
  },
}
</script>

<style lang="scss">
@import url('../css/canvas.css');
@import url('../css/mapbuilder.css');
// @import url('../css/collect.css');
</style>
