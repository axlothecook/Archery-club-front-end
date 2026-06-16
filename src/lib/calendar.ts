// Pure calendar-grid math for the schedule (/raspored) month view. Extracted from
// the page so the "which day lands in which cell" logic — the part most prone to
// silent off-by-one bugs — is unit-testable in isolation. No events, no "today",
// no Svelte: just dates. Everything is UTC to avoid timezone drift in the grid.

/** `YYYY-MM-DD` key for a UTC date (stable map key + comparison). */
export function dayKey(d: Date): string {
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
		d.getUTCDate()
	).padStart(2, '0')}`;
}

export type GridDay = {
	date: Date; // UTC midnight
	key: string;
	dayNum: number;
	inMonth: boolean; // false = a leading/trailing day spilling in from an adjacent month
};

/**
 * Build the 6×7 (Sunday-first) month grid for `year`/`month` (month is 0-based).
 * Always 42 cells / 6 rows so the grid height never jumps between months. Leading
 * cells come from the previous month, trailing from the next, both flagged
 * `inMonth: false`.
 */
export function buildMonthGrid(year: number, month: number): GridDay[][] {
	const first = new Date(Date.UTC(year, month, 1));
	const startOffset = first.getUTCDay(); // 0 = Sunday
	const cells: GridDay[] = [];
	for (let i = 0; i < 42; i++) {
		const d = new Date(Date.UTC(year, month, 1 - startOffset + i));
		cells.push({
			date: d,
			key: dayKey(d),
			dayNum: d.getUTCDate(),
			inMonth: d.getUTCMonth() === month
		});
	}
	return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
