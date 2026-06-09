import { apiFetch } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ClubHistoryPeriodResolved } from 'archery-contracts';

// All history periods (foundation first). Loaded once for the whole
// /klub/povijest section so the grid + each detail page share the data.
export const load = async ({ fetch }) => {
	const periods = await apiFetch<ClubHistoryPeriodResolved[]>('/club-history', {
		fetch,
		locale: DEFAULT_LOCALE
	}).catch(() => [] as ClubHistoryPeriodResolved[]);

	return { periods };
};
