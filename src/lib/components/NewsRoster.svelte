<script lang="ts">
	// News roster: the latest COUNT (8) articles as compact image cards (348×196).
	// Each card is a cover photo with a text panel overlaid at the bottom — title at
	// the top of the panel, a date+clock / "NAJNOVIJE" meta row at the bottom. On
	// hover the card itself stays put but the text panel slides UP to reveal the
	// article's opening sentence (excerpt). No paging.
	import type { ArticleCard as ArticleCardData } from 'archery-contracts';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import { formatDateHr } from '$lib/date';

	let { articles, heading = 'NAJNOVIJE VIJESTI' }: { articles: ArticleCardData[]; heading?: string } =
		$props();

	const COUNT = 8;
	const shown = $derived(articles.slice(0, COUNT));
	// Phone shows fewer, in a PSG-style 2-up grid of ArticleCards (no overlay cards).
	const PHONE_COUNT = 6;
	const phoneShown = $derived(articles.slice(0, PHONE_COUNT));

	// Limit the hover excerpt to 120 characters (cut on a word boundary); if the text
	// was longer, append an ellipsis to signal the sentence continues.
	const EXCERPT_CHARS = 120;
	function clampWords(text: string): string {
		const t = text.trim();
		if (t.length <= EXCERPT_CHARS) return t;
		const cut = t.slice(0, EXCERPT_CHARS);
		// Back up to the last space so we don't slice mid-word.
		const lastSpace = cut.lastIndexOf(' ');
		return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:!?\s]+$/, '') + '…';
	}
</script>

