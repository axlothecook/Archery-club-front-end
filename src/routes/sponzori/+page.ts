import { apiFetch } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { SponsorResolved } from 'archery-contracts';

// All club sponsors ("partneri"), resolved to the active locale. Rendered as the
// alternating offset partner cards on the Sponzori page. Empty array on failure
// so the page still renders its hero + honorary mention.
export const load = async ({ fetch }) => {
	const sponsors = await apiFetch<SponsorResolved[]>('/sponsors', {
		fetch,
		locale: DEFAULT_LOCALE
	}).catch(() => [] as SponsorResolved[]);

	return { sponsors };
};
