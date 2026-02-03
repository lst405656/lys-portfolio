import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
	plugins: [vue()],
	base: "/lys-portfolio/",
	server: {
		proxy: {
			'/api/naver': {
				target: 'https://openapi.naver.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/naver/, '')
			}
		}
	}
})
