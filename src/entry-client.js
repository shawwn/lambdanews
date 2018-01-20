//import Vue from 'vue'
import Vue from 'vue/dist/vue.esm.js';
import Vue2 from 'vue';
import 'es6-promise/auto'
import { createApp } from './app'
import ProgressBar from './components/ProgressBar.vue'

// global progress bar
const bar = Vue2.prototype.$bar = new Vue2(ProgressBar).$mount();
const hnbar = document.getElementById('hnbar');
while (hnbar.firstChild) {
  hnbar.removeChild(hnbar.firstChild);
}
hnbar.appendChild(bar.$el);
//document.body.appendChild(bar.$el)

// a global mixin that calls `asyncData` when a route component's params change
Vue.mixin({
  beforeRouteUpdate (to, from, next) {
    console.log('beforeRouteUpdate');
    const { asyncData } = this.$options
    if (asyncData) {
      asyncData({
        store: this.$store,
        route: to
      }).then(next).catch(next)
    } else {
      next()
    }
  }
})
//
// new Vue({
//   el: '#app'
// });

const { app, router, store } = createApp()

// prime the store with server-initialized state.
// the state is determined during SSR and inlined in the page markup.
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

// wait until router has resolved all async before hooks
// and async components...
router.onReady(() => {
  // Add router hook for handling asyncData.
  // Doing it after initial route is resolved so that we don't double-fetch
  // the data that we already have. Using router.beforeResolve() so that all
  // async components are resolved.
  router.beforeResolve((to, from, next) => {
    const matched = router.getMatchedComponents(to)
    const prevMatched = router.getMatchedComponents(from)
    let diffed = false
    const activated = matched.filter((c, i) => {
      return diffed || (diffed = (prevMatched[i] !== c))
    })
    const asyncDataHooks = activated.map(c => c.asyncData).filter(_ => _)
    if (!asyncDataHooks.length) {
      return next()
    }

    bar.start()
    Promise.all(asyncDataHooks.map(hook => hook({ store, route: to })))
      .then(() => {
        bar.finish()
        next()
      })
      .catch(next)
  })

  // actually mount to DOM
  app.$mount('#hnmain')
})

// // service worker
// if ('https:' === location.protocol && navigator.serviceWorker) {
//   navigator.serviceWorker.register('../build/service-worker.js', { scope: './' })
// }
