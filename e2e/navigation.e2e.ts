import { test, expect } from '@playwright/test';
import { awaitPill, clickLinkUntilURL, openMenu } from './helpers';

// Navigation spine — if it regresses, the section pages are unreachable no
// matter how good they are. Historically the NavBar (scroll-merge, GSAP Flip,
// phone measurement) has been the most gotcha-prone component in the project.
//
// The site deliberately has TWO navigation paths (src/lib/nav.ts):
//   - TOP_BAR_LINKS  (Momčad / Vijesti / Raspored) — direct links in the pill,
//     rendered on BOTH breakpoints;
//   - the half-screen menu — everything else (Postignuća, Sponzori, the klub
//     subtree) plus Kontakt as the middle link.
//
// Click patterns come from ./helpers — see the comments there for why plain
// .click() is not reliable against this app's animations.

test('banner links and menu links reach their section pages (desktop)', async ({ page }) => {
	// Primary link, straight from the pill.
	await page.goto('/');
	await awaitPill(page);
	await clickLinkUntilURL(page, page.getByRole('banner'), 'Raspored', /\/raspored\/?$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Raspored/);

	// Menu-only pages.
	await page.goto('/');
	let menu = await openMenu(page);
	await clickLinkUntilURL(page, menu, 'Postignuća', /\/postignuca\/?$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Postignuća/);

	await page.goto('/');
	menu = await openMenu(page);
	await clickLinkUntilURL(page, menu, 'Kontakt', /\/kontakt\/?$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Kontakt/);
});

test('both navigation paths work at the phone breakpoint (390x844)', async ({ page }) => {
	// 390x844 is the project's own phone-verification viewport; the site-wide
	// phone breakpoint is ≤720px, so this exercises the phone NavBar for real.
	await page.setViewportSize({ width: 390, height: 844 });

	// The pill keeps its primary links on phone (only the section links don't merge).
	await page.goto('/');
	await awaitPill(page);
	await clickLinkUntilURL(page, page.getByRole('banner'), 'Raspored', /\/raspored\/?$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Raspored/);

	// And the menu path.
	await page.goto('/');
	const menu = await openMenu(page);
	await clickLinkUntilURL(page, menu, 'Kontakt', /\/kontakt\/?$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText(/Kontakt/);
});
