<script lang="ts">
	// Shared "explore the club" footer block — a golden gold→navy fade section (same
	// look + position as the history chapter's related section) holding 4 nav cards
	// in a row, each a cover photo with the section name overlaid (always visible).
	// On hover the photo darkens (modal-backdrop style) and the name is emphasised.
	// White lines flank the row (left of the first card, right of the last).
	//
	// Used at the bottom of the Identitet / Sponzori / Postignuća pages.
	import { page } from '$app/state';
	import { t } from '$lib/i18n';

	// The four main club sections. `image` is each section's representative photo.
	// Povijest → the latest chapter's cover; Identitet → the Olympic image.
	// NOTE: distinct images for Sponzori/Postignuća don't exist yet — they reuse a
	// placeholder for now; swap to real ones when available.
	const BASE = 'https://images.axlothecook.com/archery';
	const OLYMPIC_IMG = `${BASE}/identity/olimpic-logo.jpg`;
	const LATEST_CHAPTER_IMG = `${BASE}/history/ch-9.jpg`; // 2024 "Novo doba kluba" cover
	const ACHIEVEMENTS_IMG = `${BASE}/achivements/achivements-cover-2.jpg`; // Postignuća cover
	const SPONSORS_IMG = `${BASE}/achivements/sponsors-cover.jpg`; // Sponzori cover

	const SECTIONS = [
		{ key: 'nav.history', href: '/klub/povijest', image: LATEST_CHAPTER_IMG },
		{ key: 'nav.identity', href: '/klub/identitet', image: OLYMPIC_IMG },
		{ key: 'nav.achievements', href: '/postignuca', image: ACHIEVEMENTS_IMG },
		{ key: 'nav.sponsors', href: '/sponzori', image: SPONSORS_IMG }
	];

	// Optional content rendered at the TOP of the golden band, above the explore row
	// (e.g. the Momčad page injects a news roster here).
	let { top }: { top?: import('svelte').Snippet } = $props();

	// Active locale (cookie-driven, from the root layout load).
	const locale = $derived(page.data.locale);
</script>

