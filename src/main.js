import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueRouter from 'vue-router'
// eslint-disable-next-line no-unused-vars
import $ from 'jquery'
Vue.use(VueRouter)

Vue.config.productionTip = false

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app')
