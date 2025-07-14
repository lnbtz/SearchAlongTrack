import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, type PluginOption } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), visualizer({open: true, filename: 'stats.html', gzipSize: true}) as PluginOption],
});
