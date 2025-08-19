import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'jsdom',
		setupFiles: ['./vitest-setup-client.ts'],
		// Only pick up unit tests from src, avoid e2e directory entirely
		include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
		passWithNoTests: true,
		exclude: [
			'**/e2e/**',
			'e2e/**',
			'playwright-report/**',
			'test-results/**',
			'node_modules/**',
			'dist/**',
			'.svelte-kit/**'
		]
	}
});
