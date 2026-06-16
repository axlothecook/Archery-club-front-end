import { apiFetch } from '$lib/api';
import type { ClubInfoResolved, SponsorResolved } from 'archery-contracts';

// Site-wide data loaded once for every page: sponsors (footer cap) + club info
// (footer socials + contact). Runs on the server during SSR; falls back to empty
// on error so the footer still renders. The active `locale` comes from the server
// layout (cookie-driven); it's exposed to every child load via `await parent()`.
export const load = async ({ fetch, data }) => {
	const locale = data.locale;

	const [sponsors, clubInfo] = await Promise.all([
		apiFetch<SponsorResolved[]>('/sponsors', { fetch, locale }).catch(() => [] as SponsorResolved[]),
		apiFetch<ClubInfoResolved>('/club-info', { fetch, locale }).catch(() => null)
	]);

	return { sponsors, clubInfo, locale };
};
