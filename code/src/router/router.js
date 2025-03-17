import { createRouter, createWebHistory } from 'vue-router';
import MapPage from '../containers/MapPage.vue';

const routes = [
  {
    path: '/',
    component: MapPage
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;