import { describe, it, expect } from 'vitest';
import { formatDateHr } from './date';

describe('formatDateHr', () => {
	it('formats an ISO date as a long Croatian date', () => {
		// 24 May 2026 → "24. svibnja 2026." (Croatian long form). Use noon UTC so the
		// local-time conversion can't roll the day backward/forward in any timezone.
		const out = formatDateHr('2026-05-24T12:00:00.000Z');
		expect(out).toContain('2026');
		expect(out).toContain('svibnja'); // Croatian genitive for May
		expect(out).toContain('24');
	});

	it('returns empty string for null/undefined/empty input', () => {
		expect(formatDateHr(null)).toBe('');
		expect(formatDateHr(undefined)).toBe('');
		expect(formatDateHr('')).toBe('');
	});

	it('returns empty string for an invalid date string', () => {
		expect(formatDateHr('not-a-date')).toBe('');
	});

	it('handles a plain YYYY-MM-DD date', () => {
		const out = formatDateHr('2026-01-01');
		expect(out).toContain('2026');
		expect(out).not.toBe('');
	});
});
