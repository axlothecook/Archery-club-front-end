import { apiFetch } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ArticleCard } from 'archery-contracts';

// The news feed's first page. The backend cursor-paginates `/articles` newest
// first (PAGE_SIZE = 12) and returns { items, nextCursor }; nextCursor is the
// publishedAt of the last item (pass it as ?before= to load older), null when
// there are no more. Empty + null on failure so the page still renders.
export type ArticleFeedPage = { items: ArticleCard[]; nextCursor: string | null };

// First page is larger: 9 fill the carousel (5) + highlights (4), then 9 more seed
// the first grid batch. Subsequent "Više vijesti" clicks load 9 at a time.
const FIRST_PAGE = 18;

export const load = async ({ fetch }) => {
	const feed = await apiFetch<ArticleFeedPage>('/articles', {
		fetch,
		locale: DEFAULT_LOCALE,
		query: { limit: FIRST_PAGE }
	}).catch(() => ({ items: [], nextCursor: null }) as ArticleFeedPage);

	return feed;
};
