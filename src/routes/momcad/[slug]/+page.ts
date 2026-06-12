import { error } from '@sveltejs/kit';
import { apiFetch, ApiError } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ArcherProfile, ArcherCard, ArticleCard } from 'archery-contracts';

// Feed shape from `GET /articles` (cursor-paginated newest-first).
type ArticleFeedPage = { items: ArticleCard[]; nextCursor: string | null };

// One archer's full profile (resolved to the active locale) plus the team roster
// (for the "related archers" strip) and a batch of recent articles (for the
// "related articles" strip). 404s through SvelteKit's error() when the slug
// doesn't resolve. Roster/articles fail soft so the page still renders.
export const load = async ({ params, fetch }) => {
	try {
		const [archer, roster, related] = await Promise.all([
			apiFetch<ArcherProfile>(`/team/${params.slug}`, { fetch, locale: DEFAULT_LOCALE }),
			apiFetch<ArcherCard[]>('/team', { fetch }).catch(() => [] as ArcherCard[]),
			// Articles that MENTION this archer (related news). Falls back to the newest
			// articles below if the archer isn't tagged in any.
			apiFetch<ArticleFeedPage>('/articles', {
				fetch,
				locale: DEFAULT_LOCALE,
				query: { limit: 8, mentions: params.slug }
			}).catch(() => ({ items: [], nextCursor: null }) as ArticleFeedPage)
		]);

		// Start with the articles that mention this archer; if there are fewer than the
		// target (8), TOP UP with the newest articles (skipping any already included)
		// so the strip is always full.
		const TARGET = 8;
		const articles = [...related.items];
		if (articles.length < TARGET) {
			const feed = await apiFetch<ArticleFeedPage>('/articles', {
				fetch,
				locale: DEFAULT_LOCALE,
				query: { limit: TARGET }
			}).catch(() => ({ items: [], nextCursor: null }) as ArticleFeedPage);
			const seen = new Set(articles.map((a) => a.slug));
			for (const item of feed.items) {
				if (articles.length >= TARGET) break;
				if (!seen.has(item.slug)) {
					articles.push(item);
					seen.add(item.slug);
				}
			}
		}

		return { archer, roster, articles };
	} catch (err) {
		if (err instanceof ApiError && err.status === 404) {
			throw error(404, 'Streličar nije pronađen');
		}
		throw err;
	}
};
