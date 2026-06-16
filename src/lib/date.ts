// Long-form date formatting for article/news timestamps.
//
// The backend sends ISO strings (publishedAt). Dates render in the ACTIVE locale's
// long form via Intl ("24. svibnja 2026." in hr, "24 May 2026" in en) — no extra
// dependency. localeTag maps the app locale to a BCP-47 tag.

import { localeTag, type Locale } from '$lib/locale';

const HR_DATE = new Intl.DateTimeFormat('hr-HR', {
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

// "24. svibnja 2026." — long Croatian date. Returns '' for null/invalid input.
// Kept for hr-only call sites (and the unit test). Prefer formatDate(iso, locale).
export function formatDateHr(iso: string | null | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return HR_DATE.format(d);
}

// Long date in the given app locale. Returns '' for null/invalid input.
export function formatDate(iso: string | null | undefined, locale: Locale | string | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return new Intl.DateTimeFormat(localeTag(locale), {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(d);
}
