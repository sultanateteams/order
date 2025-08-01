import { createApp } from 'vue'
import App from './App.vue'

import 'bootstrap/dist/css/bootstrap.min.css' // Bootstrap 5 CSS
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css' // BootstrapVue 3 CSS

import BootstrapVue3 from 'bootstrap-vue-3'

const app = createApp(App)
app.use(BootstrapVue3)
app.mount('#app')
