import { test, expect } from '@playwright/test';

// The membership inquiry form — the ONLY public write path on the site. If it
// breaks silently, the club loses real membership inquiries, which makes it
// the highest-stakes user action anywhere on the public site.
//
// The form POSTs browser-side to `${API_BASE}/inquiries/membership` with a
// honeypot field (_hp) and a required GDPR consent checkbox; success flips a
// status flag that renders the "Hvala vam!" confirmation (kontakt/+page.svelte).
// All labels below are hr source-locale values read from src/lib/i18n.ts.

// Route by PATH, not origin: the app's API base comes from PUBLIC_API_BASE_URL
// (a stray .env.local can point it anywhere), and the tests must not care.
const CORS = {
	'access-control-allow-origin': '*',
	// The submit is a cross-origin JSON POST — the browser preflights it, and
	// the preflight must see methods+headers or the real POST never happens.
	'access-control-allow-methods': 'POST, OPTIONS',
	'access-control-allow-headers': 'content-type'
};

test('membership inquiry submits and shows the confirmation', async ({ page }) => {
	let posted: Record<string, unknown> | null = null;
	await page.route('**/inquiries/membership', (route) => {
		posted = route.request().postDataJSON();
		route.fulfill({ status: 201, json: { ok: true }, headers: CORS });
	});

	// Outcome-retry WITHOUT re-goto: a pre-hydration submit falls back to a
	// NATIVE form post (URL gains a bare "?"), which itself reloads the page —
	// so the retry waits for hydration on THAT reloaded (warm) document and
	// refills. Re-goto-ing here would reset the hydration clock and lose the
	// same race forever. The __svelte gate alone is not enough: the global
	// appears when the runtime loads, slightly BEFORE the page component has
	// mounted its submit handler.
	await page.goto('/kontakt');
	await expect(async () => {
		await page.waitForFunction(() => '__svelte' in window, undefined, { timeout: 20_000 });
		await page.waitForTimeout(250);
		await page.getByLabel(/Ime i prezime/).fill('E2E Testko Testić');
		await page.getByLabel(/^Email/).first().fill('e2e@example.com');
		await page.getByLabel(/Slažem se da klub pohrani/).check();
		await page.getByRole('button', { name: 'Pošalji upit' }).click();
		await expect(page.getByRole('heading', { name: 'Hvala vam!' })).toBeVisible({
			timeout: 4000
		});
	}).toPass({ timeout: 60_000 });

	// …and the request the backend would have received is well-formed:
	// the user's values present, the honeypot untouched (empty).
	expect(posted).not.toBeNull();
	expect(posted!['fullName']).toBe('E2E Testko Testić');
	expect(posted!['email']).toBe('e2e@example.com');
	expect(posted!['consentAccepted']).toBe(true);
	expect(posted!['_hp']).toBe('');
});

test('an empty submit is blocked client-side and sends nothing', async ({ page }) => {
	let requests = 0;
	await page.route('**/inquiries/**', (route) => {
		requests += 1;
		route.abort();
	});

	await page.goto('/kontakt');
	await page.getByRole('button', { name: 'Pošalji upit' }).click();

	// Native validation stops the submit: the required name field reports
	// invalid, no confirmation appears, and no request ever leaves the page.
	await expect(page.getByLabel(/Ime i prezime/)).toHaveJSProperty('validity.valid', false);
	await expect(page.getByRole('heading', { name: 'Hvala vam!' })).toHaveCount(0);
	expect(requests).toBe(0);
});
