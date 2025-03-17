import { createApp } from 'vue';
import App from './App.vue';
import './style/index.css';
import router from './router/router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css'
import axios from 'axios'

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.provide('axios', axios)

router.isReady().then(() => {
    app.mount('#app');
});