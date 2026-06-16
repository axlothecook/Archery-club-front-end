// WCAG contrast helper. Event/level colours come from the DB and are shown as text
// on the navy card header; some (e.g. purple #8E44AD, red #E60023) fall below the
// WCAG AA contrast ratio on navy. `ensureReadable` keeps the hue but lightens the
// colour just enough to clear a target ratio, so the level text stays legible while
// remaining recognisably its brand colour.

type RGB = { r: number; g: number; b: number };

function parseHex(hex: string): RGB | null {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!m) return null;
	const n = parseInt(m[1], 16);
	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex({ r, g, b }: RGB): string {
	const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
	return `#${h(r)}${h(g)}${h(b)}`;
}

// Relative luminance (WCAG 2.x).
function luminance({ r, g, b }: RGB): number {
	const ch = (v: number) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function ratio(a: RGB, b: RGB): number {
	const la = luminance(a);
	const lb = luminance(b);
	const [hi, lo] = la > lb ? [la, lb] : [lb, la];
	return (hi + 0.05) / (lo + 0.05);
}

// Lighten `color` toward white in small steps until it meets `target` contrast
// against `bg`. Returns the original hex if it already passes (or can't be parsed).
// Default target 4.5 = WCAG AA for normal text (the strictest Lighthouse applies);
// the level names are large bold (1.55rem/700) so 3:1 would technically suffice, but
// 4.5 is a safe pass. `bg` = the navy header AS RENDERED (#244073, which is the
// #102E66 base lightened by the white card-body overlap), not the raw token.
export function ensureReadable(color: string, bg = '#244073', target = 4.5): string {
	const fg = parseHex(color);
	const back = parseHex(bg);
	if (!fg || !back) return color;
	if (ratio(fg, back) >= target) return color;
	let cur = { ...fg };
	for (let i = 0; i < 40; i++) {
		// move ~6% of the remaining distance to white each step
		cur = { r: cur.r + (255 - cur.r) * 0.06, g: cur.g + (255 - cur.g) * 0.06, b: cur.b + (255 - cur.b) * 0.06 };
		if (ratio(cur, back) >= target) break;
	}
	return toHex(cur);
}
