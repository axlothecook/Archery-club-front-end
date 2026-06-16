<script lang="ts">
	import { page } from '$app/state';
	import { goto, afterNavigate } from '$app/navigation';
	import { error } from '@sveltejs/kit';
	import type { ClubHistoryPeriodResolved, ClubHistoryParagraph } from 'archery-contracts';
	import { splitParagraphs } from '$lib/text';
	import { t } from '$lib/i18n';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';

	const locale = $derived(page.data.locale);
	const periods = $derived((page.data.periods ?? []) as ClubHistoryPeriodResolved[]);
	const slug = page.params.slug ?? '';

	// Find the period by URL slug; unknown slug → 404.
	const period = $derived.by(() => {
		const found = periods.find((p) => p.slug === slug);
		if (!found) error(404, 'Stranica nije pronađena');
		return found;
	});

	const coverUrl = $derived(period.coverImage?.url ?? '');

	// Some chapter paragraphs carry a structured `highlights` list (from the backend
	// seed): a chronological achievement list rendered as one-line rows
	// "date – result • competition • archer". The paragraph's `body` holds the intro
	// prose; `highlights` holds the rows.
	type Highlight = NonNullable<ClubHistoryParagraph['highlights']>[number];


	// Colour the result by medal: zlato + pobjeda → gold; srebro + "9. mjesto" →
	// silver; olimpijske kvote → bronze; anything else → navy default.
	function medalClass(result: string): string {
		const r = result.toLowerCase();
		if (r.includes('zlato') || r.includes('pobjeda')) return 'medal-gold';
		if (r.includes('srebro') || r.includes('9. mjesto')) return 'medal-silver';
		if (r.includes('olimpijske kvote')) return 'medal-bronze';
		return '';
	}

	// Bold the medal/title/record STAT phrases in a paragraph (the counts only —
	// not the commas / connector words between them). Wraps each literal phrase in
	// <strong>; rendered via {@html} (safe: our own seed text, only <strong> added).
	const STAT_PHRASES = [
		'61 zlatnu',
		'30 srebrnih',
		'21 brončanu medalju',
		'46 titula državnih prvaka',
		'10 postavljenih državnih rekorda',
		'76 zlatnih',
		'32 srebrne',
		'9 brončanih medalja'
	];
	function boldStats(text: string): string {
		let out = text;
		for (const phrase of STAT_PHRASES) {
			out = out.replaceAll(phrase, `<strong>${phrase}</strong>`);
		}
		return out;
	}

	// A per-section inline image: certain paragraphs end with a photo below the
	// text (keyed by chapter slug + section header). Currently the 2024 chapter's
	// "Deset godina kluba" 10-year-anniversary photo.
	const SECTION_IMAGES: Record<string, { url: string; alt: string }> = {
		'2024-novo-doba-kluba|Deset godina kluba': {
			url: 'https://images.axlothecook.com/archery/history/anni-25.jpg',
			alt: 'Proslava deset godina Varaždinskog streličarskog kluba'
		}
	};
	function sectionImage(header: string) {
		return SECTION_IMAGES[`${slug}|${header}`];
	}

	// The club crest for the end-of-article flourish (same as the topbar crest).
	const LOGO_URL =
		'https://images.axlothecook.com/archery/identity/vsk-logo.png';

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

	// If the user opened this chapter FROM the list, closing should history.back() so
	// the list returns to the exact scroll position they left it at. Otherwise (deep
	// link / refresh) navigate fresh. Either way the root View Transition still plays.
	let cameFromList = $state(false);
	afterNavigate(({ from }) => {
		cameFromList = from?.url.pathname === '/klub/povijest';
	});
	// Close → return to the list; the View Transition slides the chapter DOWN off it.
	function close() {
		if (cameFromList) history.back();
		else goto('/klub/povijest');
	}
</script>

<!-- ── THE PAGE: cover (fixed, scroll-over) + title + panel. The list↔chapter
     slide is a root-level View Transition; this page is otherwise static. ── -->
