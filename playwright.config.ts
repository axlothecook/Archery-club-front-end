import { defineConfig } from '@playwright/test';

export default defineConfig({
	// The homepage intro alone can take ~13s in a test browser (R2 hero
	// images gate the reveal) — give outcome-retries room to converge.
	timeout: 90_000,
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		// The production build takes longer than the 60s default before preview
		// starts answering — give the build+boot room to finish.
		timeout: 180_000,
		// Locally, reuse a preview server that is already running (start one with
		// `npm run build && npm run preview` to skip the rebuild on every test run
		// — but it MUST be started with the same PUBLIC_API_BASE_URL as below).
		// In CI there is no pre-existing server, so a fresh one is always started.
		reuseExistingServer: !process.env.CI,
		// Pin the API origin the served pages will call. Without this, a stray
		// .env.local (e.g. the LAN address from phone-testing sessions) redirects
		// every client fetch to an unreachable host and no route ever matches.
		// Process env beats .env files, so this wins deterministically.
		env: { PUBLIC_API_BASE_URL: 'http://localhost:3100' }
	},
	testMatch: '**/*.e2e.{ts,js}',
	use: {
		// Taller than the 1280x720 default: the half-screen menu's locale
		// switcher sits at the bottom of a non-scrollable panel and must be
		// on-screen to be clickable. Phone tests set 390x844 explicitly.
		viewport: { width: 1280, height: 900 }
	}
});
