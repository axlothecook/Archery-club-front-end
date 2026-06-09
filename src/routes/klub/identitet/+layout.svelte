<script lang="ts">
	import { page } from '$app/state';
	import { IDENTITY_TABS, identityHref } from '$lib/identity';

	let { children } = $props();

	const HERO_IMAGE =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/identity-page.jpg';

	// The active tab = the one whose href matches the current path. The base
	// /klub/identitet (no slug) is Vrijednosti.
	const activeHref = $derived(page.url.pathname.replace(/\/$/, ''));

	// Fade the hero photo in once it has loaded (Barça-style).
	let heroLoaded = $state(false);
</script>

<div class="identity">
	<!-- Hero: poster image (fades in) with the section title overlaid. -->
	<header class="identity-hero">
		<img
			class="identity-hero-img"
			class:loaded={heroLoaded}
			src={HERO_IMAGE}
			alt=""
			onload={() => (heroLoaded = true)}
		/>
		<div class="identity-hero-overlay"></div>
		<h1 class="identity-hero-title">Identitet</h1>
	</header>

	<!-- Content: white surface on the page's navy bg. The tab bar sits INSIDE it,
	     at the top (Barça layout: tabs + content share one white panel). -->
	<div class="identity-content">
		<nav class="identity-tabs" aria-label="Identitet kluba">
			{#each IDENTITY_TABS as tab (tab.apiSlug)}
				{@const href = identityHref(tab)}
				<a class="identity-tab" class:active={href === activeHref} {href}>{tab.label}</a>
			{/each}
		</nav>

		<div class="identity-body">
			{@render children()}
		</div>
	</div>
</div>

<style lang="scss">
	// Colours + spacing from the sass-library (library-over-CSS rule).
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire'); // #102E66
	$gold: map.get(lib.$colors, 'macaroni-and-cheese'); // #efb52f
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;

	// Page background behind the white card = the same colour as the sponsors/social
	// cap (--color-footer). RULE: the sponsors/social cap matches the page background.
	$page-bg: var(--color-footer);

	.identity {
		// full-width: the page fills the viewport (footer is a separate sibling,
		// unaffected). Inner content gets its own padding/constraints as needed.
		// No bottom gap — breathing room before the sponsor div is the cap's own
		// top padding (uniform site-wide, sponsor colour).
		width: 100%;
		background-color: $page-bg;
	}

	// ── Hero ──────────────────────────────────────────────────────────────────
	.identity-hero {
		position: relative;
		height: 360px; // shorter hero band
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.identity-hero-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 12%; // lifted further — show more of the TOP
		opacity: 0; // fade in once loaded
		transition: opacity 0.8s ease;
		&.loaded {
			opacity: 1;
		}
	}
	.identity-hero-overlay {
		position: absolute;
		inset: 0;
		// Barça-style: a light navy wash for title legibility that deepens to the
		// page background at the bottom, so the image fades seamlessly into the page.
		background-image: linear-gradient(
			to bottom,
			color.change($navy, $alpha: 0.35) 0%,
			color.change($navy, $alpha: 0.45) 55%,
			$page-bg 100%
		);
	}
	.identity-hero-title {
		position: relative;
		margin: 0;
		color: $gold;
		font-size: 4rem; // larger page hero title
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	// ── Tab bar (Barça secondary-nav style) ───────────────────────────────────
	// Full-width light bar; equal-width segments separated by thin dividers;
	// UPPERCASE grey inactive tabs; active = white bg + blue underline.
	$tab-grey: map.get(lib.$colors, 'jet-grey'); // #607480 — inactive text
	$tab-bar-bg: map.get(lib.$colors, 'white-smoke'); // #F3F4F6 — light bar
	$tab-divider: map.get(lib.$colors, 'heather'); // #bec2d0 — segment dividers

	.identity-tabs {
		display: flex;
		width: 100%;
		background-color: $tab-bar-bg;
	}
	.identity-tab {
		position: relative; // anchor for the animated underline
		flex: 1; // equal-width segments
		padding: ($sp * 1.6) ($sp * 1.25); // taller tabs (Barça-style)
		text-align: center;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-decoration: none;
		color: $tab-grey; // inactive: grey
		border-right: 1px solid $tab-divider; // segment divider
		transition:
			background-color 0.2s ease,
			color 0.2s ease;
		&:last-child {
			border-right: none;
		}

		// Signature-gold underline that grows from the CENTRE outward (fast). Shown
		// on hover and on the active tab.
		&::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 3px;
			background-color: $gold;
			transform: scaleX(0);
			transform-origin: center;
			transition: transform 0.3s ease;
		}
		&:hover {
			color: $navy;
			&::after {
				transform: scaleX(1);
			}
		}
		// active: white bg, navy text + gold underline shown
		&.active {
			background-color: $white;
			color: $navy;
			&::after {
				transform: scaleX(1);
			}
		}
	}

	// ── Content surface ───────────────────────────────────────────────────────
	.identity-content {
		// Centred white panel; width matches the Povijest content card (85%).
		// The tab bar lives at its TOP; overflow:hidden clips the bar to the
		// rounded corners. Padding moves to .identity-body so the bar is full-width.
		width: 85%;
		margin: 0 auto;
		background-color: $white;
		color: $navy;
		border-radius: 12px;
		overflow: hidden;
	}
	.identity-body {
		// extra top space between the tab bar and the content heading (Barça-like)
		padding: ($sp * 4) ($sp * 2.5) ($sp * 2.5);
	}
</style>
