import { apiFetch } from '$lib/api';
import type { SponsorResolved } from 'archery-contracts';

// All club sponsors ("partneri"), resolved to the active locale. Rendered as the
// alternating offset partner cards on the Sponzori page. Empty array on failure
// so the page still renders its hero + honorary mention.
export const load = async ({ fetch, parent }) => {
	const { locale } = await parent();
	const sponsors = await apiFetch<SponsorResolved[]>('/sponsors', {
		fetch,
		locale: locale
	}).catch(() => [] as SponsorResolved[]);

	return { sponsors };
};
