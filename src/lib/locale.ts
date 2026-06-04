// Locale plumbing for the front-end.
//
// The backend resolves text per `?locale=` (Pattern-B i18n), falling back to the
// source locale (hr). The site's source/default locale is hr; other locales are
// filled later via the translate pipeline. For now we default everything to hr;
// a locale switcher can set the active locale and pass it into apiFetch.

export const DEFAULT_LOCALE = 'hr' as const;

// Locales the site intends to support (matches the backend i18n design). Only hr
// is fully populated today; the rest resolve via fallback until translated.
export const SUPPORTED_LOCALES = ['hr', 'en', 'de', 'it', 'sl', 'fr', 'es', 'hu'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

// Narrow an arbitrary string (e.g. from a URL param) to a supported Locale,
// falling back to the default when unrecognised.
export function resolveLocale(value: string | null | undefined): Locale {
	if (value && (SUPPORTED_LOCALES as readonly string[]).includes(value)) {
		return value as Locale;
	}
	return DEFAULT_LOCALE;
}
