import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import Portfolio from './views/Portfolio.vue';

const routes = [
    { path: '/', name:"Home", component: Home },
    { path: '/portfolio', name:"portfolio", component: Portfolio }
];

const router = createRouter({
    history: createWebHistory("/lys-portfolio/"),
    routes
});

export default router;