const webpack = require('webpack')
const path = require('path')

function resolve(dir) {
  return path.join(__dirname, dir)
}
const name = '爱的魔力'
module.exports = {
  publicPath: './',
  chainWebpack: (config) => {
    config.plugin('provide').use(webpack.ProvidePlugin, [
      {
        $: 'jquery',
        jquery: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        MapBuilder: 'mapbuilder',
      },
    ])
  },
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "./src/style/style.scss";`,
        // sass 版本 9 中使用 additionalData 版本 8 中使用 prependData
      },
    },
  },
  configureWebpack: {
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    name: name,
    resolve: {
      alias: {
        '@': resolve('src'),
        '@assets': resolve('src/assets'),
        mapbuilder: resolve('static/mapbuilder.js'),
      },
    },
  },
}
