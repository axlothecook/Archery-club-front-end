// Shared UI state (Svelte 5 runes): the half-screen menu open/close + the active
// locale. Imported by the TopBar (opens the menu, switches locale) and the
// HalfScreenMenu (reads open state, closes on backdrop/link click).

import { DEFAULT_LOCALE, resolveLocale, type Locale } from './locale.ts';

function createUiState() {
	let menuOpen = $state(false);
	let locale = $state<Locale>(DEFAULT_LOCALE);

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
		setLocale(value: string) {
			locale = resolveLocale(value);
		}
	};
}

export const ui = createUiState();
