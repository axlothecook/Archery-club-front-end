import { apiFetch } from '$lib/api';
import type { ClubIdentitySectionResolved } from 'archery-contracts';

// All identity sections (Vrijednosti / Grb / Dres) for the tab bar. Loaded once
// for the whole /klub/identitet section so switching tabs doesn't refetch.
export const load = async ({ fetch, parent }) => {
	const { locale } = await parent();
	const sections = await apiFetch<ClubIdentitySectionResolved[]>('/club-identity', {
		fetch,
		locale: locale
	}).catch(() => [] as ClubIdentitySectionResolved[]);

	return { sections };
};
