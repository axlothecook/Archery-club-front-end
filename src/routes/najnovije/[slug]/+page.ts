import { error } from '@sveltejs/kit';
import { apiFetch, ApiError } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ArticleResolved, ArcherCard } from 'archery-contracts';

// A single news article (resolved to the active locale). 404s through SvelteKit's
// error() when the slug doesn't resolve to a published, non-hidden article.
// Also fetches the ArcherCards (photo + bow) for the mentioned archers so the
// article's "U ovom članku" panel can render their cards — via the batch
// /team/cards endpoint (only the requested archers, not the whole roster).
export const load = async ({ params, fetch }) => {
	try {
		const article = await apiFetch<ArticleResolved>(`/articles/${params.slug}`, {
			fetch,
			locale: DEFAULT_LOCALE
		});

		const slugs = article.mentionedArchers.map((a) => a.slug);
		const mentionedCards =
			slugs.length > 0
				? await apiFetch<ArcherCard[]>('/team/cards', {
						fetch,
						query: { slugs: slugs.join(',') }
					}).catch(() => [] as ArcherCard[])
				: [];

		return { article, mentionedCards };
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			throw error(404, 'Članak nije pronađen');
		}
		throw err;
	}
};
