<script lang="ts">
	// Momčad (team roster) — FC Barcelona-style layout: a filter bar of bow-type
	// categories above a grid of Real-Madrid-style cards. Selecting a bow shows only
	// that group; "Svi" shows everyone. Data from `GET /team` (ordered by `order`).
	import type { ArcherCard, Bow } from 'archery-contracts';
	import RosterCard from '$lib/components/RosterCard.svelte';
	import NewsRoster from '$lib/components/NewsRoster.svelte';
	import Flourish from '$lib/components/Flourish.svelte';
	import ArcheryArrowIcon from '$lib/components/icons/ArcheryArrowIcon.svelte';
	import {
		BOW_LABEL,
		BOW_ORDER,
		BOW_LEFT,
		FIG_SCALE,
		PHONE_SCALE,
		PHONE_BOW_X,
		PHONE_BOW_Y,
		PHONE_BOW_SCALE,
		FIG_OFFSET,
		BOW_NUDGE
	} from '$lib/archer';
	import type { ArticleCard } from 'archery-contracts';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { data } = $props();
	const roster = $derived((data.roster ?? []) as ArcherCard[]);
	const articles = $derived((data.articles ?? []) as ArticleCard[]);

	// Per-archer card tuning (FIG_SCALE / PHONE_SCALE / PHONE_BOW_* / FIG_OFFSET / BOW_NUDGE)
	// now lives in $lib/archer.ts so the SAME values drive the archer page's coach/student
	// RosterCards — one source of truth, cards match everywhere. (Imported above.)

	// Faded club crest watermark (Real-Madrid style) on the hero's right side.
	const LOGO_URL =
		'https://images.axlothecook.com/archery/identity/vsk-logo.png';

	// Hero arrow field: a grid of archery arrows that pulse in a diagonal WAVE (blue →
	// gold). Each arrow's animation-delay is its (row + col) so the colour sweep
	// travels across the grid like a wave. Arrows point to the TOP-LEFT.
	// Column count is RESPONSIVE: 14 on desktop, fewer on phones so the field doesn't
	// read as a cluttered wall of tiny arrows. Always 3 rows. `arrowCols` tracks a
	// media query so the count (and the matching CSS grid-template) stay in sync.
	const ARROW_ROWS = 3;
	let arrowCols = $state(14);
	$effect(() => {
		const phone = window.matchMedia('(max-width: 720px)');
		const set = () => (arrowCols = phone.matches ? 7 : 14);
		set();
		phone.addEventListener('change', set);
		return () => phone.removeEventListener('change', set);
	});
	const arrows = $derived(
		Array.from({ length: arrowCols * ARROW_ROWS }, (_, i) => ({
			row: Math.floor(i / arrowCols),
			col: i % arrowCols
		}))
	);

	// Filter options. 'all' first, then each bow that actually has archers, then the
	// coaches (anyone with the 'coach' role).
	type FilterKey = 'all' | Bow | 'coaches';
	const isCoach = (a: ArcherCard) => a.roles?.includes('coach');
	const filters = $derived.by<{ key: FilterKey; label: string }[]>(() => {
		const out: { key: FilterKey; label: string }[] = [{ key: 'all', label: 'Svi' }];
		for (const bow of BOW_ORDER) {
			if (roster.some((a) => a.bowType[0] === bow)) out.push({ key: bow, label: BOW_LABEL[bow] });
		}
		if (roster.some(isCoach)) out.push({ key: 'coaches', label: 'Treneri' });
		return out;
	});

	let active = $state<FilterKey>('all');

	// ── Filter-state restore ─────────────────────────────────────────────────────
	// Preserve the active bow filter when leaving the roster (e.g. opening an archer)
	// so BACK-navigation re-renders the SAME filtered grid. SvelteKit's native scroll
	// restoration then lands the user exactly where they were; without this the filter
	// would reset to 'all', changing the grid height so the saved offset mislands.
	export const snapshot = {
		capture: () => active,
		restore: (snap: FilterKey) => {
			active = snap;
		}
	};

	// Per-archer card tuning (FIG_SCALE / PHONE_SCALE / PHONE_BOW_* / FIG_OFFSET / BOW_NUDGE)
	// lives in $lib/archer so the SAME values drive the archer profile's coaches / "Trenira"
	// card rows — one source of truth, cards match everywhere.

	// Visible archers for the active filter, preserving roster order.
	const shown = $derived.by(() => {
		if (active === 'all') return roster;
		if (active === 'coaches') return roster.filter(isCoach);
		return roster.filter((a) => a.bowType[0] === active);
	});

</script>

<svelte:head>
	<title>Momčad | Varaždinski streličarski klub</title>
</svelte:head>

