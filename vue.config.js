const webpack = require('webpack')

module.exports = {
  chainWebpack: (config) => {
    config.plugin('provide').use(webpack.ProvidePlugin, [
      {
        $: 'jquery',
        jquery: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
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
}
