import { error } from '@sveltejs/kit';
import { apiFetch, ApiError } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ArcherProfile } from 'archery-contracts';

// One archer's full profile (resolved to the active locale). 404s through
// SvelteKit's error() when the slug doesn't resolve to a published, non-hidden
// archer. The backend already applies privacy rules (age hidden for minors,
// hiddenSections stripped) so the page renders whatever it receives.
export const load = async ({ params, fetch }) => {
	try {
		const archer = await apiFetch<ArcherProfile>(`/team/${params.slug}`, {
			fetch,
			locale: DEFAULT_LOCALE
		});
		return { archer };
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			throw error(404, 'Streličar nije pronađen');
		}
		throw err;
	}
};