<div class="team">
	<!-- ── Hero band: arrow wave field + faded club crest watermark (right) ──── -->
	<header class="tm-hero">
		<div class="tm-arrows" aria-hidden="true">
			{#each arrows as a (a.row + '-' + a.col)}
				<span class="tm-arrow" style="--d:{(a.row + a.col) * 0.12}s">
					<ArcheryArrowIcon size={32} />
				</span>
			{/each}
		</div>
		<img class="tm-hero-logo" src={LOGO_URL} alt="" aria-hidden="true" />
	</header>

	<!-- ── Heading block: title + year (tight), left-aligned ── -->
	<div class="tm-head">
		<h2 class="tm-head-title">Momčad</h2>
		<p class="tm-head-year">2025/26</p>
	</div>

	<!-- ── Two-column body: VERTICAL sticky filter rail (left) + card grid (right) ── -->
	<div class="tm-content">
		{#if shown.length === 0}
			<p class="tm-empty">Popis članova uskoro će biti dostupan.</p>
		{:else}
			<div class="tm-body">
				<!-- Vertical filter rail: horizontal words stacked in a column, a vertical grey
				     line beside them, blue highlight on the line marks the active filter. -->
				<nav class="tm-filters" aria-label="Filtriraj po luku">
					{#each filters as f (f.key)}
						<button
							class="tm-filter"
							class:active={active === f.key}
							type="button"
							onclick={() => (active = f.key)}
						>
							{f.label}
						</button>
					{/each}
				</nav>

				<!-- "International call-ups" grid: wide rectangular cards on a cornflower bg;
				     heads stick out the top, hover grows the card + reveals the name. -->
				<ul class="tm-grid">
					{#each shown as a, i (a.slug)}
						<li
							style="--i:{i};{FIG_SCALE[a.slug] ? `--fig-scale:${FIG_SCALE[a.slug]};` : ''}{PHONE_SCALE[
								a.slug
							]
								? `--phone-scale:${PHONE_SCALE[a.slug]};`
								: ''}{PHONE_BOW_X[a.slug] ? `--phone-bow-x:${PHONE_BOW_X[a.slug]};` : ''}{PHONE_BOW_Y[a.slug]
								? `--phone-bow-y:${PHONE_BOW_Y[a.slug]};`
								: ''}{PHONE_BOW_SCALE[a.slug]
								? `--phone-bow-scale:${PHONE_BOW_SCALE[a.slug]};`
								: ''}{FIG_OFFSET[a.slug]
								? `--photo-nudge:${FIG_OFFSET[a.slug]};`
								: ''}{BOW_NUDGE[a.slug] ? `--bow-nudge:${BOW_NUDGE[a.slug]};` : ''}"
							animate:flip={{ duration: 380, easing: cubicOut }}
							in:fly={{ x: 80, duration: 320, delay: 140, easing: cubicOut }}
							out:fly={{ x: -80, duration: 200, easing: cubicOut }}
						>
							<RosterCard
									archer={a}
									bowLeft={BOW_LEFT.has(a.slug)}
									flushLetters={a.slug === 'filip-bistricic'}
								/>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="tm-flourish"><Flourish /></div>
	</div>

	<NewsRoster {articles} />
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$ink: map.get(lib.$colors, 'deep-sapphire');
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;

	.team {
		width: 100%;
		background-color: $white; // white page background (per request)
		color: $ink;
	}

	// ── Hero band: arrow wave field + faded crest watermark ────────────────────
	.tm-hero {
		position: relative;
		height: 20rem;
		overflow: hidden;
		background: $white;
	}
	// Faded club crest on the RIGHT (Real-Madrid watermark style): barely visible,
	// desaturated.
	.tm-hero-logo {
		position: absolute;
		right: 4%;
		top: 50%;
		transform: translateY(-50%);
		height: 130%;
		width: auto;
		opacity: 0.06;
		filter: grayscale(1);
		pointer-events: none;
		user-select: none;
	}
	// The arrow field: a grid of arrows pointing TOP-LEFT, pulsing blue→gold in a
	// diagonal wave (per-arrow animation-delay set inline as --d).
	.tm-arrows {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(14, 1fr);
		grid-auto-rows: 1fr;
		place-items: center;
		padding: ($sp * 1.5) ($sp * 2);
	}
	.tm-arrow {
		display: inline-flex;
		// Glyph points DOWN; rotate so it aims to the TOP-LEFT (north-west).
		transform: rotate(135deg);
		color: #4d86ff; // default blue (loader blue)
		animation: arrow-wave 2.4s ease-in-out infinite;
		animation-delay: var(--d);
	}
	// Wave: most of the cycle is the default blue; a brief gold crest sweeps through
	// (staggered by --d so it travels like a wave).
	@keyframes arrow-wave {
		0%,
		70%,
		100% {
			color: #4d86ff;
			opacity: 0.5;
		}
		15% {
			color: #ffd24a; // gold crest (loader gold)
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tm-arrow {
			animation: none;
			opacity: 0.5;
		}
	}
	// ── Heading block (Barça-style): title + year + filter tabs, left-aligned ──
	.tm-head {
		width: 90%;
		max-width: 1500px;
		margin: 0 auto;
		padding: ($sp * 2) 0 ($sp * 1.5);
		text-align: left;
	}
	.tm-head-title {
		margin: 0;
		color: $ink;
		font-size: 3.6rem;
		font-weight: 800;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		line-height: 1;
	}
	.tm-head-year {
		margin: ($sp * 0.4) 0 0; // tight under the title
		color: $ink;
		font-size: 1.5rem;
		font-weight: 800;
	}

	// ── VERTICAL filter rail (left of the grid) ──────────────────────────────────
	// Horizontal words stacked in a column; a vertical grey line runs to their LEFT,
	// with a blue segment on that line marking the active filter.
	$blue: map.get(lib.$colors, 'blue-dress');
	.tm-filters {
		position: sticky;
		top: 6rem; // stays visible while the grid scrolls (below the fixed navbar)
		align-self: start; // don't stretch to the grid's full height
		// Start the rail at the same height as the first card row (the grid's padding-top).
		margin-top: 9.5rem;
		display: flex;
		flex-direction: column;
		gap: ($sp * 1.5);
		// The grey vertical line sits on the LEFT edge; the blue active highlight rides it.
		border-left: 2px solid rgba(0, 0, 0, 0.12);
		padding-left: ($sp * 1.25);
		box-shadow: none; // kill the lib's global nav box-shadow on this white page
	}
	.tm-filter {
		position: relative;
		padding: ($sp * 0.4) 0;
		font: inherit;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: 0.85rem;
		white-space: nowrap;
		text-align: left;
		color: map.get(lib.$colors, 'jet-grey');
		background: none;
		border: none;
		cursor: pointer;
		transition: color 0.18s ease;
		// Active highlight: a blue segment on the vertical grey line (the rail's left edge).
		&::before {
			content: '';
			position: absolute;
			left: calc(-1 * #{$sp * 1.25} - 2px); // sit on the rail's border-left line
			top: 0;
			bottom: 0;
			width: 3px;
			background: $blue;
			transform: scaleY(0);
			transform-origin: center;
			transition: transform 0.18s ease;
		}
		&:hover {
			color: $ink;
		}
		&.active {
			color: $ink;
			&::before {
				transform: scaleY(1);
			}
		}
	}

	// ── Content / grid ──────────────────────────────────────────────────────────
	.tm-content {
		width: 90%;
		max-width: 1500px;
		margin: 0 auto;
		padding-bottom: 0;
	}
	// Two-column body: vertical filter rail (auto width) + grid (rest).
	.tm-body {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: ($sp * 2.5);
		// Pull the whole body UP toward the header (the header has its own bottom padding).
		margin-top: ($sp * -0.5);
	}
	.tm-empty {
		color: map.get(lib.$colors, 'jet-grey');
		text-align: center;
		font-weight: 300;
	}
	// ── "International call-ups" grid: 4-up, NO gap; heads stick out the top. ────────
	// CHECKERBOARD colours: odd rows → odd cards SUNFLOWER, even cards SAPPHIRE; even
	// rows flipped. Over a 4-col grid that's an 8-cell cycle: cells 1,3,6,8 = sunflower,
	// 2,4,5,7 = sapphire (set via --card-bg on each <li>).
	$sapphire: map.get(lib.$colors, 'primary');
	$sunflower: map.get(lib.$colors, 'cornflower'); // checkerboard accent (cornflower)
	.tm-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr); // 4 per row (wider cards)
		gap: 0; // cards butt together (no space)
		// Headroom so the HOVER-GROWN row-1 cards (they grow ~12rem upward) don't reach up
		// and cover the MOMČAD / year header text above.
		padding-top: 9.5rem;
	}
	.tm-grid > li {
		position: relative;
		--card-bg: #{$sapphire}; // default; sunflower cells overridden below
	}
	// Sunflower cells of the 8-cell checkerboard cycle (row1: Y S Y S, row2: S Y S Y).
	.tm-grid > li:nth-child(8n + 1),
	.tm-grid > li:nth-child(8n + 3),
	.tm-grid > li:nth-child(8n + 6),
	.tm-grid > li:nth-child(8n + 8) {
		--card-bg: #{$sunflower};
	}

	.tm-flourish {
		// Equal breathing room above (from the cards) and below (to the news div).
		// tm-content has no bottom padding and the news div no top padding, so these
		// margins alone set the gap on each side.
		margin: ($sp * 6) 0;
		// Flourish art is built for dark backgrounds; on white, dim it slightly.
		opacity: 0.85;
	}

	// ── Responsive ────────────────────────────────────────────────────────────────
	// Tablet: 3-up grid; the vertical rail stays but the header gets a touch tighter.
	@media (max-width: 1024px) {
		.tm-grid {
			grid-template-columns: repeat(3, 1fr);
			padding-top: 8rem;
		}
		.tm-head-title {
			font-size: 3rem;
		}
	}

	// Phone: stack the body — the filter rail becomes a HORIZONTAL scrollable bar ABOVE
	// the grid (no more left rail / vertical line), and the grid drops to 2-up. The big
	// hover-grow headroom isn't needed (touch has no hover), so the grid sits tighter.
	@media (max-width: 720px) {
		// Shorter cover band on phone (was 14rem). Since the arrow grid fills the hero
		// (inset:0, grid-auto-rows:1fr), a shorter hero also tightens the gap between the
		// 3 arrow rows.
		.tm-hero {
			height: 9rem;
		}
		// 7 columns on phone (matches `arrowCols` in the script) → 21 arrows in 3 rows,
		// each bigger and less cluttered than the 14-col desktop wall. Trim the side
		// padding so the field fills the band edge-to-edge.
		.tm-arrows {
			grid-template-columns: repeat(7, 1fr);
			padding: ($sp * 1) ($sp * 0.75);
		}
		.tm-arrow :global(svg) {
			width: 1.4rem;
			height: 1.4rem;
		}
		.tm-head {
			width: 92%;
			// Pull the title up tight under the (now shorter) cover band — trim the
			// desktop top padding ($sp*2) right down on phone.
			padding-top: ($sp * 0.5);
		}
		.tm-head-title {
			font-size: 2.4rem;
		}
		.tm-content {
			width: 92%;
			// More breathing room between the title block (Momčad / 2025/26) and the
			// filter bar below it.
			margin-top: ($sp * 2.25);
		}
		.tm-body {
			grid-template-columns: 1fr; // single column: rail on top, grid below
			row-gap: ($sp * 1.5);
			margin-top: 0; // drop the desktop pull-up so the gap above the bar holds
		}
		.tm-filters {
			position: static; // not sticky on phone
			margin-top: 0;
			flex-direction: row;
			flex-wrap: nowrap; // keep all 5 filters on ONE row
			justify-content: space-between;
			align-self: stretch;
			gap: ($sp * 0.6);
			border-left: none; // drop the vertical line
			padding-left: 0;
			// Horizontal underline beneath the filters instead of the side line.
			border-bottom: 1px solid rgba(0, 0, 0, 0.12);
			padding-bottom: ($sp * 0.75);
		}
		.tm-filter {
			padding: ($sp * 0.3) 0;
			// Sized so all 5 labels still fit ONE row on a narrow phone (~412px).
			font-size: 0.84rem;
			letter-spacing: -0.01em;
			// Move the active highlight to a bottom bar (horizontal) for the row layout.
			&::before {
				left: 0;
				right: 0;
				top: auto;
				bottom: calc(-1 * #{$sp * 0.75} - 1px);
				width: auto;
				height: 3px;
				transform: scaleX(0);
				transform-origin: left;
			}
			&.active::before {
				transform: scaleX(1);
			}
		}
		// PSG-style phone roster: 2 per row with a GAP between cards (the desktop
		// checkerboard butts cards edge-to-edge with gap:0; here each card is a standalone
		// box + text below, so they need breathing room).
		.tm-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: ($sp * 1.5) ($sp * 1.25);
			padding-top: 0; // no hover-grow headroom needed on touch
			// Clip the filter-change fly-in/out: cards translate ±80px horizontally during the
			// transition, and with no clip they render OVER the filter rail / adjacent content
			// instead of sliding in from behind the grid edge. (Safe on phone — no hover-grow
			// that needs to poke above the grid, unlike desktop.)
			overflow: hidden;
		}
		// 2-up DIAGONAL checkerboard: each row starts with the previous row's RIGHT colour.
		// Row1: cornflower · red, Row2: red · cornflower, Row3: cornflower · red …
		// Over 2 cols that's a 4-cell cycle: cells 1,4 = cornflower; 2,3 = red.
		// Reset the desktop 8n pattern first, then apply the 4-cell one.
		.tm-grid > li,
		.tm-grid > li:nth-child(8n + 1),
		.tm-grid > li:nth-child(8n + 3),
		.tm-grid > li:nth-child(8n + 6),
		.tm-grid > li:nth-child(8n + 8) {
			--card-bg: #{$sapphire}; // red default
		}
		.tm-grid > li:nth-child(4n + 1),
		.tm-grid > li:nth-child(4n + 4) {
			--card-bg: #{$sunflower}; // cornflower
		}
	}
</style>
