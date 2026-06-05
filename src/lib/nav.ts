// Navigation structure — single editable source for the site's links.
//
// The top bar carries the always-present primary items; the half-screen menu
// carries "everything else". Labels are Croatian (hr is the source locale).
// Edit here to add/rename/reorder nav items.

export type NavLink = {
	label: string; // Croatian label
	href: string;
};

// Top bar primary links (besides the menu button, the centred logo, and the
// locale switcher, which the TopBar component renders directly).
export const TOP_BAR_LINKS = {
	left: [{ label: 'Najnovije', href: '/najnovije' }] satisfies NavLink[],
	right: [
		{ label: 'Momčad', href: '/momcad' },
		{ label: 'Raspored', href: '/raspored' }
	] satisfies NavLink[]
};

// The half-screen menu — "everything else", grouped. Each group has an optional
// heading and a list of links.
export const MENU_GROUPS: { heading?: string; links: NavLink[] }[] = [
	{
		heading: 'Klub',
		links: [
			{ label: 'Povijest', href: '/klub/povijest' },
			{ label: 'Identitet', href: '/klub/identitet' }
		]
	},
	{
		heading: 'Natjecanja',
		links: [
			{ label: 'Postignuća', href: '/postignuca' },
			{ label: 'Raspored', href: '/raspored' }
		]
	},
	{
		heading: 'Više',
		links: [
			{ label: 'Sponzori', href: '/sponzori' },
			{ label: 'Kontakt', href: '/kontakt' }
		]
	}
];

// Locale switcher — flags only (per design). hr is fully populated; others fall
// back to hr until translated, but we still show the chosen set of flags.
export const LOCALE_FLAGS: { locale: string; flag: string; label: string }[] = [
	{ locale: 'hr', flag: '🇭🇷', label: 'Hrvatski' },
	{ locale: 'en', flag: '🇬🇧', label: 'English' },
	{ locale: 'de', flag: '🇩🇪', label: 'Deutsch' },
	{ locale: 'it', flag: '🇮🇹', label: 'Italiano' },
	{ locale: 'sl', flag: '🇸🇮', label: 'Slovenščina' }
];
