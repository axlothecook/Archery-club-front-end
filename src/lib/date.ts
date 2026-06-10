// Croatian date formatting for article/news timestamps.
//
// The backend sends ISO strings (publishedAt). The site is hr-source, so we
// render dates in Croatian long form ("24. svibnja 2026.") via Intl with the
// 'hr-HR' locale — no extra dependency.

const HR_DATE = new Intl.DateTimeFormat('hr-HR', {
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

// "24. svibnja 2026." — long Croatian date. Returns '' for null/invalid input.
export function formatDateHr(iso: string | null | undefined): string {
	if (!iso) return '';
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return '';
	return HR_DATE.format(d);
}
