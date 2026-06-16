<script lang="ts">
	// Featured-news CAROUSEL. Uses the sass-library's `.default-carousel` rails
	// (track + absolutely-positioned arrows + ticking dots, styled via the
	// `default-carousel` mixin compiled into the lib). The JS the lib leaves to the
	// consumer is implemented here: track translateX, pointer drag-to-swipe (the
	// Food-For-Dollar slider pattern, hand-rolled — no framer-motion dep), arrow +
	// dot clicks, and auto-advance with the dot progress bar restarted per slide.

	import { formatDateHr } from '$lib/date';
	import ArrowUpIcon from '$lib/components/icons/ArrowUpIcon.svelte';
	import type { ArticleCard } from 'archery-contracts';

	let { slides }: { slides: ArticleCard[] } = $props();

	const AUTO_MS = 6000; // keep in sync with $auto-advance-duration (6s) below
	const DRAG_BUFFER = 50; // px past which a drag commits to the next/prev slide

	let index = $state(0);
	const count = $derived(slides.length);

	// Drag state (pointer-based, mirrors Food-For-Dollar's onDragEnd logic).
	let dragging = $state(false);
	let startX = 0;
	let deltaX = $state(0);
	let trackEl: HTMLElement | undefined = $state();

	// Auto-advance timer — paused on hover/drag; restarted whenever `index` changes
	// (so a manual jump resets the dwell) via the keyed dot-progress below.
	let paused = $state(false);
	let timer: ReturnType<typeof setInterval> | null = null;

	function startAuto() {
		stopAuto();
		if (count <= 1) return;
		timer = setInterval(() => {
			if (!paused && !dragging) index = (index + 1) % count;
		}, AUTO_MS);
	}
	function stopAuto() {
		if (timer) clearInterval(timer);
		timer = null;
	}

	$effect(() => {
		startAuto();
		return stopAuto;
	});

	function go(i: number) {
		index = ((i % count) + count) % count; // wrap both directions
	}
	const prev = () => go(index - 1);
	const next = () => go(index + 1);

	// ── Pointer drag ────────────────────────────────────────────────────────────
	// NB: we deliberately do NOT use setPointerCapture — capturing the pointer on the
	// track retargets the subsequent `click` away from the inner <a>, which broke
	// navigation on every slide except the first. Tracking pointer-move globally
	// (only while dragging) gives the same drag UX without stealing the click.
	let wasDragged = $state(false); // true if the last gesture moved past the buffer
	function onPointerDown(e: PointerEvent) {
		if (count <= 1) return;
		dragging = true;
		wasDragged = false;
		startX = e.clientX;
		deltaX = 0;
	}
	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		deltaX = e.clientX - startX;
		if (Math.abs(deltaX) > 5) wasDragged = true;
	}
	function onPointerUp() {
		if (!dragging) return;
		if (deltaX <= -DRAG_BUFFER) next();
		else if (deltaX >= DRAG_BUFFER) prev();
		dragging = false;
		deltaX = 0;
	}

	// Track offset: base -index*100%, plus the live drag delta (px) while dragging.
	const trackStyle = $derived(
		`transform: translateX(calc(${-index * 100}% + ${dragging ? deltaX : 0}px));`
	);
</script>

<!-- Without pointer capture, finish/track a drag that leaves the track via window. -->
<svelte:window
	onpointermove={dragging ? onPointerMove : undefined}
	onpointerup={dragging ? onPointerUp : undefined}
/>

