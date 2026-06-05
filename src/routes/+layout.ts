import { apiFetch } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ClubInfoResolved, SponsorResolved } from 'archery-contracts';

// Site-wide data loaded once for every page: sponsors (footer cap) + club info
// (footer socials + contact). Runs on the server during SSR; falls back to empty
// on error so the footer still renders.
export const load = async ({ fetch }) => {
	const locale = DEFAULT_LOCALE;

	const [sponsors, clubInfo] = await Promise.all([
		apiFetch<SponsorResolved[]>('/sponsors', { fetch, locale }).catch(() => [] as SponsorResolved[]),
		apiFetch<ClubInfoResolved>('/club-info', { fetch, locale }).catch(() => null)
	]);

	return { sponsors, clubInfo };
};
