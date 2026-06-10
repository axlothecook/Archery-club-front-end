// Shared text helpers for rendering body copy from the backend.

// Split a body string on blank lines into separate paragraphs. The seed/CMS
// stores intended paragraph breaks as "\n\n", so long bodies render as several
// readable <p> blocks instead of one wall of text. Used by the chapter page and
// the news-article page (both render prose the same way).
export function splitParagraphs(body: string | null | undefined): string[] {
	return (body ?? '')
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean);
}
