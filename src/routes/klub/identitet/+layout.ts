import { apiFetch } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ClubIdentitySectionResolved } from 'archery-contracts';

// All identity sections (Vrijednosti / Grb / Dres) for the tab bar. Loaded once
// for the whole /klub/identitet section so switching tabs doesn't refetch.
export const load = async ({ fetch }) => {
	const sections = await apiFetch<ClubIdentitySectionResolved[]>('/club-identity', {
		fetch,
		locale: DEFAULT_LOCALE
	}).catch(() => [] as ClubIdentitySectionResolved[]);

	return { sections };
};
