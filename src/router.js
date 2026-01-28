import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Portfolio from './views/Portfolio.vue';
import MapView from './views/MapView.vue';

const routes = [
    { path: '/', name: "Home", component: Home },
    { path: '/portfolio', name: "portfolio", component: Portfolio },
    { path: '/map', name: "map", component: MapView }
];

const router = createRouter({
    history: createWebHistory("/lys-portfolio/"),
    routes
});

export default router;