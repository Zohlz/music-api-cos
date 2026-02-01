import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from '~/router'
import 'ant-design-vue/dist/reset.css'
import '~/assets/styles/reset.css'
import 'uno.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')
