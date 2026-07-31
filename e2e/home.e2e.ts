import { test, expect } from '@playwright/test';

// Homepage smoke test — the "deploy succeeded but the page is blank" detector.
//
// Asserts the page shell (navbar, hero wordmark, footer) renders and that NO
// uncaught JS error fires during load. A hydration crash or a broken import
// shows up here long before any user report would.
//
// Runs without a backend: the homepage loader is fail-soft by design (each
// section renders empty if its endpoint is down), so the shell must appear
// even with the API unreachable.
test('homepage renders its shell without page errors', async ({ page }) => {
	const pageErrors: Error[] = [];
	page.on('pageerror', (err) => pageErrors.push(err));

	await page.goto('/');

	// NavBar (the fixed header pill).
	await expect(page.getByRole('banner')).toBeVisible();

	// Hero wordmark <h1> — its aria-label is hardcoded in +page.svelte and does
	// not change with the locale, so it is the one stable, user-facing anchor.
	await expect(
		page.getByRole('heading', { level: 1, name: 'Varaždinski streličarski klub' })
	).toBeAttached();

	// Footer.
	await expect(page.getByRole('contentinfo')).toBeAttached();

	// No uncaught errors anywhere during load/hydration.
	expect(pageErrors).toEqual([]);
});
