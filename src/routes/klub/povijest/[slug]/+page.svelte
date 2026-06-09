<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { error } from '@sveltejs/kit';
	import type { ClubHistoryPeriodResolved } from 'archery-contracts';
	import CrossedArrowsIcon from '$lib/components/icons/CrossedArrowsIcon.svelte';

	const periods = $derived((page.data.periods ?? []) as ClubHistoryPeriodResolved[]);
	const slug = page.params.slug ?? '';

	// Find the period by URL slug; unknown slug → 404.
	const period = $derived.by(() => {
		const found = periods.find((p) => p.slug === slug);
		if (!found) error(404, 'Stranica nije pronađena');
		return found;
	});

	const coverUrl = $derived(period.coverImage?.url ?? '');

	// The club crest for the end-of-article flourish (same as the topbar crest).
	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// "Povezano s ovim člankom" — up to 8 related chapters. Rule (newer-first, then
	// wrap to fill 8): take the chapters NEWER than this one (higher `order`), then
	// backfill with the nearest OLDER ones, capped at 8. (Covers the latest / 2nd
	// latest / not-in-top-8 cases with one rule.)
	const RELATED_COUNT = 8;
	const related = $derived.by(() => {
		const byNewest = [...periods].sort((a, b) => b.order - a.order); // newest → oldest
		const idx = byNewest.findIndex((p) => p.slug === slug);
		if (idx === -1) return byNewest.slice(0, RELATED_COUNT);
		const newer = byNewest.slice(0, idx); // chapters newer than this one
		const older = byNewest.slice(idx + 1); // chapters older than this one
		return [...newer, ...older].slice(0, RELATED_COUNT);
	});
	// Duplicate the list so the marquee can scroll seamlessly (loops at -50%).
	const marquee = $derived([...related, ...related]);

	// The OPEN/CLOSE slide is handled by the View Transitions API in the root
	// layout (list ↔ chapter). Here we only manage the cover image itself: it
	// shows a WHITE placeholder until the photo has downloaded, then fades in.
	let imgLoaded = $state(false);

	// End-of-article flourish: the crest lifts up + two gold lines fan out once it
	// scrolls into view (~30% above the page bottom). `reveal` is an action that
	// toggles `.revealed` via an IntersectionObserver. The bottom rootMargin of
	// -30% means it fires when the element reaches the top 70% of the viewport.
	let flourishRevealed = $state(false);
	function reveal(node: HTMLElement) {
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					flourishRevealed = true;
					io.disconnect(); // one-shot
				}
			},
			{ rootMargin: '0px 0px -30% 0px', threshold: 0 }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}

	// Close → just navigate; the View Transition slides the chapter DOWN off the list.
	function close() {
		goto('/klub/povijest');
	}
</script>

<!-- ── THE PAGE: cover (fixed, scroll-over) + title + panel. The list↔chapter
     slide is a root-level View Transition; this page is otherwise static. ── -->
