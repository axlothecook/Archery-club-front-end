import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API layer so we can feed the loader controlled responses. apiFetch is
// called with a path; we route by path to the right fixture.
const responses: Record<string, unknown> = {};
vi.mock('$lib/api', () => ({
	apiFetch: (path: string) => {
		if (path in responses) return Promise.resolve(responses[path]);
		return Promise.reject(new Error(`no fixture for ${path}`));
	}
}));

import { load } from './+page';

const img = { url: 'https://images.axlothecook.com/archery/x.jpg', alt: 'x' };

// The loader reads the active locale via `await parent()`; supply a mock.
const loadArgs = () =>
	({ fetch: undefined, parent: async () => ({ locale: 'hr' }) }) as never;

beforeEach(() => {
	for (const k of Object.keys(responses)) delete responses[k];
});

describe('homepage load()', () => {
	it('builds achievement slides only for slots with BOTH a count and an image', async () => {
		responses['/articles'] = { items: [], nextCursor: null };
		responses['/events'] = [];
		responses['/achievements/summary'] = {
			stats: { worldTitles: 6, europeanTitles: 0, nationalRecords: 65 },
			statImages: { worldTitles: img, nationalRecords: img /* europeanTitles has count 0 */ }
		};

		const data = await load(loadArgs());

		// worldTitles (count+image) and nationalRecords (count+image) qualify;
		// europeanTitles is dropped (count 0); slots with no image are dropped.
		const slots = data.achievements.map((a) => a.slot);
		expect(slots).toEqual(['worldTitles', 'nationalRecords']);
		expect(data.achievements[0]).toMatchObject({ count: 6, image: img });
	});

	it('drops a slot that has a count but no image', async () => {
		responses['/articles'] = { items: [], nextCursor: null };
		responses['/events'] = [];
		responses['/achievements/summary'] = {
			stats: { worldTitles: 6 },
			statImages: {} // no image for worldTitles
		};
		const data = await load(loadArgs());
		expect(data.achievements).toEqual([]);
	});

	it('keeps only future, non-cancelled events as upcoming', async () => {
		const future = new Date(Date.now() + 7 * 864e5).toISOString();
		const past = new Date(Date.now() - 7 * 864e5).toISOString();
		responses['/articles'] = { items: [], nextCursor: null };
		responses['/achievements/summary'] = { stats: {}, statImages: {} };
		responses['/events'] = [
			{ id: 'a', dateFrom: future, dateTo: null, isCancelled: false },
			{ id: 'b', dateFrom: past, dateTo: null, isCancelled: false }, // past → dropped
			{ id: 'c', dateFrom: future, dateTo: null, isCancelled: true } // cancelled → dropped
		];
		const data = await load(loadArgs());
		expect(data.upcoming.map((e: { id: string }) => e.id)).toEqual(['a']);
	});

	it('fails soft: a down endpoint yields empty data, not a thrown error', async () => {
		// Only /articles resolves; /events and /achievements/summary reject.
		responses['/articles'] = { items: [{ slug: 'x' }], nextCursor: null };
		const data = await load(loadArgs());
		expect(data.news).toHaveLength(1);
		expect(data.upcoming).toEqual([]);
		expect(data.achievements).toEqual([]);
	});
});
