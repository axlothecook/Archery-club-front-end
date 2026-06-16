import { apiFetch } from '$lib/api';
import type { ImageRef } from 'archery-contracts';

// One honour CARD on the achievements page (PSG style): every achievement row
// sharing a title is stacked into one card carrying a `count` + the winning
// `years`. The backend (`GET /achievements/summary`) does the grouping + sorts
// the cards by count (descending), so the page renders them in that order.
export type AchievementGroup = {
	title: string;
	count: number;
	years: number[];
	level: 'world' | 'european' | 'state' | 'other';
	type: 'title' | 'record' | 'other';
	medal: 'gold' | 'silver' | 'bronze' | null;
	scope: 'individual' | 'team' | 'club';
	// May be null: a title with no medal + no custom photo has no stock icon.
	image: ImageRef | null;
};

// The full /achievements/summary payload. We only render `groups` on this page
// (no stats banner), but type the rest so the shape is documented in one place.
type AchievementSummary = {
	locale: string;
	stats: Record<string, number>;
	statImages: Record<string, ImageRef>;
	groups: AchievementGroup[];
};

// Load the grouped honour cards for the Postignuća page.
export const load = async ({ fetch, parent }) => {
	const { locale } = await parent();
	const summary = await apiFetch<AchievementSummary>('/achievements/summary', {
		fetch,
		locale: locale
	}).catch(() => null);

	// Hide specific honour groups from the public list (display-only — the rows
	// still live in the backend and count toward the record totals):
	//  - "Svjetski i europski juniorski rekord": its date is unknown (year:null,
	//    not found in research). Hidden until the date is clarified; flagged in the
	//    "if adopted" backlog. Other groups are unaffected.
	const HIDDEN_TITLES = new Set(['Svjetski i europski juniorski rekord']);
	const groups = (summary?.groups ?? []).filter((g) => !HIDDEN_TITLES.has(g.title));

	return { groups };
};
