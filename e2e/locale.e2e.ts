import { test, expect } from '@playwright/test';
import { openMenu } from './helpers';

// Language switch — bilingual HR/EN is a core feature whose regressions no
// unit test can see end to end: the switcher writes the `locale` cookie and
// then FULL-RELOADS (ui.svelte.ts setLocale), and +layout.server.ts reads the
// cookie server-side so SSR paints the chosen language with no hr→en flash.
//
// This test proves the whole chain: pick English → automatic reload renders
// EN → an explicit second reload still renders EN (the cookie, not client
// state, carries the choice).
//
// Accessible names verified in src/lib/i18n.ts for BOTH locales:
//   opener  'nav.openMenu'  hr "Otvori meni"    / en "Open menu"
//   menu    'menu.main'     hr "Glavni izbornik" / en "Main menu"
//   link    'nav.schedule'  hr "Raspored"        / en "Schedule"
test('switching to English survives a reload via the locale cookie', async ({ page }) => {
	await page.goto('/');

	// Open the menu (hr is the default locale — no cookie yet). openMenu
	// tolerates the opener animating away mid-click.
	const menu = await openMenu(page);

	// Open the flag dropdown. Its toggle shows the ACTIVE short code ("HR");
	// the name is matched as a regex because icons sit next to the text. The
	// English OPTION cannot collide: its aria-label is "English"/"Hrvatski".
	// The dropdown sits at the BOTTOM of the menu panel — the config viewport
	// is tall enough (900px) that it is on-screen; the fly-in lasts 250ms.
	await menu.getByRole('button', { name: /HR/ }).click();
	// This click writes the cookie and synchronously location.reload()s —
	// noWaitAfter, or the post-click bookkeeping races the dying document.
	await menu.getByRole('button', { name: 'English' }).click({ noWaitAfter: true });

	// setLocale wrote the cookie and triggered location.reload() — the page
	// comes back server-rendered in English. The reload rebuilds the HOMEPAGE
	// (intro, hero assets), which can take well over 5s in a test browser —
	// give the navigation room before judging.
	await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible({
		timeout: 30_000
	});

	// Explicit second reload: persistence must come from the cookie alone.
	await page.reload();
	// "Schedule" (nav.schedule) lives in the BANNER, not the menu — the pill's
	// primary links translate too, and the banner is present without opening
	// anything. Opening the EN-named menu additionally proves the menu localised.
	await expect(page.getByRole('banner').getByRole('link', { name: 'Schedule' })).toBeVisible({
		timeout: 15_000
	});
	await openMenu(page); // resolves only if the "Main menu"-named panel opens
});
