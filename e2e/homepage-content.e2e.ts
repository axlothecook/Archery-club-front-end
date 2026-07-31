import { test, expect } from '@playwright/test';

// Homepage content + the fail-soft contract.
//
// The homepage loader (+page.ts) requests /articles, /events and
// /achievements/summary and is deliberately fail-soft: every call has a
// .catch() so a dead endpoint hides its section instead of crashing the page.
// That contract is designed, documented in the loader comments — and until
// now untested. These tests pin BOTH branches.
//
// Interception subtlety: +page.ts is a universal load, so on a direct
// page.goto('/') it runs SERVER-side (SSR) where page.route() cannot see it.
// Both tests therefore start on /kontakt (a static page with no +page.ts) and
// enter the homepage by clicking the logo ("Naslovnica") — a client-side
// navigation whose fetches run in the browser, where routes apply. This also
// makes the tests hermetic: they pass or fail the same way whether or not a
// real backend happens to be running on :3100.

// Routes match by PATH, not origin — the app's API base is env-dependent
// (PUBLIC_API_BASE_URL / .env.local) and the tests must not care where it points.

// 1x1 transparent PNG — no dependency on real/remote images.
const PIXEL =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// 8 cards = the coverflow's designed slide count (front + receding sides).
const FIXTURE_ITEMS = Array.from({ length: 8 }, (_, i) => ({
	slug: `e2e-probni-clanak-${i + 1}`,
	mediaType: 'gallery' as const,
	posterImage: { url: PIXEL, alt: `Probna naslovnica ${i + 1}` },
	publishedAt: '2026-07-01T12:00:00.000Z',
	locale: 'hr' as const,
	title: `E2E probni članak ${i + 1}`,
	excerpt: 'Probni sažetak za e2e test.'
}));

const CORS = { 'access-control-allow-origin': '*' };

test('news section renders articles served by the API', async ({ page }) => {
	await page.route('**/articles*', (route) =>
		route.fulfill({ json: { items: FIXTURE_ITEMS, nextCursor: null }, headers: CORS })
	);
	await page.route('**/events*', (route) => route.fulfill({ json: [], headers: CORS }));
	await page.route('**/achievements/summary*', (route) =>
		route.fulfill({ json: { stats: {}, statImages: {} }, headers: CORS })
	);

	// Outcome-retry: a pre-hydration logo click does a FULL navigation whose
	// loads run server-side (routes can't intercept there) — retry until the
	// click lands post-hydration and the client-side load hits the fixture.
	await expect(async () => {
		await page.goto('/kontakt');
		await page.getByRole('link', { name: 'Naslovnica' }).click();
		await expect(page.getByRole('heading', { level: 2, name: 'Vijesti' })).toBeVisible({
			timeout: 6000
		});
	}).toPass({ timeout: 45_000 });
	// …and the coverflow's front card shows the first fixture article.
	await expect(page.getByRole('heading', { level: 3, name: 'E2E probni članak 1' })).toBeVisible();
	await expect(page.getByRole('link', { name: /Sve vijesti/ })).toBeVisible();
});

test('a dead API hides the news section instead of crashing (fail-soft)', async ({ page }) => {
	const pageErrors: Error[] = [];
	page.on('pageerror', (err) => pageErrors.push(err));

	// Kill every backend call at the network layer — by path, wherever the
	// app's API base points. Page assets (same-origin :4173) are untouched.
	await page.route(/\/(articles|events|event-levels|achievements|archers|sponsors|inquiries)/, (route) =>
		route.abort()
	);

	await expect(async () => {
		await page.goto('/kontakt');
		await page.getByRole('link', { name: 'Naslovnica' }).click();
		await expect(page).toHaveURL(/\/$|\/\?/, { timeout: 6000 });
	}).toPass({ timeout: 45_000 });

	// The shell is fine — and the news section simply is not there.
	await expect(page.getByRole('banner')).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: 'Vijesti' })).toHaveCount(0);
	expect(pageErrors).toEqual([]);
});
