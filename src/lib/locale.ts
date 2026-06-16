// Locale plumbing for the front-end.
//
// The backend resolves text per `?locale=` (Pattern-B i18n), falling back to the
// source locale (hr). The site's source/default locale is hr; other locales are
// filled later via the translate pipeline. For now we default everything to hr;
// a locale switcher can set the active locale and pass it into apiFetch.

export const DEFAULT_LOCALE = 'hr' as const;

// Locales the SITE offers in the switcher: Croatian (source) + English (translated
// via the backend pipeline). The backend can resolve more, but the public UI ships
// hr + en (decided 2026-06-16).
export const SUPPORTED_LOCALES = ['hr', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

// Human label per locale for the switcher UI.
export const LOCALE_LABEL: Record<Locale, string> = { hr: 'HR', en: 'EN' };

// BCP-47 tag per locale, for Intl.DateTimeFormat / number formatting so dates,
// month names and weekday headers render in the active language. en uses en-GB
// (day-month-year order, matching the Croatian day-first convention).
export const LOCALE_BCP47: Record<Locale, string> = { hr: 'hr-HR', en: 'en-GB' };

export function localeTag(locale: Locale | string | undefined): string {
	return LOCALE_BCP47[resolveLocale(locale)];
}

// The cookie the active locale is stored in (readable on the server for SSR loads
// AND on the client). Set by the switcher; read by the root layout load.
export const LOCALE_COOKIE = 'locale';

// Narrow an arbitrary string (e.g. from a cookie/URL) to a supported Locale,
// falling back to the default when unrecognised.
export function resolveLocale(value: string | null | undefined): Locale {
	if (value && (SUPPORTED_LOCALES as readonly string[]).includes(value)) {
		return value as Locale;
	}
	return DEFAULT_LOCALE;
}

// Read the active locale on the CLIENT (from document.cookie). SSR/server code
// should read the cookie via the request instead (see +layout.ts). Falls back to hr.
export function readLocaleCookieClient(): Locale {
	if (typeof document === 'undefined') return DEFAULT_LOCALE;
	const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
	return resolveLocale(m?.[1]);
}
