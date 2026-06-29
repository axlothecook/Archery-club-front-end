import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Dev-only same-origin API proxy. The browser talks to /api on the Vite origin
	// (localhost:5173 on PC, 192.168.50.112:5173 on a phone), and Vite forwards to
	// the backend on :3100 with the /api prefix stripped. This keeps the session
	// cookie FIRST-PARTY on whatever host serves the page (mirrors the prod nginx
	// /api topology), fixing the cross-host cookie drop that broke /prijava login.
	server: {
		host: true, // bind 0.0.0.0 so a phone on the same Wi-Fi can reach the dev server
		proxy: {
			'/api': {
				target: 'http://localhost:3100',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '')
			}
		}
	},
	// rolldown-vite (Vite 8) defaults to the lightningcss CSS transformer/minifier,
	// which rejects the bleeding-edge customizable-<select> selectors used by the
	// sass-library's _select.scss (::picker(select):popover-open,
	// appearance: base-select). Use the postcss transformer AND turn off CSS
	// minify (the SSR build otherwise hardcodes lightningcss minify) so those
	// valid modern selectors pass through untouched. Revisit for production polish.
	css: { transformer: 'postcss' },
	build: { cssMinify: false },
	environments: {
		ssr: { build: { cssMinify: false } },
		client: { build: { cssMinify: false } }
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
