import { expect, type Page } from '@playwright/test';

// Shared e2e helpers. This file is NOT matched by testMatch (*.e2e.*), so it
// holds no tests — only the interaction patterns this app's heavy intro and
// animations demand. Diagnosed empirically (see the debug notes in the PR):
//
//   1. On the HOMEPAGE the NavBar pill starts OFF-SCREEN (y < 0) and only
//      descends when the intro reveals — ~13s in a test browser, because the
//      PageLoader waits on the R2 hero images first. Any click aimed at the
//      pill before the descent fails with "element is outside of the viewport".
//   2. Clicks that land BEFORE hydration finishes fall back to native browser
//      behaviour: a pre-hydration submit reloads the page natively (wiping
//      state, sending no fetch), a pre-hydration link click does a full
//      navigation whose loads run SERVER-side, where page.route() cannot
//      intercept. The cure is to retry the OUTCOME, not the click.

// Wait for the homepage intro to release the NavBar pill (the menu opener
// descends into view). Call after every goto('/').
export async function awaitPill(page: Page) {
	await expect(page.getByRole('button', { name: /Otvori meni|Open menu/ })).toBeInViewport({
		timeout: 45_000
	});
}

// Click a link and insist the URL actually changed — re-clicking if the first
// click was swallowed. `scope` narrows where the link is looked up (banner, menu).
export async function clickLinkUntilURL(
	page: Page,
	scope: ReturnType<Page['getByRole']>,
	linkName: string,
	url: RegExp
) {
	await expect(async () => {
		await scope.getByRole('link', { name: linkName }).click({ timeout: 3000 });
		// The page-transition wipe takes ~1.5s before the swap settles.
		await expect(page).toHaveURL(url, { timeout: 4000 });
	}).toPass({ timeout: 30_000 });
}

// Open the half-screen menu. Waits out the intro first, then tolerates the
// opener animating away mid-click (force + outcome retry). Idempotent: if the
// menu is already open, it does not click again.
export async function openMenu(page: Page) {
	await awaitPill(page);
	const menu = page.getByRole('navigation', { name: /Glavni izbornik|Main menu/ });
	await expect(async () => {
		// The closed panel parks OFF-SCREEN LEFT (x < 0) — which still counts as
		// "visible" to Playwright. Only in-viewport proves it actually slid open.
		if (!(await menu.boundingBox().then((b) => b !== null && b.x >= 0).catch(() => false))) {
			await page
				.getByRole('button', { name: /Otvori meni|Open menu/ })
				.click({ force: true, timeout: 2000 });
		}
		await expect(menu).toBeInViewport({ ratio: 0.5, timeout: 2000 });
	}).toPass({ timeout: 20_000 });
	return menu;
}
