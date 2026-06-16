<script lang="ts">
	import { page } from '$app/state';
	import Flourish from '$lib/components/Flourish.svelte';
	import SectionExplore from '$lib/components/SectionExplore.svelte';

	let { children } = $props();

	// Same hero photo as the identity page (reused per the design).
	const HERO_IMAGE =
		'https://images.axlothecook.com/archery/identity/identity-page.jpg';

	let heroLoaded = $state(false);

	// Detail pages (/klub/povijest/[slug]) render full-bleed with their OWN cover
	// image — they replace this section hero entirely (Barça-style). So skip the
	// "Povijest" hero + content card wrapper when a slug is present.
	const isDetail = $derived(!!page.params.slug);
</script>

{#if isDetail}
	{@render children()}
{:else}
	<div class="history">
		<!-- Hero: poster image (fades into the page bg) with the gold section title. -->
		<header class="history-hero">
			<img
				class="history-hero-img"
				class:loaded={heroLoaded}
				src={HERO_IMAGE}
				alt=""
				onload={() => (heroLoaded = true)}
			/>
			<div class="history-hero-overlay"></div>
			<h1 class="history-hero-title">Povijest</h1>
		</header>

		<!-- Content: white card on the dark page bg. -->
		<div class="history-content">
			{@render children()}

			<!-- End-of-card flourish: VSK crest + fanning gold lines (same as the other
			     section pages), just before the golden explore block. -->
			<div class="history-flourish"><Flourish /></div>
		</div>

		<!-- Golden "explore the club" block at the bottom (consistent with other pages). -->
		<SectionExplore />
	</div>
{/if}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;

	// Page background = the sponsors/social cap colour (rule: cap matches page).
	$page-bg: var(--color-footer);

	.history {
		width: 100%;
		// No bottom gap — breathing room is the sponsor cap's own top padding.
		background-color: $page-bg;
	}

	// ── Hero ──────────────────────────────────────────────────────────────────
	.history-hero {
		position: relative;
		height: 360px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.history-hero-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 12%;
		opacity: 0;
		transition: opacity 0.8s ease;
		&.loaded {
			opacity: 1;
		}
	}
	.history-hero-overlay {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
			to bottom,
			color.change($navy, $alpha: 0.35) 0%,
			color.change($navy, $alpha: 0.45) 55%,
			$page-bg 100%
		);
	}
	.history-hero-title {
		position: relative;
		margin: 0;
		color: $gold;
		font-size: 4rem; // larger page hero title
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	// ── Content surface ───────────────────────────────────────────────────────
	.history-content {
		width: 85%; // wider content → bigger cards
		margin: 0 auto;
		background-color: $white;
		color: $navy;
		// Only the TOP corners round — the golden explore block continues the card's
		// bottom edge (matches the Identitet card shape).
		border-radius: 12px 12px 0 0;
		// +2rem top padding → more gap between the heading and the top of the card.
		padding: ($sp * 4.5) ($sp * 2.5) ($sp * 2.5);
	}
	// The golden explore block matches the white card's width (85%, centred) and
	// continues from its (square) bottom edge (same as Identitet).
	:global(.history .explore) {
		width: 85%;
		margin: 0 auto;
		border-radius: 0 0 12px 12px;
		overflow: hidden;
	}
	// End-of-card flourish: generous top space from the content, bottom gap before the
	// golden block equalised with the chapter page (124px = this 5.25rem margin + the
	// content card's 40px bottom padding).
	.history-flourish {
		margin: ($sp * 6) 0 ($sp * 5.25);
	}

	// ── Phone ───────────────────────────────────────────────────────────────────
	@media (max-width: 720px) {
		// PHONE: match Identitet/Postignuća — slim cover band + bigger title, and a
		// WHITE page background (hero photo fades into white at the bottom).
		.history {
			background-color: #fff;
		}
		.history-hero {
			height: 180px; // same slim band as Identitet on phone
		}
		.history-hero-title {
			font-size: 2.6rem; // same as Identitet's phone title
		}
		.history-hero-overlay {
			// Fade the hero photo into the now-WHITE page background at the bottom.
			background-image: linear-gradient(
				to bottom,
				color.change($navy, $alpha: 0.35) 0%,
				color.change($navy, $alpha: 0.45) 55%,
				#fff 100%
			);
		}
		// Less side padding so the quote + chapter cards use more width (matching the
		// roomier Identitet/Vrijednosti content width on phone). Wider card + smaller
		// gutters → bigger chapter cards.
		.history-content {
			width: 96%;
			padding: ($sp * 3) ($sp * 0.75) ($sp * 2.5);
		}
		// Golden explore block goes FULL-BLEED on phone — touches both screen edges,
		// no rounding (matches Postignuća/Identitet).
		:global(.history .explore) {
			width: 100%;
			border-radius: 0;
		}
		// Gap below the end flourish equalised to the chapter page (124px on phone);
		// the card's 40px bottom padding adds on top, so use 5.25rem here. Pull out by
		// the card's side padding so the flourish spans the card width and its gold
		// lines match the chapter page's reference length closely (~118px).
		.history-flourish {
			margin-bottom: ($sp * 5.25);
			margin-inline: (-$sp * 0.75);
		}
	}
</style>