<section class="explore" aria-label={t(locale, 'explore.aria')}>
	{#if top}
		<div class="explore-top">{@render top()}</div>
	{/if}

	<h2 class="explore-heading"><strong>{t(locale, 'explore.headStrong')}</strong> {t(locale, 'explore.headRest')}</h2>

	<div class="explore-row">
		<span class="explore-line left" aria-hidden="true"></span>

		{#each SECTIONS as s (s.href)}
			<a class="explore-card" href={s.href}>
				<img class="explore-card-img" src={s.image} alt="" loading="lazy" />
				<span class="explore-card-scrim" aria-hidden="true"></span>
				<span class="explore-card-label">{t(locale, s.key)}</span>
			</a>
		{/each}

		<span class="explore-line right" aria-hidden="true"></span>
	</div>
</section>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;

	// Gold→navy fade band (mirrors the history chapter's related section, incl. its
	// tall bottom padding so the height matches).
	.explore {
		position: relative;
		padding: ($sp * 4) $sp ($sp * 20);
		background: linear-gradient(to bottom, #f2ca46 0%, var(--color-footer) 85%);
	}

	// Heading — same style as the chapter's "POVEZANO S OVIM ČLANKOM": light text,
	// first word ("MOŽDA") bolded via <strong>, white, uppercase, centred.
	.explore-heading {
		margin: 0 0 ($sp * 2.5);
		text-align: center;
		color: $white;
		font-size: 1.6rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		strong {
			font-weight: 800;
		}
	}

	// The row: 4 cards flanked by white lines. The gap between the lines and the
	// card row ($line-gap) is GREATER than the gap between the cards ($card-gap).
	$card-gap: $sp * 1.75; // gap between cards
	$line-gap: $sp * 2.5; // gap between each line and the card row (still > card gap)
	.explore-row {
		display: flex;
		align-items: center;
		gap: $card-gap;
		max-width: 1700px;
		margin: 0 auto;
	}
	.explore-line {
		flex: 0 1 auto; // don't grow — fixed length; cards take the remaining width
		width: 220px; // line length
		height: 1.5px; // thin lines
		background: $white;
	}
	.explore-line.left {
		margin-right: calc(#{$line-gap} - #{$card-gap}); // extra gap beyond the row gap
	}
	.explore-line.right {
		margin-left: calc(#{$line-gap} - #{$card-gap});
	}

	// Card: LANDSCAPE cover photo (wider than tall) with the section name overlaid;
	// hover darkens + emphasises.
	.explore-card {
		flex: 1 1 0; // share the row width equally
		max-width: 480px; // bigger cards
		aspect-ratio: 5 / 3; // longer than tall
		position: relative;
		overflow: hidden;
		border-radius: 12px;
		text-decoration: none;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
	}
	.explore-card-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s ease;
	}
	// Dark scrim (modal-backdrop style) — light by default, darkens on hover.
	.explore-card-scrim {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.25);
		transition: background-color 0.3s ease;
	}
	.explore-card-label {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 $sp;
		text-align: center;
		color: $white;
		font-size: clamp(1.5rem, 2.6vw, 2.1rem); /* larger card labels */
		font-weight: 700;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
		transition:
			transform 0.3s ease,
			letter-spacing 0.3s ease;
	}
	.explore-card:hover {
		.explore-card-scrim {
			background: rgba(0, 0, 0, 0.6); // darken like a modal backdrop
		}
		.explore-card-img {
			transform: scale(1.05);
		}
		.explore-card-label {
			transform: scale(1.06); // emphasise the name
			letter-spacing: 0.05em;
		}
	}

	// PHONE: the 4 cards become ONE edge-to-edge strip — no gaps, no rounding, the
	// row spans the full viewport width (cancelling the section's side padding), and
	// each card is a PARALLELOGRAM: angled left/right edges via clip-path, with the
	// adjacent slants overlapped (negative margin) so a thin angled divider shows
	// between images. The first card's LEFT edge and last card's RIGHT edge stay
	// vertical so the strip butts cleanly against the screen sides.
	@media (max-width: 720px) {
		$slant: 26px; // vertical offset of the angled (parallelogram) top/bottom edges
		// Phone: stack the 4 options as a VERTICAL column of wide parallelogram cards.
		// They touch with NO gap (overlapped by the slant so the angled edges interlock);
		// the column is inset from the screen sides with side padding.
		.explore-row {
			flex-direction: column;
			flex-wrap: nowrap;
			gap: 0; // cards touch (overlapped via negative margin below)
			max-width: none;
			width: auto;
			margin-inline: ($sp * 1.5); // padding from the left/right screen sides
		}
		.explore-line {
			display: none; // no flanking lines in the column
		}
		// More space between the "MOŽDA ĆE VAM SE SVIDJETI" heading and the cards.
		.explore-heading {
			margin-bottom: ($sp * 4);
		}
		.explore-card {
			flex: 0 0 auto;
			width: 100%;
			max-width: none;
			aspect-ratio: 16 / 7; // wide, short banners stacked vertically
			border-radius: 0;
			box-shadow: none;
			// Parallelogram: slanted TOP + BOTTOM edges. Adjacent cards overlap by the
			// slant (negative top margin) so their angled edges interlock with no gap.
			clip-path: polygon(0 #{$slant}, 100% 0, 100% calc(100% - #{$slant}), 0 100%);
			margin-top: (-$slant);
			&:first-child {
				// Top edge FLAT so the column starts with a clean horizontal edge.
				clip-path: polygon(0 0, 100% 0, 100% calc(100% - #{$slant}), 0 100%);
				margin-top: 0;
			}
			&:last-child {
				// Bottom edge FLAT so the column ends with a clean horizontal edge.
				clip-path: polygon(0 #{$slant}, 100% 0, 100% 100%, 0 100%);
			}
		}
		// Lower the cover image a touch within each banner (show a lower slice).
		.explore-card-img {
			object-position: center 68%;
		}
		.explore-card-label {
			font-size: 1.4rem; // larger name now the banners are full width
		}
	}
</style>