<div class="chapter">
	<!-- Cover: a blurred copy fills the band; the sharp photo sits centred + fully
	     visible on top (Barça letterbox-blur). The band is WHITE until the photo
	     has loaded, then the photo + blur FADE in. position:fixed → scroll-over. -->
	<div class="cover" class:loaded={imgLoaded} aria-hidden="true">
		<!-- DESKTOP: a blurred copy fills the band behind the sharp contained photo
		     (Barça letterbox). PHONE: the blur is hidden and the photo fills via cover. -->
		<div class="cover-blur" style="background-image:url({coverUrl})"></div>
		{#if coverUrl}
			<img
				class="cover-photo"
				src={coverUrl}
				alt={period.coverImage?.alt ?? ''}
				onload={() => (imgLoaded = true)}
			/>
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
				{#if para.highlights && para.highlights.length > 0}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<p class="section-body">{@html boldStats(para.body)}</p>
					<ul class="section-list">
						{#each para.highlights as item, i (item.date + item.competition + i)}
							<li>
								<span class="item-date">{item.date}</span>
								<span class="item-dash"> – </span>
								<span class="item-result {medalClass(item.result)}">{item.result}</span>
								<span class="item-sep"> • </span>
								<span class="item-comp">{item.competition}</span>
								<span class="item-sep"> • </span>
								<span class="item-archer">{item.archer}</span>
							</li>
						{/each}
					</ul>
				{:else}
					{#each splitParagraphs(para.body) as chunk, ci (ci)}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<p class="section-body">{@html boldStats(chunk)}</p>
					{/each}
				{/if}

				{#if sectionImage(para.header)}
					{@const img = sectionImage(para.header)}
					<figure class="section-figure">
						<ImageWithLoader src={img.url} alt={img.alt} autoHeight rounded />
					</figure>
				{/if}
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
	<section class="related" aria-label={t(locale, 'chap.related')}>
		<h2 class="related-heading"><strong>{t(locale, 'chap.relatedStrong')}</strong> {t(locale, 'chap.relatedRest')}</h2>

		<div class="related-track-mask">
			<div class="related-track">
				{#each marquee as item, i (item.slug + '-' + i)}
					<a class="related-card" href="/klub/povijest/{item.slug}" aria-hidden={i >= related.length}>
						<div class="related-card-cover">
							{#if item.coverImage}
								<ImageWithLoader src={item.coverImage.url} alt={item.coverImage.alt} />
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
	$cover-h: calc(75svh - #{$header-h});
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
	// DESKTOP: big blurred copy fills the whole band behind the sharp photo.
	.cover-blur {
		position: absolute;
		inset: -40px; // bleed so the blur has no hard edges
		background-size: cover;
		background-position: center;
		filter: blur(28px) brightness(0.8);
		transform: scale(1.1);
	}
	// DESKTOP: sharp photo, fully visible (contain), centred over the blur.
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
	// Inline section photo (e.g. the 10-year anniversary image below "Deset godina
	// kluba"): breaks out WIDER than the 668px text column, centred, rounded.
	.section-figure {
		margin: ($sp * 2.5) auto 0;
		width: 90vw; // wider than the text column
		max-width: 1000px;
		// re-centre relative to the constrained .chapter-section (668px) it lives in
		position: relative;
		left: 50%;
		transform: translateX(-50%);
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
		// Gap between stacked paragraphs within one section (seed "\n\n" breaks).
		& + & {
			margin-top: $sp * 1.25;
		}
		// Bolded stat phrases (medal/title/record counts) inside the paragraph.
		// {@html}-injected <strong> gets no Svelte scope class, so target it globally.
		:global(strong) {
			font-weight: 700;
			color: $navy;
		}
	}
	// Chronological highlights list (Barça-style): no bullet markers, generous
	// spacing, each entry a single row "date – result • competition • archer".
	// Date + result + archer in navy; competition in a lighter blue; dot separators
	// muted. Font sized to keep each entry on ONE line where possible.
	.section-list {
		// Equal breathing room above (intro → list) and below (list → next header,
		// which the section's own bottom margin already provides).
		margin: ($sp * 3.25) 0 0;
		padding: 0 0 ($sp * 0.5); // small bottom pad so the scrollbar doesn't crowd the rows
		list-style: none;
		// Each entry stays on ONE row (white-space:nowrap); when an entry is wider than
		// the column it would clip, so let the whole list SCROLL horizontally instead
		// (a scrollbar appears only when the rows actually overflow).
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		li {
			margin: 0 0 ($sp * 1.25); // airy gap between entries
			font-size: 15px;
			line-height: 24px;
			font-weight: 400;
			white-space: nowrap; // keep each entry on ONE row
			overflow-wrap: normal;
			&:last-child {
				margin-bottom: 0;
			}
		}
		.item-date {
			color: $navy;
			font-weight: 600; // date stands out a touch
		}
		.item-dash,
		.item-result,
		.item-archer {
			color: $navy;
		}
		.item-result {
			font-weight: 600;
			// Medal-coloured result word (zlato/pobjeda gold, srebro silver,
			// olimpijske kvote bronze; everything else stays navy).
			&.medal-gold {
				color: var(--color-accent);
			}
			&.medal-silver {
				color: #9aa6b2;
			}
			&.medal-bronze {
				color: #b3743c;
			}
		}
		.item-comp {
			color: $blue; // lighter blue competition
		}
		.item-sep {
			color: map.get(lib.$colors, 'heather'); // muted dot separators
		}
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

	// ── X close button — bounded to the white panel ───────────────────────────
	// DESKTOP: `position: sticky` INSIDE `.panel` (which is position:relative), so it
	// floats at the viewport bottom WHILE scrolling the white panel, then STOPS at the
	// panel's bottom padding (3rem above the gold line) — it never enters the golden
	// section below. The panel's 3rem bottom padding IS the gap that gives the X its
	// stop-zone, which is why the flourish→golden-div gap is larger here.
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
	// PHONE: move the X to the TOP-RIGHT of the cover (just below the fixed header
	// bars) with a BLACK background, instead of floating at the bottom.
	@media (max-width: 720px) {
		.chapter-close-rail {
			position: fixed;
			top: calc(#{$header-h} + #{$sp});
			right: $sp;
			left: auto;
			bottom: auto;
			justify-content: flex-end;
		}
		.chapter-close {
			width: 44px;
			height: 44px;
			background: #000;
			&:hover {
				background: #000;
			}
		}
		// PHONE: the cover photo FILLS the band (cover) instead of the desktop letterbox
		// (blurred fill + contained photo). Hide the blur; the photo zooms to cover.
		.cover-blur {
			display: none;
		}
		.cover-photo {
			object-fit: cover;
		}
		// Smaller chapter title so even the longest titles ("Klub dostiže svoj vrhunac")
		// stay to two lines, not three.
		.chapter-title {
			font-size: 1.55rem;
		}
		// Paragraph + intro text mirror the Identitet pages' body size (15px / 24px);
		// the lead (intro) matches the paragraph size too.
		.section-body,
		.chapter-lead {
			font-size: 15px;
			line-height: 24px;
		}
		// "POVEZANO S OVIM ČLANKOM" fits on ONE row: a slightly smaller font + nowrap,
		// with side padding so it stays clear of the screen edges.
		.related-heading {
			padding-left: $sp;
			padding-right: $sp;
			font-size: 1.15rem;
			white-space: nowrap;
		}
		// Increase the flourish→related-section gap to match the Identitet pages'
		// flourish→golden-div gap (124px). The related section's 48px top padding adds
		// on top, so 4.75rem here (76 + 48 = 124).
		.flourish {
			margin-bottom: ($sp * 4.75);
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
