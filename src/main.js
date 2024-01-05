import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { Buffer } from "buffer";
import process from 'process'

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
  window.process = process
  // console.log(window.Buffer, window.process, 'and');
}
// import {i18n} from './locales/i18n.js'
// createApp(App).use(i18n).mount('#app') // 注入国际化函数$t

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')