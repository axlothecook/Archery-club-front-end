import { describe, it, expect } from 'vitest';
import { dayKey, buildMonthGrid } from './calendar';

describe('dayKey', () => {
	it('formats a UTC date as zero-padded YYYY-MM-DD', () => {
		expect(dayKey(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05'); // Jan = month 0
		expect(dayKey(new Date(Date.UTC(2026, 11, 31)))).toBe('2026-12-31');
	});
});

describe('buildMonthGrid', () => {
	it('always returns 6 weeks of 7 days (42 cells)', () => {
		const grid = buildMonthGrid(2026, 5); // June 2026
		expect(grid).toHaveLength(6);
		for (const week of grid) expect(week).toHaveLength(7);
		expect(grid.flat()).toHaveLength(42);
	});

	it('starts each week on Sunday (first cell is a Sunday)', () => {
		const grid = buildMonthGrid(2026, 5);
		expect(grid[0][0].date.getUTCDay()).toBe(0); // 0 = Sunday
	});

	it('places the 1st of the month in the correct cell with leading spill', () => {
		// June 2026: the 1st is a Monday, so cell[0] is Sun May 31 (out of month),
		// cell[1] is Mon June 1 (in month).
		const grid = buildMonthGrid(2026, 5);
		const flat = grid.flat();
		expect(flat[0].inMonth).toBe(false);
		expect(flat[0].key).toBe('2026-05-31');
		expect(flat[1].inMonth).toBe(true);
		expect(flat[1].dayNum).toBe(1);
		expect(flat[1].key).toBe('2026-06-01');
	});

	it('marks only the target month days as inMonth, with the right count', () => {
		// June has 30 days.
		const inMonth = buildMonthGrid(2026, 5).flat().filter((c) => c.inMonth);
		expect(inMonth).toHaveLength(30);
		expect(inMonth[0].dayNum).toBe(1);
		expect(inMonth[inMonth.length - 1].dayNum).toBe(30);
	});

	it('handles a month that starts on Sunday with no leading spill', () => {
		// Feb 2026 starts on a Sunday → first cell IS Feb 1.
		const flat = buildMonthGrid(2026, 1).flat();
		expect(flat[0].inMonth).toBe(true);
		expect(flat[0].key).toBe('2026-02-01');
	});

	it('handles February correctly (28 days in 2026, non-leap)', () => {
		const inMonth = buildMonthGrid(2026, 1).flat().filter((c) => c.inMonth);
		expect(inMonth).toHaveLength(28);
	});

	it('handles a leap-year February (29 days in 2028)', () => {
		const inMonth = buildMonthGrid(2028, 1).flat().filter((c) => c.inMonth);
		expect(inMonth).toHaveLength(29);
	});

	it('produces unique, gap-free consecutive day keys across the whole grid', () => {
		const flat = buildMonthGrid(2026, 5).flat();
		const keys = flat.map((c) => c.key);
		expect(new Set(keys).size).toBe(42); // all unique
		// each cell is exactly one day after the previous
		for (let i = 1; i < flat.length; i++) {
			const prev = flat[i - 1].date.getTime();
			const cur = flat[i].date.getTime();
			expect(cur - prev).toBe(24 * 60 * 60 * 1000);
		}
	});
});
