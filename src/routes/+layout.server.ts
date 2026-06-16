import { resolveLocale, LOCALE_COOKIE } from '$lib/locale';
import type { LayoutServerLoad } from './$types';

// The ACTIVE locale for the whole site comes from the `locale` cookie (set by the
// language switcher). Reading it here, server-side, means SSR renders in the chosen
// language on first paint (no hr→en flash). Child loads read it via `await parent()`;
// the switcher re-runs all loads with `invalidateAll()` after changing the cookie.
export const load: LayoutServerLoad = ({ cookies, depends }) => {
	// Tag this load so the switcher can re-run it (and every child load that reads
	// the locale via parent()) with invalidate('app:locale') — cookies aren't an
	// auto-tracked dependency, so we register one explicitly.
	depends('app:locale');
	const locale = resolveLocale(cookies.get(LOCALE_COOKIE));
	return { locale };
};