{#if shown.length}
	<section class="news-roster" aria-label={heading}>
		<h2 class="nr-heading"><strong>Najnovije</strong> <span>vijesti</span></h2>

		<!-- PHONE: PSG-style 2-up grid of ArticleCards (poster + category/title/date below).
		     Hidden on desktop, where the overlay-card grid below is shown instead. -->
		<ul class="nr-grid-phone">
			{#each phoneShown as a (a.slug)}
				<li><ArticleCard article={a} /></li>
			{/each}
		</ul>

		<ul class="nr-grid">
			{#each shown as a (a.slug)}
				<li>
					<a class="nr-card" href="/najnovije/{a.slug}">
						<div class="nr-card-img">
							<ImageWithLoader src={a.posterImage.url} alt={a.posterImage.alt} fit="cover" />
						</div>

						<div class="nr-panel">
							<!-- Title + excerpt share ONE block. The title sits at the block's TOP
							     (so all titles align); the excerpt at its BOTTOM, revealed on hover.
							     The block grows by a FIXED amount on hover (the excerpt's reserved
							     slot), so every card climbs to the same height regardless of title
							     length, and the title→excerpt gap is hidden INSIDE the block. -->
							<div class="nr-textblock">
								<h3 class="nr-title"><span class="nr-title-clamp">{a.title}</span></h3>
								{#if a.excerpt}
									<div class="nr-excerpt-wrap">
										<p class="nr-excerpt"><span class="nr-excerpt-inner">{clampWords(a.excerpt)}</span></p>
									</div>
								{/if}
							</div>
							<div class="nr-meta">
								<span class="nr-date">
									<ClockIcon size={13} />
									{formatDateHr(a.publishedAt)}
								</span>
								<span class="nr-tag">
									<span class="nr-tag-square" aria-hidden="true"></span>
									Najnovije
								</span>
							</div>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;

	// White band. Top padding is 0 — the flourish's margin (6×) above provides the gap
	// from the logo to the cards; the bottom padding mirrors it so the cards sit the
	// same distance from the logo above as from the bottom of this white div.
	.news-roster {
		padding: 0 $sp ($sp * 9);
		background: $white;
	}
	.nr-heading {
		margin: 0 auto ($sp * 2.5);
		max-width: 1500px;
		text-align: center;
		color: $navy;
		font-size: 2.4rem;
		font-weight: 300;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		strong {
			font-weight: 800;
		}
		span {
			font-weight: 300;
		}
	}

	// Grid of fixed-width cards (slightly TALLER than wide), centred, tight gap.
	.nr-grid {
		list-style: none;
		margin: 0 auto;
		padding: 0;
		max-width: 1500px;
		display: grid;
		// Stretch 4 cards to fill the row, matching the content/header width above.
		grid-template-columns: repeat(4, 1fr);
		gap: ($sp * 0.75);
	}
	// The phone PSG grid is hidden on desktop (overlay-card grid is shown instead).
	.nr-grid-phone {
		display: none;
	}

	// Card = image with a WHITE text panel overlaid at the bottom. Square corners.
	.nr-card {
		position: relative;
		display: block;
		width: 100%;
		height: 320px;
		overflow: hidden;
		text-decoration: none;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
	}
	.nr-card-img {
		position: absolute;
		inset: 0;
		transition: transform 0.3s ease;
	}

	// White text panel pinned to the bottom: title (top) → excerpt (collapsed) → meta
	// (bottom). Title and meta are ALWAYS visible; the excerpt reveals via a CSS-grid
	// 0fr→1fr animation (jank-free). Default panel is compact; it grows on hover.
	$reveal: 96px; // image-slide amount, matched to the opened 3-line excerpt + margins
	.nr-panel {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		// OPTION 1 — leftover line BELOW the excerpt. Title is natural + top-aligned; the meta
		// is pinned to the bottom (margin-top: auto). At REST the excerpt is collapsed (height
		// 0), so this min-height reserves only the COLLAPSED worst case: a 2-line title + the
		// meta row (+ panel padding, since box-sizing is border-box). That makes every resting
		// panel the same height regardless of title length; a 1-line title's spare line lands
		// as flexible space above the meta. On hover every card opens by the SAME fixed excerpt
		// height, so the expanded panels stay equal too. Terms use each element's own font
		// metrics (title 1.05rem×1.35, meta 0.72rem×1.4) in rem, so it scales responsively.
		// Reserves the COLLAPSED worst case (2-line title + meta + padding); the trailing
		// `$sp * 0.8` is extra resting breathing room. Hover adds the excerpt on top of this.
		min-height: calc(
			#{$sp * 1} + (1.05rem * 1.35 * 2) + #{$sp * 0.6} + (0.72rem * 1.4) + #{$sp * 1.35} +
				#{$sp * 0.8}
		);
		padding: ($sp * 1) ($sp * 0.85) ($sp * 1.35);
		background: $white;
		color: $navy;
	}
	// Title + excerpt share one block. The BLOCK carries the fixed height (not the title), so
	// every card's block — and thus the panel — grows to the SAME height on hover regardless of
	// title length. The title is NATURAL height and sits at the block's top with the excerpt
	// right under it, so the title→excerpt gap is identical on every card (no reserved empty
	// line wedged between them). A 1-line title's leftover slack falls at the block's BOTTOM.
	// Hovered height = 2 title lines + the gap + 3 excerpt lines, in rem so it stays responsive.
	$title-lh: 1.05rem * 1.35; // one title line
	$ex-lh: 0.78rem * 1.4; // one excerpt line
	// At rest the block is just the title's natural height; on hover it animates to the FIXED
	// full height (2 title lines + gap + 3 excerpt lines), the same target on every card so all
	// climb to an identical height. The excerpt fades in inside the grown block.
	$block-rest: calc(#{$title-lh} * 2); // 2 title lines, so every card's rest block is equal
	$block-open: calc((#{$title-lh} * 2) + #{$sp * 0.4} + (#{$ex-lh} * 3) + #{$sp * 1.4});
	.nr-textblock {
		display: flex;
		flex-direction: column;
		height: $block-rest; // FIXED rest height (2 title lines) → every card equal at rest
		overflow: hidden; // clip the excerpt while the block is collapsed
		transition: height 0.3s ease;
	}
	.nr-title {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 800;
		line-height: 1.35;
		text-align: center;
		color: map.get(lib.$colors, 'black');
		// Natural height (clamped at 2 lines). No reserved box here — the block above owns the
		// height — so the title sits tight above the excerpt with the same gap on every card.
		// flex: 0 0 auto keeps the title at its natural height (otherwise the tall excerpt below
		// squeezes it to 0 inside the fixed-height, clipped block).
		flex: 0 0 auto;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	// Excerpt reveal — the wrapper animates its own HEIGHT from 0 to a FIXED 3-line target
	// (--ex-h). Because the target is a constant (not content-driven), every card's panel
	// grows by exactly the same amount on hover. Direct height transition = deterministic.
	$ex-h: calc(0.78rem * 1.4 * 3); // fixed 3-line excerpt height
	// The excerpt-wrap is always its natural height; the block above clips it when collapsed
	// and reveals it as the block grows on hover. Its margins set the title→excerpt gap.
	.nr-excerpt-wrap {
		flex: 0 0 auto;
		margin-top: ($sp * 0.4);
		margin-bottom: ($sp * 1.4);
	}
	.nr-excerpt {
		margin: 0;
		opacity: 0; // hidden at rest; fades in on hover
		transition: opacity 0.25s ease;
	}
	// FIXED 3-line height regardless of how many lines the text fills (clamped at 3).
	.nr-excerpt-inner {
		display: -webkit-box;
		height: $ex-h;
		font-size: 0.78rem;
		font-weight: 300;
		line-height: 1.4;
		color: map.get(lib.$colors, 'jet-grey');
		overflow: hidden;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
	}
	.nr-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: ($sp * 0.6);
	}
	.nr-date {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.72rem;
		font-weight: 600;
		color: map.get(lib.$colors, 'jet-grey');
		:global(svg) {
			flex: 0 0 auto;
		}
	}
	.nr-tag {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: $navy;
		white-space: nowrap;
	}
	.nr-tag-square {
		width: 9px;
		height: 9px;
		background: $gold;
		flex: 0 0 auto;
	}

	// Hover: the text block grows to its fixed full height (revealing the clipped excerpt — the
	// SAME target on every card, so all climb to an identical height), the excerpt fades in, and
	// the image slides up by the same amount so photo + panel rise together.
	.nr-card:hover .nr-textblock {
		height: $block-open;
	}
	.nr-card:hover .nr-excerpt {
		opacity: 1;
	}
	.nr-card:hover .nr-card-img {
		transform: translateY(-$reveal);
	}

	@media (max-width: 1100px) {
		.nr-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.nr-card {
			height: 300px;
		}
	}
	// ── Phone: swap the overlay-card grid for the PSG ArticleCard grid (2-up) ────────
	@media (max-width: 720px) {
		.news-roster {
			padding: 0 ($sp * 1.25) ($sp * 5);
		}
		.nr-heading {
			font-size: 1.8rem;
			margin-bottom: ($sp * 1.75);
		}
		.nr-grid {
			display: none; // hide the desktop overlay cards on phone
		}
		.nr-grid-phone {
			display: grid;
			list-style: none;
			margin: 0 auto;
			padding: 0;
			grid-template-columns: repeat(2, 1fr);
			gap: ($sp * 1.5) ($sp * 1.25);
		}
	}
</style>
