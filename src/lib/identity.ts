import type { ClubIdentitySectionResolved } from 'archery-contracts';

// Identity tabs use Croatian URL slugs; the backend sections use English slugs.
// This is the single source mapping the two, plus the tab order/labels.
// Vrijednosti is the default — its URL is the base /klub/identitet (no slug).

export type IdentityTab = {
	label: string; // tab label (Croatian source / hr fallback)
	key: string; // i18n key (see $lib/i18n) for the localized label
	urlSlug: string | null; // null = base /klub/identitet (Vrijednosti)
	apiSlug: string; // backend section slug
};

export const IDENTITY_TABS: IdentityTab[] = [
	{ label: 'Vrijednosti', key: 'nav.values', urlSlug: null, apiSlug: 'values' },
	{ label: 'Dres', key: 'nav.jersey', urlSlug: 'dres', apiSlug: 'jersey' },
	{ label: 'Grb', key: 'nav.crest', urlSlug: 'grb', apiSlug: 'crest' }
];

// Map a Croatian URL slug → backend section slug (for the [slug] loader).
export function apiSlugFor(urlSlug: string): string | null {
	return IDENTITY_TABS.find((t) => t.urlSlug === urlSlug)?.apiSlug ?? null;
}

// Build the href for a tab.
export function identityHref(tab: IdentityTab): string {
	return tab.urlSlug ? `/klub/identitet/${tab.urlSlug}` : '/klub/identitet';
}

// Find a loaded section by its backend slug.
export function sectionByApiSlug(
	sections: ClubIdentitySectionResolved[],
	apiSlug: string
): ClubIdentitySectionResolved | undefined {
	return sections.find((s) => s.slug === apiSlug);
}
