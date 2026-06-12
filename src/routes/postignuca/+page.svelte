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
		margin: ($sp * 8) 0 ($sp * 1.5);
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
	// On narrow screens, stack image-over-text (no zig-zag); image always first.
	@media (max-width: 680px) {
		.honour {
			grid-template-columns: 1fr;
			gap: ($sp * 1.25);
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
		.honour-media {
			aspect-ratio: 16 / 9;
		}
		.honour-num,
		.honour-title {
			font-size: 1.5rem;
		}
		.ach-hero-title {
			font-size: 2.6rem;
		}
	}
</style>
