// Shared UI state (Svelte 5 runes): the half-screen menu open/close + the active
// locale. Imported by the NavBar/menu (opens the menu, switches locale) and the
// HalfScreenMenu (reads open state, closes on backdrop/link click).

import { resolveLocale, readLocaleCookieClient, LOCALE_COOKIE, type Locale } from './locale.ts';

function createUiState() {
	let menuOpen = $state(false);
	// Seed from the cookie so the picker shows the right active flag on first paint.
	let locale = $state<Locale>(readLocaleCookieClient());

	return {
		get menuOpen() {
			return menuOpen;
		},
		get locale() {
			return locale;
		},
		openMenu() {
			menuOpen = true;
		},
		closeMenu() {
			menuOpen = false;
		},
		toggleMenu() {
			menuOpen = !menuOpen;
		},
		// Switch the site language: persist to the cookie (read server-side by
		// +layout.server.ts for SSR + client-side for "load more"), then re-run every
		// load so all content re-fetches in the new language. No full page reload.
		setLocale(value: string) {
			const next = resolveLocale(value);
			if (next === locale) return;
			locale = next;
			if (typeof document !== 'undefined') {
				document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
				// Full reload so the server re-renders the WHOLE page in the new language. We
				// reload (rather than invalidate) because some pages build client-side state
				// from their initial load data (e.g. the news grid's "load more" items) that
				// doesn't reactively rebuild on re-fetch — a reload guarantees every page swaps
				// cleanly. Language switching is a rare, deliberate action, so a reload is fine.
				location.reload();
			}
		}
	};
}

export const ui = createUiState();
