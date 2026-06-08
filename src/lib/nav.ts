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
	left: [{ label: 'Vijesti', href: '/najnovije' }] satisfies NavLink[],
	right: [
		{ label: 'Momčad', href: '/momcad' },
		{ label: 'Raspored', href: '/raspored' }
	] satisfies NavLink[]
};

// The half-screen menu (Gucci-style). Every page link that is NOT already in the
// TopBar (Vijesti, Momčad, Raspored) or the centred crest (home) lives here.
// A link may optionally have `children` — if it does, the menu treats it as a
// drill-down (shows a › arrow on hover, slides into a sub-view) instead of
// navigating directly. Without `children`, the link navigates directly.
export type MenuLink = NavLink & { children?: NavLink[] };

export const MENU_LINKS: MenuLink[] = [
	{ label: 'Povijest', href: '/klub/povijest' },
	{
		label: 'Identitet',
		href: '/klub/identitet',
		children: [
			{ label: 'Grb', href: '/klub/identitet/grb' },
			{ label: 'Dres', href: '/klub/identitet/dres' },
			{ label: 'Vrijednosti', href: '/klub/identitet' }
		]
	},
	{ label: 'Postignuća', href: '/postignuca' },
	{ label: 'Sponzori', href: '/sponzori' }
];

// Middle-tier link (Gucci's secondary block) — rendered between the big page
// links and the small utility tier, at its own medium size.
export const MENU_CONTACT: NavLink = { label: 'Kontakt', href: '/kontakt' };

// Smallest-tier utility links shown beneath the main menu links. Email/phone are
// rendered separately (email from ClubInfo; phone hardcoded until ClubInfo gains
// a phone field). Prijava (Log In) points to the dashboard — placeholder until deploy.
export const MENU_UTILITY: NavLink[] = [{ label: 'Prijava', href: '#' }];

// Footer columns (RM-style spacing). The social links + sponsor logos render
// separately (sponsors fetched from the API; socials from ClubInfo).
export const FOOTER_COLUMNS: { heading: string; links: NavLink[] }[] = [
	{
		heading: 'Klub',
		links: [
			{ label: 'Vijesti', href: '/najnovije' },
			{ label: 'Momčad', href: '/momcad' },
			{ label: 'Raspored', href: '/raspored' },
			{ label: 'Sponzori', href: '/sponzori' }
		]
	},
	{
		heading: 'O klubu',
		links: [
			{ label: 'Postignuća', href: '/postignuca' },
			{ label: 'Povijest', href: '/klub/povijest' },
			{ label: 'Grb', href: '/klub/identitet/grb' },
			{ label: 'Dres', href: '/klub/identitet/dres' },
			{ label: 'Vrijednosti', href: '/klub/identitet' }
		]
	},
	{
		heading: 'Usluge',
		links: [
			{ label: 'Kontakt', href: '/kontakt' },
			{ label: 'Učlanjenje', href: '/uclanjenje' }
		]
	}
];

// Bottom-bar legal links — placeholders until the legal pages are built.
export const FOOTER_LEGAL: NavLink[] = [
	{ label: 'Pravni uvjeti', href: '#' },
	{ label: 'Pravila privatnosti', href: '#' },
	{ label: 'Kolačići', href: '#' },
	{ label: 'Karta stranice', href: '#' }
];

// Locale switcher. `country` = ISO country code for the flag-icons class (fi-<country>).
// `short` = the 2-letter language tag shown next to the flag in the dropdown.
// hr is fully populated; others fall back to hr until translated.
export const LOCALE_FLAGS: {
	locale: string;
	country: string;
	short: string;
	label: string;
}[] = [
	{ locale: 'hr', country: 'hr', short: 'HR', label: 'Hrvatski' },
	{ locale: 'en', country: 'gb', short: 'EN', label: 'English' },
	{ locale: 'de', country: 'de', short: 'DE', label: 'Deutsch' },
	{ locale: 'it', country: 'it', short: 'IT', label: 'Italiano' },
	{ locale: 'sl', country: 'si', short: 'SL', label: 'Slovenščina' }
];