{#if count > 0}
	<div
		class="default-carousel news-carousel"
		class:paused={paused || dragging}
		role="group"
		aria-roledescription="carousel"
		aria-label="Istaknute vijesti"
		onmouseenter={() => (paused = true)}
		onmouseleave={() => (paused = false)}
	>
		<div class="carousel-content">
			{#if count > 1}
				<button class="carousel-arrow-left" type="button" aria-label="Prethodna" onclick={prev}>
					<span class="arrow-icon arrow-left"><ArrowUpIcon size={40} strokeWidth={2.2} /></span>
				</button>
				<button class="carousel-arrow-right" type="button" aria-label="Sljedeća" onclick={next}>
					<span class="arrow-icon arrow-right"><ArrowUpIcon size={40} strokeWidth={2.2} /></span>
				</button>
			{/if}

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="carousel-track"
				class:dragging
				style={trackStyle}
				bind:this={trackEl}
				onpointerdown={onPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onpointercancel={onPointerUp}
			>
				{#each slides as article (article.slug)}
					<div class="carousel-slide">
						<a
							class="slide-link"
							href="/najnovije/{article.slug}"
							draggable="false"
							onclick={(e) => {
								// a swipe shouldn't navigate; a plain click (no drag) should
								if (wasDragged) e.preventDefault();
							}}
						>
							<img
								class="slide-img"
								src={article.posterImage.url}
								alt={article.posterImage.alt}
								draggable="false"
							/>
							<!-- White fade rising from the bottom toward the middle (under the
							     blue overlay, which is drawn after it). -->
							<div class="slide-fade-bottom"></div>
							<div class="slide-overlay"></div>
							<div class="slide-text">
								{#if article.publishedAt}
									<time class="slide-date" datetime={article.publishedAt}>
										{formatDateHr(article.publishedAt)}
									</time>
								{/if}
								<h2 class="slide-title">{article.title}</h2>
								<span class="slide-cta">Pročitaj više →</span>
							</div>
						</a>
					</div>
				{/each}
			</div>
		</div>

		{#if count > 1}
			<div class="carousel-dots">
				{#each slides as _, i (i)}
					<button
						class="carousel-dot"
						class:current={i === index}
						type="button"
						aria-label={`Vijest ${i + 1}`}
						aria-current={i === index}
						onclick={() => go(i)}
					>
						{#if i === index}
							<!-- keyed by index so the progress animation restarts each slide -->
							{#key index}
								<div class="carousel-dot-progress"></div>
							{/key}
						{/if}
					</button>
				{/each}
			</div>
		{/if}
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

	// Retune the library carousel for the news hero: wider aspect, gold dots,
	// 6s auto-advance (matched to AUTO_MS).
	.news-carousel {
		:global(.carousel-content) {
			height: 680px;
			border-radius: 14px;
			box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
		}
		// Dots: much smaller than the lib defaults (1rem / 7rem×0.7rem) + gold active.
		// NB: the library styles these via `.carousel-dots .carousel-dot` (2-class
		// specificity), so each override must match that 2-class chain inside a
		// single :global(...) or the library defaults win.
		:global(.carousel-dots) {
			gap: 0.55rem;
		}
		:global(.carousel-dots .carousel-dot) {
			width: 0.5rem;
			height: 0.5rem;
			border-radius: 50%;
			background-color: color.change($navy, $alpha: 0.3);
		}
		:global(.carousel-dots .carousel-dot.current) {
			// Active dot is a CIRCLE (same size as the others), not an elongated pill.
			width: 0.5rem;
			height: 0.5rem;
			border-radius: 50%;
			background-color: color.change($gold, $alpha: 0.3);
		}
		:global(.carousel-dots .carousel-dot-progress) {
			background-color: $gold;
			animation-duration: 6s; // = AUTO_MS
		}
		&.paused :global(.carousel-dot-progress) {
			animation-play-state: paused;
		}
	}

	.carousel-track {
		cursor: grab;
		touch-action: pan-y; // allow vertical page scroll; we own horizontal
		&.dragging {
			cursor: grabbing;
		}
	}

	// Arrow chevrons: rotate the up-chevron to point left / right.
	.arrow-icon {
		display: block;
		filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
	}
	.arrow-left {
		transform: rotate(-90deg);
	}
	.arrow-right {
		transform: rotate(90deg);
	}

	// ── Slide ───────────────────────────────────────────────────────────────────
	.carousel-slide :global(*) {
		user-select: none;
	}
	.slide-link {
		display: block;
		position: relative;
		width: 100%;
		height: 100%;
		text-decoration: none;
	}
	.slide-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		pointer-events: none;
	}
	// White fade rising from the bottom edge up toward the middle of the slide,
	// so the carousel blends into the white page below. Sits UNDER the blue overlay.
	.slide-fade-bottom {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
			to top,
			#fff 0%,
			color.change(#fff, $alpha: 0.6) 22%,
			color.change(#fff, $alpha: 0) 50%
		);
	}
	.slide-overlay {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
			to right,
			color.change($navy, $alpha: 0.85) 0%,
			color.change($navy, $alpha: 0.5) 20%,
			color.change($navy, $alpha: 0.05) 38%
		);
	}
	.slide-text {
		position: absolute;
		left: 0;
		bottom: 0;
		max-width: 60%;
		padding: ($sp * 2.5) ($sp * 3);
		display: flex;
		flex-direction: column;
		gap: ($sp * 0.6);
	}
	.slide-date {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: $gold;
	}
	.slide-title {
		margin: 0;
		color: $white;
		font-size: 2.4rem;
		font-weight: 800;
		line-height: 1.18;
		text-shadow: 0 2px 14px rgba(0, 0, 0, 0.4);
	}
	.slide-cta {
		margin-top: ($sp * 0.4);
		font-size: 0.95rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: $white;
	}

	@media (max-width: 760px) {
		.news-carousel :global(.carousel-content) {
			// Shorter carousel on phone: cut ~20rem off the 680px desktop height.
			height: 360px;
			aspect-ratio: auto;
			border-radius: 0; // square corners on phone (no curved image corners)
		}
		.slide-text {
			max-width: 100%;
			padding: ($sp * 1.5) ($sp * 1.5) ($sp * 2);
		}
		.slide-title {
			font-size: 1.35rem;
		}
		.slide-overlay {
			background-image: linear-gradient(
				to top,
				color.change($navy, $alpha: 0.9) 0%,
				color.change($navy, $alpha: 0.3) 60%,
				color.change($navy, $alpha: 0.05) 100%
			);
		}
	}
</style>
