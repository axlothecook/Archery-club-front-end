<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	// Same hero photo as the identity page (reused per the design).
	const HERO_IMAGE =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/identity-page.jpg';

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
		</div>
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
		border-radius: 12px;
		// +2rem top padding → more gap between the heading and the top of the card.
		padding: ($sp * 4.5) ($sp * 2.5) ($sp * 2.5);
	}
</style>
