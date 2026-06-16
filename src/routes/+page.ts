import { apiFetch } from '$lib/api';
import { t } from '$lib/i18n';
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

// The 6 image-backed stat slots, in display order, with their i18n label keys. Each becomes
// one slide in the achievements rotator (count + label + the slot's photo). The label is
// resolved per locale via t() in the load below (hr labels are the genitive plural so they
// read naturally after a count: "6 svjetskih naslova", "65 državnih rekorda").
const ACH_SLOTS: { slot: string; labelKey: string }[] = [
	{ slot: 'worldTitles', labelKey: 'home.statWorldTitles' },
	{ slot: 'europeanTitles', labelKey: 'home.statEuropeanTitles' },
	{ slot: 'nationalTitles', labelKey: 'home.statNationalTitles' },
	{ slot: 'worldRecords', labelKey: 'home.statWorldRecords' },
	{ slot: 'europeanRecords', labelKey: 'home.statEuropeanRecords' },
	{ slot: 'nationalRecords', labelKey: 'home.statNationalRecords' }
];

export const load = async ({ fetch, parent }) => {
	const { locale } = await parent();
	const [news, events, summary] = await Promise.all([
		apiFetch<ArticleFeedPage>('/articles', {
			fetch,
			locale,
			query: { limit: NEWS_COUNT }
		})
			.then((feed) => feed.items)
			.catch(() => [] as ArticleCard[]),
		apiFetch<ClubEventResolved[]>('/events', { fetch, locale }).catch(
			() => [] as ClubEventResolved[]
		),
		apiFetch<AchievementSummary>('/achievements/summary', { fetch, locale }).catch(
			() => null
		)
	]);

	// Build the rotator slides: only slots that have BOTH a count and a photo (skip any
	// missing image so a slot without a stat photo never renders a broken slide).
	const achievements = summary
		? ACH_SLOTS.map(({ slot, labelKey }) => ({
				slot,
				label: t(locale, labelKey),
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
