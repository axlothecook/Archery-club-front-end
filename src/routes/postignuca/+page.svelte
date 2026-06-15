<script lang="ts">
	import SectionExplore from '$lib/components/SectionExplore.svelte';
	import Flourish from '$lib/components/Flourish.svelte';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import type { AchievementGroup } from './+page.ts';

	let { data } = $props();

	// Honour cards come stacked-by-title and sorted by count (desc) from the
	// backend. We re-order them by PRESTIGE TIER for the listing: global (world)
	// first, then European, then domestic (state), then anything else. Within a
	// tier the backend's count-desc order is preserved (stable sort).
	const TIER_RANK: Record<AchievementGroup['level'], number> = {
		world: 0,
		european: 1,
		state: 2,
		other: 3
	};
	const groups = $derived(
		[...((data.groups ?? []) as AchievementGroup[])].sort(
			(a, b) => TIER_RANK[a.level] - TIER_RANK[b.level]
		)
	);

	const HERO_IMAGE =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/achivements/achivements-cover-2.jpg';

	let heroLoaded = $state(false);

	// "2025 · 2023 · 2021" — the winning years on one line beneath the title
	// (middot separator, PSG-style).
	const yearsLine = (years: number[]) => years.join(' · ');
</script>

<div class="achievements">
	<!-- Hero: poster image (fades in) with the gold section title overlaid. -->
	<header class="ach-hero">
		<img
			class="ach-hero-img"
			class:loaded={heroLoaded}
			src={HERO_IMAGE}
			alt=""
			onload={() => (heroLoaded = true)}
		/>
		<div class="ach-hero-overlay"></div>
		<h1 class="ach-hero-title">Postignuća</h1>
	</header>

	<!-- Intro blurb (PSG "Honours" style): a gold heading + a short pride paragraph
	     summarising the club's standout titles, sitting between the cover and the list. -->
	<section class="ach-intro">
		<p class="ach-intro-text">
			Malo je klubova u Hrvatskoj koji su osvojili toliko naslova. Najveći ponos kluba
			ostaju 6 svjetskih i 8 europskih naslova, među kojima se ističu obranjeno svjetsko
			juniorsko zlato (2019. i 2021.), tri uzastopne pobjede na Conquest Cupu
			(od 2024. do 2026.) te tri naslova u Indoor World Seriesu.
		</p>
	</section>

	<!-- White card (matches the Povijest card width). PSG-style honour list. -->
	<div class="ach-content">
		{#if groups.length === 0}
			<p class="ach-empty">Postignuća će uskoro biti dostupna.</p>
		{:else}
			<!-- PSG-style: each honour is a two-column row — a large image on one side
			     and the text (count × title + years) on the other, vertically centred.
			     Rows ALTERNATE: image-left/text-right, then text-left/image-right. -->
			<ul class="ach-list">
				{#each groups as g (g.title)}
					<li class="honour">
						<div class="honour-media">
							<!-- Guard: an achievement may have no image (e.g. a title with no medal
							     and no custom photo → stock icon resolves to null). Render the row
							     without an image rather than crashing the whole page. -->
							{#if g.image}
								<ImageWithLoader src={g.image.url} alt={g.image.alt} />
							{/if}
						</div>
						<div class="honour-head">
							<h2 class="honour-heading" data-medal={g.medal ?? 'none'}>
								<span class="honour-num">{g.count}</span><span class="honour-times">×</span>
								<span class="honour-title">{g.title}</span>
							</h2>
							{#if g.years.length > 0}
								<p class="honour-years">{yearsLine(g.years)}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}

		<!-- End-of-card flourish: VSK crest + fanning gold lines (same as the
		     chapter article), just before the golden explore block. -->
		<div class="ach-flourish"><Flourish /></div>
	</div>

	<!-- Golden "explore the club" block, continuing the white card's bottom edge. -->
	<SectionExplore />
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire'); // #102E66
	$gold: map.get(lib.$colors, 'macaroni-and-cheese'); // #efb52f
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;

	// Page background = the sponsors/social cap colour (rule: cap matches page).
	$page-bg: var(--color-footer);

	.achievements {
		width: 100%;
		background-color: $page-bg;
	}

	// ── Hero ──────────────────────────────────────────────────────────────────
	.ach-hero {
		position: relative;
		min-height: 600px; // match the Sponzori hero cover size
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.ach-hero-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 80%; // show the LOWER part of the cover photo
		opacity: 0;
		transition: opacity 0.8s ease;
		&.loaded {
			opacity: 1;
		}
	}
	.ach-hero-overlay {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
			to bottom,
			color.change($navy, $alpha: 0.35) 0%,
			color.change($navy, $alpha: 0.45) 55%,
			$page-bg 100%
		);
	}
	.ach-hero-title {
		position: relative;
		margin: 0;
		color: $gold;
		font-size: 4rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	// ── Intro blurb (PSG "Honours" style) ───────────────────────────────────────
	// Centred gold heading + a short, comfortably-narrow pride paragraph beneath the
	// cover, before the honour list. Muted light text reads on the dark page bg.
	.ach-intro {
		max-width: 1040px; // wider so the paragraph wraps over fewer rows
		margin: 0 auto;
		padding: ($sp * 5) ($sp * 2) ($sp * 2);
		text-align: center;
	}
	.ach-intro-text {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 300;
		line-height: 1.7;
		color: #ccc;
	}

	// ── Content surface ───────────────────────────────────────────────────────
	// TRANSPARENT content area (no visible card) — the dark page background shows
	// through; the honour rows sit directly on it. Constrained to 85% width with
	// wide side padding so the images keep meeting at the centreline.
	.ach-content {
		width: 85%;
		margin: 0 auto;
		background-color: transparent;
		padding: 4.5rem 8rem 3rem;
	}
	// The golden explore block spans the FULL viewport width (matching the
	// individual chapter page's golden "related" block).
	:global(.achievements .explore) {
		width: 100%;
		margin: 0;
		border-radius: 0;
	}

	.ach-empty {
		text-align: center;
		font-weight: 300;
		color: map.get(lib.$colors, 'jet-grey');
	}

	// End-of-card flourish: generous top space from the last honour, small bottom
	// gap before the golden block (mirrors the chapter article's flourish spacing).
	.ach-flourish {
		// Bottom gap +2rem (1.5rem → 3.5rem) for more space before the golden block on
		// desktop. (Phone has its own margin-bottom override below.)
		margin: ($sp * 8) 0 ($sp * 3.5);
	}

	// ── Honour list (PSG style) ───────────────────────────────────────────────
	// Each honour is a two-column row: a large image on one side and the text
	// (count × title + years) on the other, vertically centred. Rows ALTERNATE
	// sides (image-left/text-right → text-left/image-right) for the PSG zig-zag.
	.ach-list {
		list-style: none;
		margin: 0;
		padding: 0;
		// Full card width — honour images use the whole card so they can reach the
		// outer corners; the text column carries its own inner padding.
	}

	.honour {
		display: grid;
		grid-template-columns: 1fr 1fr; // equal halves; images meet at the centreline
		align-items: center;
		column-gap: 0; // image butts the centreline (PSG); outer whitespace via width
		row-gap: 0; // honours sit flush against each other

		// Default (odd) row: image LEFT column, text RIGHT. The capped-width image
		// hugs the inner (right) edge of its column so it sits near the text, with
		// whitespace on the outer (left) edge — the PSG look.
		.honour-media {
			justify-self: end;
		}
		.honour-head {
			justify-self: start;
		}

		// Alternate: on every SECOND honour, swap sides (zig-zag). DOM order is
		// image-then-text, so we flip which grid column each lands in, and flip the
		// inner-edge alignment to match.
		&:nth-child(even) {
			.honour-media {
				grid-column: 2;
				grid-row: 1;
				justify-self: start;
			}
			.honour-head {
				grid-column: 1;
				grid-row: 1;
				justify-self: end;
				text-align: right;
			}
		}
	}

	// Image: a 3:2 rectangle that fills ~2/3 of its half (PSG-measured: ~634px of
	// a ~952px half). It butts against the row centreline (the text side) via the
	// column's justify-self, leaving whitespace on the OUTER edge — the PSG look.
	.honour-media {
		width: 100%; // fills its half up to the centreline (card padding gives the outer whitespace)
		aspect-ratio: 3 / 2; // PSG-measured 634×423
		overflow: hidden;
		background-color: map.get(lib.$colors, 'white-smoke');
	}

	// Text block: "N× TITLE" heading (bold italic uppercase, PSG-style) + years.
	// Inner padding gives breathing room from the image (which sits on the
	// centreline) and the outer card edge.
	.honour-head {
		padding: 0 ($sp * 2);
	}
	// The whole heading — count, ×, and title — is one WHITE colour (reads on the
	// dark transparent page background).
	.honour-heading {
		margin: 0;
		display: inline;
		line-height: 1.15;
		font-style: italic;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.01em;
		color: $white;
	}
	.honour-num {
		font-size: 1.9rem;
		font-weight: 800;
	}
	.honour-times {
		margin-right: 0.3em;
		font-size: 1.4rem;
		font-weight: 700;
	}
	.honour-title {
		font-size: 1.9rem;
		font-weight: 800;
	}
	.honour-years {
		margin: ($sp * 1.25) 0 0;
		font-size: 1.05rem;
		font-weight: 400;
		letter-spacing: 0.02em;
		// Roomy line spacing so that when many years wrap onto multiple lines
		// (e.g. the 12-year Prvenstvo Hrvatske / Državni rekord spans) the wrapped
		// rows don't look cramped.
		line-height: 1.75;
		color: #ccc; // muted light grey on the dark page background
	}

	// ── Responsive ────────────────────────────────────────────────────────────
	@media (max-width: 1024px) {
		.ach-content {
			width: 92%;
		}
		:global(.achievements .explore) {
			width: 92%;
		}
	}
	// On narrow screens, stack image-over-text (no zig-zag); image always first, and
	// both image + text run FULL WIDTH centred (reset the desktop zig-zag justify-self
	// that otherwise leaves the stacked blocks indented to one side).
	@media (max-width: 680px) {
		// Full-width content; vertical padding only — the carousel handles its own side
		// gutters via scroll-padding so the snapped card clears the screen edges.
		.ach-content {
			width: 100%;
			padding: 3rem 0 2rem;
		}
		// PHONE: the honour list becomes a horizontal SWIPE carousel — one card per slide,
		// scroll-snap so each settles centred, with the next card peeking to hint the swipe.
		// scroll-padding + the track's leading/trailing space keep cards off the screen edges.
		.ach-list {
			display: flex;
			align-items: start; // every card pins to the same top → photos line up across slides
			gap: 1rem;
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			scroll-padding: 0 1.25rem; // snapped card aligns with this left/right gutter
			padding: 0 1.25rem; // leading/trailing space so the first/last card has a gutter
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none; // hide the scrollbar (Firefox)
			&::-webkit-scrollbar {
				display: none; // hide the scrollbar (WebKit)
			}
		}
		.honour {
			flex: 0 0 92%; // each slide ~92vw (bigger photo); next card still peeks a little
			grid-template-columns: 1fr;
			gap: ($sp * 1); // title sits just beneath the photo, with a touch of breathing room
			scroll-snap-align: start;
			scroll-snap-stop: always; // a flick advances at most ONE card, never skips past
			// reset the even-row swap so the image always sits on top
			&:nth-child(even) {
				.honour-media {
					grid-column: 1;
					grid-row: 1;
				}
				.honour-head {
					grid-column: 1;
					grid-row: 2;
				}
			}
		}
		// Full-width, centred stacking (override the desktop end/start justify-self on
		// BOTH the odd rows and the even-row swap).
		.honour .honour-media,
		.honour:nth-child(even) .honour-media {
			justify-self: stretch;
		}
		.honour .honour-head,
		.honour:nth-child(even) .honour-head {
			justify-self: stretch;
			padding: 0; // the track gutter already insets the card; keep title flush to photo
			text-align: left; // title + years share the same left edge
		}
		// Years: bigger + pulled closer under the title (left-aligned with it via the head).
		.honour-years {
			margin-top: ($sp * 0.5);
			font-size: 1.15rem;
		}
		.honour-media {
			aspect-ratio: 4 / 3; // taller crop → a bigger photo on the swipe card
		}
		.honour-num,
		.honour-title {
			font-size: 1.5rem;
		}
		.ach-hero-title {
			font-size: 2.6rem;
		}
		// Restore the golden explore block to FULL viewport width on phones (the
		// 1024px tablet rule above shrinks it to 92%, which left a side gap and stopped
		// the edge-to-edge parallelogram strip from reaching the screen edges).
		:global(.achievements .explore) {
			width: 100%;
		}
		// More breathing room between the end flourish (crest) and the golden block.
		.ach-flourish {
			margin-bottom: ($sp * 5);
		}
		// Smaller intro paragraph on phones (the desktop 1.15rem reads oversized here).
		.ach-intro {
			padding: ($sp * 3) ($sp * 1.5) ($sp * 1.5);
		}
		.ach-intro-text {
			font-size: 0.95rem;
			line-height: 1.6;
		}
		// PHONE ONLY: shrink the cover to a slim band (~30rem shorter than desktop) so
		// less vertical space is wasted before the honour list.
		.ach-hero {
			min-height: 180px;
		}
		// Scale the photo by WIDTH so the full horizontal field of view shows, letting
		// the extra height overflow the short band (clipped by .ach-hero overflow:hidden).
		// min-height:100% keeps it covering the band with no gaps; the translate centres
		// it. Fits MORE of the scene than object-fit:cover would in such a short band.
		.ach-hero-img {
			inset: auto;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
			height: auto;
			min-height: 100%;
		}
	}
</style>
