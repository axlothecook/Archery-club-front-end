import { apiFetch } from '$lib/api';
import { DEFAULT_LOCALE } from '$lib/locale';
import type { ArticleCard, ClubEventResolved, ImageRef } from 'archery-contracts';

// Homepage data. Loads the content the homepage sections tease, each fail-soft so a
// single down endpoint never blocks the page (the section just renders empty / hidden).
//   • news    — the latest articles (the featured carousel under the hero).
//   • events  — UPCOMING events (the "Nadolazeće" teaser → /raspored).
//   • achievements — the 6 image-backed stat slots (titles/records) for the RM-style
//                    rotator → /postignuca.

type ArticleFeedPage = { items: ArticleCard[]; nextCursor: string | null };
type AchievementSummary = {
	stats: Record<string, number>;
	statImages: Record<string, ImageRef>;
};

// Enough to fill the news coverflow (8 cards: front + 3 receding each side).
const NEWS_COUNT = 8;

// The 6 image-backed stat slots, in display order, with their hr labels. Each becomes one
// slide in the achievements rotator (count + label + the slot's photo).
// Labels in the genitive plural so they read naturally after a count ("6 svjetskih
// naslova", "65 državnih rekorda").
const ACH_SLOTS: { slot: string; label: string }[] = [
	{ slot: 'worldTitles', label: 'Svjetskih naslova' },
	{ slot: 'europeanTitles', label: 'Europskih naslova' },
	{ slot: 'nationalTitles', label: 'Državnih naslova' },
	{ slot: 'worldRecords', label: 'Svjetskih rekorda' },
	{ slot: 'europeanRecords', label: 'Europskih rekorda' },
	{ slot: 'nationalRecords', label: 'Državnih rekorda' }
];

export const load = async ({ fetch }) => {
	const [news, events, summary] = await Promise.all([
		apiFetch<ArticleFeedPage>('/articles', {
			fetch,
			locale: DEFAULT_LOCALE,
			query: { limit: NEWS_COUNT }
		})
			.then((feed) => feed.items)
			.catch(() => [] as ArticleCard[]),
		apiFetch<ClubEventResolved[]>('/events', { fetch, locale: DEFAULT_LOCALE }).catch(
			() => [] as ClubEventResolved[]
		),
		apiFetch<AchievementSummary>('/achievements/summary', { fetch, locale: DEFAULT_LOCALE }).catch(
			() => null
		)
	]);

	// Build the rotator slides: only slots that have BOTH a count and a photo (skip any
	// missing image so a slot without a stat photo never renders a broken slide).
	const achievements = summary
		? ACH_SLOTS.map(({ slot, label }) => ({
				label,
				count: summary.stats[slot] ?? 0,
				image: summary.statImages[slot] ?? null
			})).filter((a) => a.count > 0 && a.image)
		: [];

	// Upcoming = events whose end (or start) is today or later, soonest first. /events is
	// ordered by start date; we filter to the future and keep that order.
	const todayMidnight = new Date();
	todayMidnight.setHours(0, 0, 0, 0);
	const upcoming = events.filter((e) => {
		const end = new Date(e.dateTo ?? e.dateFrom);
		return end >= todayMidnight && !e.isCancelled;
	});

	return { news, upcoming, achievements };
};