<div class="chapter">
	<!-- Cover: a blurred copy fills the band; the sharp photo sits centred + fully
	     visible on top (Barça letterbox-blur). The band is WHITE until the photo
	     has loaded, then the photo + blur FADE in. position:fixed → scroll-over. -->
	<div class="cover" class:loaded={imgLoaded} aria-hidden="true">
		<div class="cover-blur" style="background-image:url({coverUrl})"></div>
		{#if coverUrl}
			<img
				class="cover-photo"
				src={coverUrl}
				alt={period.coverImage?.alt ?? ''}
				onload={() => (imgLoaded = true)}
			/>
		{/if}
		<!-- While the photo downloads, the crossed VSK arrows cycle blue↔gold in the
		     white cover band; they fade out as the photo fades in. -->
		{#if !imgLoaded}
			<div class="cover-loader"><CrossedArrowsIcon size={72} /></div>
		{/if}
	</div>

	<!-- Title sits over the bottom-left of the cover but is in NORMAL FLOW (pulled
	     up over the sticky cover), so it scrolls UP WITH the white panel — the panel
	     carries the title up rather than sliding over a pinned title. -->
	<div class="title-band">
		<h1 class="chapter-title">{period.title}</h1>
	</div>

	<!-- White content panel with rounded top corners; scrolls UP over the cover. -->
	<div class="panel">
		<p class="chapter-lead">{period.lead}</p>

		{#each period.paragraphs as para (para.header)}
			<section class="chapter-section">
				<h2 class="section-header">{para.header}</h2>
				<p class="section-body">{para.body}</p>
			</section>
		{/each}

		<!-- End-of-article flourish: VSK crest with two gold lines that fan out
		     left + right once it scrolls into view (the crest also lifts up). -->
		<div class="flourish" class:revealed={flourishRevealed} use:reveal aria-hidden="true">
			<span class="flourish-line left"></span>
			<img class="flourish-crest" src={LOGO_URL} alt="" />
			<span class="flourish-line right"></span>
		</div>

		<!-- X: `position: sticky` INSIDE the white panel (`.panel` is position:relative),
		     so it floats at the viewport bottom while reading and is naturally bounded
		     by the panel — it stops at the panel's bottom padding (3rem above the gold
		     line) and never enters the golden section. -->
		<div class="chapter-close-rail">
			<button class="chapter-close" type="button" aria-label="Zatvori" onclick={close}>
				<span class="x-line"></span>
				<span class="x-line"></span>
			</button>
		</div>
	</div>
	<!-- /.panel -->
</div>
<!-- /.chapter -->

<!-- ── POVEZANO S OVIM ČLANKOM: related-chapters section (OUTSIDE the shell, so the
     X can't enter it). One continuous gold→blue fade; an auto-scrolling marquee of
     up to 8 related chapter cards that PAUSES on card-hover (hovered card scales). -->
{#if related.length > 0}
	<section class="related" aria-label="Povezano s ovim člankom">
		<h2 class="related-heading"><strong>POVEZANO</strong> S OVIM ČLANKOM</h2>

		<div class="related-track-mask">
			<div class="related-track">
				{#each marquee as item, i (item.slug + '-' + i)}
					<a class="related-card" href="/klub/povijest/{item.slug}" aria-hidden={i >= related.length}>
						<div class="related-card-cover">
							{#if item.coverImage}
								<img src={item.coverImage.url} alt={item.coverImage.alt} loading="lazy" />
							{/if}
						</div>
						<span class="related-card-title">{item.title}</span>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$shark: map.get(lib.$colors, 'shark');
	$blue: map.get(lib.$colors, 'blue-dress');
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;

	// Combined fixed-header height at the top of the page = black TopBar (68px) +
	// blue section-nav (43px). The cover image + flow content start BELOW both so
	// the photo isn't clipped and there's no navy gap. (The nav-merge step will
	// later collapse these into one bar on scroll.)
	$header-h: 111px;
	// Height of the cover band = how much image shows before the white panel.
	// Shorter than the viewport so the white panel + lead peek at the bottom
	// (Barça-style), and the panel overlaps the image bottom (no navy gap).
	// Uses `svh` (small viewport height) — a STABLE unit that does NOT recalc when
	// a mobile URL bar shows/hides, so the `contain` photo never re-fits mid-scroll
	// (the shrink/extend jitter came from `vh` recalculating). See research notes.
	$cover-h: calc(68svh - #{$header-h});
	// How far the white panel pulls UP over the bottom of the cover image.
	$panel-overlap: 56px;

	// ── The chapter page ──────────────────────────────────────────────────────
	// Static. The list↔chapter open/close slide is a root-level View Transition.
	.chapter {
		position: relative;
		// No bottom gap here — the breathing room before the sponsor div lives in the
		// sponsor cap's own top padding (sponsor colour), so there's no two-tone
		// navy band. The sticky cover is still bounded by this container.
		background-color: var(--color-bg);
	}

	// ── Cover image (blurred fill + sharp centred photo) ───────────────────────
	// position:STICKY (not fixed) → the panel scrolls UP over it AND, crucially,
	// the cover is bounded by `.chapter` so it scrolls away with the container
	// instead of bleeding into the footer/navy gap below (verified technique:
	// sticky respects its container's bounds, fixed does not). WHITE until the
	// photo loads, then it fades in (stable reserved box → no jitter).
	.cover {
		position: sticky;
		top: $header-h; // pins below both fixed bars
		height: $cover-h;
		z-index: 0;
		overflow: hidden;
		background: $white; // WHITE placeholder until the photo has loaded
	}
	// Big blurred copy fills the whole band behind the sharp photo.
	.cover-blur {
		position: absolute;
		inset: -40px; // bleed so the blur has no hard edges
		background-size: cover;
		background-position: center;
		filter: blur(28px) brightness(0.8);
		transform: scale(1.1);
	}
	// Sharp photo, fully visible (contain), centred over the blur.
	.cover-photo {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center;
	}
	// Photo + blur fade in once loaded (white placeholder shows underneath until then).
	.cover-blur,
	.cover-photo {
		opacity: 0;
		transition: opacity 0.5s ease;
	}
	.cover.loaded .cover-blur,
	.cover.loaded .cover-photo {
		opacity: 1;
	}

	// Crossed VSK arrows centred in the white cover band while the photo loads.
	.cover-loader {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
	}
	// The two arrows alternate lighten↔darken: one blue arrow, one gold arrow.
	.cover-loader :global(.arrow-a) {
		animation: arrow-a-cycle 1.2s ease-in-out infinite;
	}
	.cover-loader :global(.arrow-b) {
		animation: arrow-b-cycle 1.2s ease-in-out infinite;
	}
	@keyframes arrow-a-cycle {
		0%,
		100% {
			fill: #4d86ff;
		}
		50% {
			fill: #16306e;
		}
	}
	@keyframes arrow-b-cycle {
		0%,
		100% {
			fill: #b8860b;
		}
		50% {
			fill: #ffd24a;
		}
	}

	// ── Title band: in FLOW, pulled up over the sticky cover ──────────────────
	// The cover (sticky) takes its height in flow; this band is pulled up by that
	// full height so it overlays the cover, then sits its title at the bottom. Being
	// in flow, it scrolls UP WITH the panel (the panel carries the title up) instead
	// of the panel sliding over a pinned title.
	.title-band {
		position: relative;
		z-index: 2;
		margin-top: calc(-1 * #{$cover-h}); // overlay the full sticky cover
		height: calc(#{$cover-h} - #{$panel-overlap}); // title lands above the panel
		display: flex;
		align-items: flex-end;
		pointer-events: none; // image is decorative; clicks pass through
	}
	.chapter-title {
		margin: 0;
		// Bottom padding gives a small gap so descenders (j, g) don't touch the panel.
		padding: ($sp * 2) ($sp * 2) ($sp * 0.85);
		color: $white;
		font-size: 3rem;
		font-weight: 700;
		line-height: 1.2; // room so descenders (j, g) clear the panel edge
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
	}

	// ── White content panel: rounded top, scrolls UP over the sticky cover ─────
	.panel {
		position: relative;
		z-index: 1;
		background: $white;
		border-radius: 20px 20px 0 0;
		// The title-band above already ends $panel-overlap above the cover bottom, so
		// the panel naturally starts there — sealing the image bottom (no navy gap)
		// and rounding over it. No extra negative margin needed.
		min-height: 60vh;
		// 3rem bottom padding = the white clearance below the X's max-depth stop,
		// before the panel ends (the gold line). So the X stops 3rem above the gold.
		padding: ($sp * 3) $sp ($sp * 3);
		box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
	}
	.chapter-lead {
		max-width: 668px;
		margin: 0 auto ($sp * 2.5);
		font-size: 1.2rem;
		line-height: 1.6;
		font-weight: 300; // nuked-light body weight (Barça/Apple thin aesthetic)
		color: $navy;
	}
	.chapter-section {
		max-width: 668px;
		margin: 0 auto ($sp * 3.25); // more space BETWEEN section blocks
	}
	.section-header {
		margin: 0 0 ($sp * 0.5);
		font-size: 1.35rem;
		font-weight: 800; // thicker (Barça-style heading heft)
		text-transform: uppercase;
		letter-spacing: 0.01em;
		color: $navy; // VSK blue (deep-sapphire)
	}
	.section-body {
		margin: 0;
		font-size: 18px;
		line-height: 28px;
		font-weight: 300; // nuked-light body weight
		color: $shark;
	}

	// ── End-of-article flourish (crest + two gold lines fanning out) ──────────
	$gold: var(--color-accent);
	// Crest + two gold lines, all vertically CENTRED on one line. The crest lifts
	// UP into its aligned spot on reveal (entrance), then the lines fan outward.
	.flourish {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $sp * 1.5; // gap between each line and the crest
		max-width: 668px;
		// Flourish: big top space from the last paragraph; small bottom margin = the
		// "tiny bit of space" between the logo and the X button below it.
		margin: ($sp * 10) auto ($sp * 1.5);
	}
	.flourish-crest {
		flex: 0 0 auto;
		width: 56px;
		height: auto;
		// Entrance: crest is ALWAYS visible (no fade), just lifts UP a SHORT distance
		// into its aligned spot (starts close to its final position). Slow, subtle.
		transform: translateY(1.5rem);
		transition: transform 1.1s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.flourish-line {
		flex: 1 1 auto;
		height: 2px;
		background: $gold;
		// collapsed (0 width) until revealed, then grows OUTWARD from the crest
		// side (transform-origin = the edge nearest the crest). Delayed so the crest
		// settles first, then the lines slowly fan out.
		transform: scaleX(0);
		transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.5s;
	}
	.flourish-line.left {
		transform-origin: right; // grows leftwards, away from the crest
	}
	.flourish-line.right {
		transform-origin: left; // grows rightwards, away from the crest
	}
	.flourish.revealed .flourish-crest {
		transform: translateY(0); // lifted into its aligned spot
	}
	.flourish.revealed .flourish-line {
		transform: scaleX(1); // fan out
	}

	// ── "Povezano s ovim člankom" related-chapters section ────────────────────
	// Attached to the white panel's bottom edge; background fades from gold to the
	// sponsor navy. Holds an auto-scrolling marquee of related chapter cards.
	// HEAD: heading + cards. The gold→navy fade happens ENTIRELY here, ending at the
	// sponsor navy; the TAIL is then solid navy → no seam. Inside the shell, so the
	// X's sticky stop is just below the cards. (No `overflow:hidden` — it would make
	// this a scroll container and break the X's sticky; the marquee clips via
	// `.related-track-mask`.)
	// One continuous gold→navy fade section (the X never enters it — it's bounded to
	// the white panel above). Tall fading band below the cards before the sponsor div.
	.related {
		position: relative;
		z-index: 1;
		padding: ($sp * 3) 0 ($sp * 20);
		background: linear-gradient(to bottom, #f2ca46 0%, var(--color-footer) 85%);
		// NB: NO `overflow: hidden` (it would create a scroll container); the marquee
		// clips via `.related-track-mask`.
	}
	.related-heading {
		margin: 0 0 ($sp * 2.5);
		text-align: center;
		color: $white;
		font-size: 1.6rem;
		font-weight: 400; // "S OVIM ČLANKOM" light; "POVEZANO" bolded via <strong>
		letter-spacing: 0.08em;
		strong {
			font-weight: 800;
		}
	}

	// Marquee: the track holds the cards twice; it scrolls left forever and loops at
	// -50% (the duplicate point) so it's seamless. Hovering the section PAUSES it.
	.related-track-mask {
		overflow: hidden;
		// soft fade at both edges so cards don't hard-cut at the sides. Fade ramp is
		// a fixed width (widened by 2rem each side for this test).
		$fade: 6.75rem; // original ~4.75rem (4% of width) + 2rem each side
		$fade-mask: linear-gradient(
			to right,
			transparent 0,
			#000 #{$fade},
			#000 calc(100% - #{$fade}),
			transparent 100%
		);
		mask-image: $fade-mask;
		-webkit-mask-image: $fade-mask;
	}
	.related-track {
		display: flex;
		gap: $sp * 1.25;
		width: max-content;
		padding: ($sp * 0.5) $sp; // room for the hover scale-up not to clip
		animation: related-scroll 45s linear infinite;
	}
	// Pause the scroll ONLY when a CARD itself is hovered (not the empty space
	// around the cards). `:has` checks for a hovered card inside the track.
	.related-track:has(.related-card:hover) {
		animation-play-state: paused;
	}
	@keyframes related-scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	// Each card: cover image with the title overlaid at the bottom (Dribbble-style).
	.related-card {
		flex: 0 0 auto;
		width: 280px;
		text-decoration: none;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
		transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
		position: relative;
		display: block;
	}
	.related-card:hover {
		transform: scale(1.05); // hovered card scales up a bit
	}
	.related-card-cover {
		aspect-ratio: 16 / 10;
		background: rgba(0, 0, 0, 0.2);
		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			display: block;
		}
	}
	.related-card-title {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: ($sp * 2) ($sp * 0.9) ($sp * 0.75);
		color: $white;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.25;
		// gradient scrim so the title is readable over any image
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
	}

	// ── X close button — bounded to the chapter shell ─────────────────────────
	// The X rail is `position: sticky` INSIDE `.panel` (which is position:relative),
	// so it's naturally bounded by the white panel: it floats at the viewport bottom
	// while reading, then stops at the panel's bottom padding (3rem above the gold
	// line) — it can never enter the golden section below.
	.chapter-close-rail {
		position: sticky;
		bottom: $sp * 1.5; // float position while scrolling
		z-index: 950; // above content, below the white transition sheet (1000)
		display: flex;
		justify-content: center;
		pointer-events: none; // only the button itself is clickable
	}
	.chapter-close {
		pointer-events: auto;
		width: 52px;
		height: 52px;
		border: none;
		border-radius: 50%;
		background: $navy;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
		transition: background-color 0.2s ease;
		&:hover {
			background: map.get(lib.$colors, 'supermarket-blue'); // light blue on hover
		}
	}
	.x-line {
		position: absolute;
		width: 20px;
		height: 2px;
		background: $white;
		&:first-child {
			transform: rotate(45deg);
		}
		&:last-child {
			transform: rotate(-45deg);
		}
	}
</style>
