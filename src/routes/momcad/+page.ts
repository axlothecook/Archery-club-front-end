import { apiFetch } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ArcherCard, ArticleCard } from 'archery-contracts';

// Feed shape from `GET /articles` (cursor-paginated newest-first).
type ArticleFeedPage = { items: ArticleCard[]; nextCursor: string | null };

// The team roster + a batch of recent articles (for the news roster shown at the
// top of the page's golden footer band). Both empty on failure so the page still
// renders. Roster: no locale (cards carry no translatable text); articles: resolved
// to the active locale.
export const load = async ({ fetch }) => {
	const [roster, feed] = await Promise.all([
		apiFetch<ArcherCard[]>('/team', { fetch }).catch(() => [] as ArcherCard[]),
		apiFetch<ArticleFeedPage>('/articles', {
			fetch,
			locale: DEFAULT_LOCALE,
			query: { limit: 24 }
		}).catch(() => ({ items: [], nextCursor: null }) as ArticleFeedPage)
	]);

	return { roster, articles: feed.items };
};
