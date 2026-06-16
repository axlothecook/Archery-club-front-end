import { apiFetch } from '$lib/api';
import type { ClubHistoryPeriodResolved } from 'archery-contracts';

// All history periods (foundation first). Loaded once for the whole
// /klub/povijest section so the grid + each detail page share the data.
export const load = async ({ fetch, parent }) => {
	const { locale } = await parent();
	const periods = await apiFetch<ClubHistoryPeriodResolved[]>('/club-history', {
		fetch,
		locale: locale
	}).catch(() => [] as ClubHistoryPeriodResolved[]);

	return { periods };
};
