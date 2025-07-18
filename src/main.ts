import 'virtual:uno.css'
import './assets/theme.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initTheme } from './utils/theme'
import { initializeFontOptimization } from './utils/fontOptimization'

// Initialise le système de thème avant le montage de l'app
initTheme()

// Initialize font optimization for better performance
initializeFontOptimization()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')