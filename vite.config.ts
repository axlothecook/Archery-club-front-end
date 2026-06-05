import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
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
