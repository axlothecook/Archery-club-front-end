<script lang="ts">
	// Momčad (team roster) — FC Barcelona-style layout: a filter bar of bow-type
	// categories above a grid of Real-Madrid-style cards. Selecting a bow shows only
	// that group; "Svi" shows everyone. Data from `GET /team` (ordered by `order`).
	import type { ArcherCard, Bow } from 'archery-contracts';
	import ArcherCardComp from '$lib/components/ArcherCard.svelte';
	import NewsRoster from '$lib/components/NewsRoster.svelte';
	import Flourish from '$lib/components/Flourish.svelte';
	import ArcheryArrowIcon from '$lib/components/icons/ArcheryArrowIcon.svelte';
	import { BOW_LABEL, BOW_ORDER } from '$lib/archer';
	import type { ArticleCard } from 'archery-contracts';

	let { data } = $props();
	const roster = $derived((data.roster ?? []) as ArcherCard[]);
	const articles = $derived((data.articles ?? []) as ArticleCard[]);

	// Faded club crest watermark (Real-Madrid style) on the hero's right side.
	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// Hero arrow field: a grid of archery arrows that pulse in a diagonal WAVE (blue →
	// gold). Each arrow's animation-delay is its (row + col) so the colour sweep
	// travels across the grid like a wave. Arrows point to the TOP-LEFT.
	const ARROW_COLS = 14;
	const ARROW_ROWS = 3;
	const arrows = Array.from({ length: ARROW_COLS * ARROW_ROWS }, (_, i) => ({
		row: Math.floor(i / ARROW_COLS),
		col: i % ARROW_COLS
	}));

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

	// Per-archer photo scale — each source photo frames differently, so we tune the
	// figure size individually. 1 = default; >1 enlarges, <1 shrinks. Anyone not
	// listed renders at 1.
	const PHOTO_SCALE: Record<string, number> = {
		'amanda-mlinaric': 1.32,
		'leo-sulik': 1.2,
		'zoran-velagic': 1.32,
		'mija-mance': 1.35,
		'tomislav-mlinaric': 1.32,
		'mila-vrbesic': 1.2,
		'nikola-portner-pavicevic': 1.05,
		'ela-drozdek': 1.12,
		'alen-remar': 1.0,
		'mia-medimurec': 0.85,
		'filip-bistricic': 0.85,
		'nicole-bratonja': 0.97,
		'aurelia-mlinaric': 0.85,
		'jakov-crnicki': 0.85,
		'bojan-rodik': 0.85,
		'luka-ciglaric': 0.97,
		'tena-mikolaj': 0.85,
		'leda-crncec': 0.97,
		'karmen-ahmetovic': 1.15,
		'rafael-barulek': 1.15,
		'cvijetoslav-zorman': 1.05
	};

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

	<!-- ── Barça-style heading block: title + year + filter tabs, left-aligned ── -->
	<div class="tm-head">
		<h2 class="tm-head-title">Momčad</h2>
		<p class="tm-head-year">2025/26</p>
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
	</div>

	<!-- ── Card grid ───────────────────────────────────────────────────────── -->
	<div class="tm-content">
		{#if shown.length === 0}
			<p class="tm-empty">Popis članova uskoro će biti dostupan.</p>
		{:else}
			<!-- Two finalist tones not yet decided: alternate them across the grid
			     (even cards blue-dress, odd cards navy-blue) so both can be judged in
			     context. Collapse to one tone once chosen. -->
			<ul class="tm-grid">
				{#each shown as a, i (a.slug)}
					<li>
						<ArcherCardComp
							archer={a}
							tone={i % 2 === 0 ? 'blue-dress' : 'navy'}
							fullSize={true}
							scale={PHOTO_SCALE[a.slug] ?? 1}
						/>
					</li>
				{/each}
			</ul>
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
		margin: ($sp * 1.5) 0 0;
		color: $ink;
		font-size: 1.5rem;
		font-weight: 800;
	}

	// ── Filter tabs (Barça-style underlined text links) ─────────────────────────
	.tm-filters {
		display: flex;
		flex-wrap: wrap;
		gap: ($sp * 1.5);
		margin-top: ($sp * 3.5);
		margin-bottom: ($sp * 3.5);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		// Override the sass-library's global `nav { box-shadow }` — on this white
		// page it would render as a stray rounded rectangle behind the tabs.
		box-shadow: none;
	}
	.tm-filter {
		position: relative;
		padding: 0 0 ($sp * 0.75);
		font: inherit;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: 0.85rem;
		color: map.get(lib.$colors, 'jet-grey');
		background: none;
		border: none;
		cursor: pointer;
		transition: color 0.18s ease;
		// Active underline.
		&::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: -1px;
			height: 2px;
			background: $ink;
			transform: scaleX(0);
			transition: transform 0.18s ease;
		}
		&:hover {
			color: $ink;
		}
		&.active {
			color: $ink;
			&::after {
				transform: scaleX(1);
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
	.tm-empty {
		color: map.get(lib.$colors, 'jet-grey');
		text-align: center;
		font-weight: 300;
	}
	.tm-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		// Cards stretch to fill the row so the grid spans the same left→right extent
		// as the header line above (4 per row, equal width).
		grid-template-columns: repeat(4, 1fr);
		gap: ($sp * 4.5);
	}

	.tm-flourish {
		// Equal breathing room above (from the cards) and below (to the news div).
		// tm-content has no bottom padding and the news div no top padding, so these
		// margins alone set the gap on each side.
		margin: ($sp * 6) 0;
		// Flourish art is built for dark backgrounds; on white, dim it slightly.
		opacity: 0.85;
	}

	@media (max-width: 700px) {
		.tm-hero {
			height: 14rem;
		}
		.tm-arrows {
			grid-template-columns: repeat(8, 1fr);
		}
		.tm-content {
			width: 92%;
		}
		.tm-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: $sp;
		}
	}
</style>
