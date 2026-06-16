import { apiFetch } from '$lib/api';
import type { ClubEventResolved, EventLevelResolved, ArticleCard } from 'archery-contracts';

// Cursor-paginated news feed shape (same as the news page): { items, nextCursor }.
type ArticleFeedPage = { items: ArticleCard[]; nextCursor: string | null };

// Data for the Raspored (schedule) page. Independent reads, fetched in parallel:
//   GET /events       — the events the club attended/will attend, resolved to
//                       the active locale, ordered by start date.
//   GET /event-levels — the calendar legend (Svjetski kup / Europsko / Državno /
//                       Domaće), each with its legend color, in display order.
//   GET /articles     — latest news (for the bottom NewsRoster, 8 cards).
// Each `.catch` degrades to empty so a backend hiccup doesn't 500 the page.
export const load = async ({ fetch, parent }) => {
	const { locale } = await parent();
	const [events, levels, feed] = await Promise.all([
		apiFetch<ClubEventResolved[]>('/events', { fetch, locale: locale }).catch(() => []),
		apiFetch<EventLevelResolved[]>('/event-levels', { fetch, locale: locale }).catch(
			() => []
		),
		apiFetch<ArticleFeedPage>('/articles', {
			fetch,
			locale: locale,
			query: { limit: 8 }
		}).catch(() => ({ items: [], nextCursor: null }) as ArticleFeedPage)
	]);

	return { events, levels, articles: feed.items };
};
