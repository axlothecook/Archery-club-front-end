<script lang="ts">
	// 🚧 TEMPORARY front-page preview, numbered.com "MediasMouse" architecture:
	// ALL candidate images are stacked FULL-SCREEN (each covers the entire viewport,
	// object-fit:cover); only ONE shows at a time. The screen is split into invisible
	// vertical hover ZONES — moving the cursor left↔right swaps which full-screen image
	// shows (crossfade). Previews every candidate at true hero size on '/'. NOT the final
	// hero. Replace this whole file with the real homepage once the picks are made.
	//
	// CROP: object-fit:cover always crops to fill (screen ~2.16:1; photos are 1.5:1 or
	// portrait). Per-image `pos` (object-position) keeps the SUBJECT in frame instead of a
	// blind center crop (MDN focal-point art-direction). Portraits (amanda-1/4/5/6) crop
	// hardest on a wide screen — if focal-point isn't enough we'll art-direct real crops.

	import NewsCoverflow from '$lib/components/NewsCoverflow.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import SectionExplore from '$lib/components/SectionExplore.svelte';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import RightArrowIcon from '$lib/components/icons/RightArrowIcon.svelte';
	import { fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	let { data } = $props();

	// Homepage events teaser: the next few upcoming competitions (soonest first).
	const upcomingTeaser = $derived(data.upcoming.slice(0, 8));

	// Events carousel: side arrows drive a scroll-snap track (4 cards per view); the
	// native scrollbar is hidden. Arrows hide at the start/end. (Same pattern as the
	// schedule page's "this month" carousel.)
	let eventsTrack: HTMLElement | undefined = $state();
	let evCanLeft = $state(false);
	let evCanRight = $state(false);
	function updateEvArrows() {
		const el = eventsTrack;
		if (!el) return;
		evCanLeft = el.scrollLeft > 1;
		evCanRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
	}
	function scrollEvents(dir: -1 | 1) {
		const by = eventsTrack ? eventsTrack.clientWidth * 0.9 : 360;
		eventsTrack?.scrollBy({ left: dir * by, behavior: 'smooth' });
	}
	$effect(() => {
		const el = eventsTrack;
		if (!el) return;
		updateEvArrows();
		const ro = new ResizeObserver(updateEvArrows);
		ro.observe(el);
		return () => ro.disconnect();
	});

	// ── Achievements rotator (RM-style) ─────────────────────────────────────────────
	// One achievement at a time: image-left / text-right. Auto-advances every 5s — the
	// CURRENT slide exits LEFT while the NEXT enters from the RIGHT. The 5s countdown is
	// NOT shown. `dir` drives the enter/exit direction so a manual jump can reverse it.
	const ACH_INTERVAL = 5000;
	let achIndex = $state(0);
	let achTimer: ReturnType<typeof setInterval> | undefined;
	const achCount = $derived(data.achievements.length);

	function achGo(next: number) {
		if (achCount === 0) return;
		achIndex = ((next % achCount) + achCount) % achCount;
	}
	$effect(() => {
		if (achCount <= 1) return;
		achTimer = setInterval(() => achGo(achIndex + 1), ACH_INTERVAL);
		return () => clearInterval(achTimer);
	});

	// Count-up: the FIRST time a given slide is shown, its number animates 0 → target;
	// on any later re-show it appears at the final value instantly. `achSeen` tracks which
	// slide indices have already played. Used as a Svelte action on the number element.
	const achSeen = new Set<number>();
	function countUp(node: HTMLElement, opts: { index: number; target: number }) {
		const { index, target } = opts;
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (reduce || achSeen.has(index)) {
			node.textContent = String(target);
			achSeen.add(index);
			return;
		}
		achSeen.add(index);
		const DELAY = 1000; // hold at 0 for ~1s after the slide settles, THEN count up
		const DURATION = 450; // fast count for every number (small + large alike)
		node.textContent = '0'; // sit at zero during the delay (not the final value)
		let start: number | null = null;
		let raf = 0;
		const tick = (t: number) => {
			if (start === null) start = t;
			const p = Math.min(1, (t - start) / DURATION); // LINEAR — steady pace, no slowdown
			node.textContent = String(Math.round(p * target));
			if (p < 1) raf = requestAnimationFrame(tick);
		};
		const timer = setTimeout(() => (raf = requestAnimationFrame(tick)), DELAY);
		return {
			destroy: () => {
				clearTimeout(timer);
				cancelAnimationFrame(raf);
			}
		};
	}

	// ── Join CTA: two short clips played A→B→A→B in a SEAMLESS loop ──────────────────
	// Two stacked <video>s; only one is "active" (visible). When the active clip nears its
	// end we start the OTHER (already preloaded) and crossfade to it (~0.6s), so there's no
	// gap/flash at the join. Each clip plays ONCE (no native loop); the swap restarts it.
	// The two join clips, played A→B→A→B in a seamless crossfade loop.
	const JOIN_CLIPS = ['/vid-1.mp4', '/vid-2.mp4'];
	const JOIN_FADE = 0.6; // seconds — crossfade window before a clip ends
	let joinActive = $state(0); // which clip is currently shown (0 or 1)
	let joinVideoEls: (HTMLVideoElement | undefined)[] = [undefined, undefined];

	// Called on each clip's timeupdate: when within JOIN_FADE of its end, hand off to the
	// other clip (rewind + play it, then flip `joinActive` so the CSS crossfade runs).
	function joinTick(i: number) {
		const el = joinVideoEls[i];
		if (!el || i !== joinActive || !el.duration) return;
		if (el.currentTime >= el.duration - JOIN_FADE) {
			const next = i === 0 ? 1 : 0;
			const nextEl = joinVideoEls[next];
			if (nextEl) {
				nextEl.currentTime = 0;
				void nextEl.play();
				joinActive = next; // CSS fades `next` in, `i` out
			}
		}
	}

	// Typewriter: types `text` out char-by-char (left→right), holds, clears, and repeats on
	// a CYCLE-ms loop. Used as an action on the "Početnici su dobrodošli" line. Respects
	// prefers-reduced-motion (shows the text statically).
	function typewriter(node: HTMLElement, opts: { text: string; cycle?: number }) {
		const text = opts.text;
		const cycle = opts.cycle ?? 7000;
		const reduce =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (reduce) {
			node.textContent = text;
			return;
		}
		const TYPE_MS = 65; // per-character type speed
		const timers: ReturnType<typeof setTimeout>[] = [];
		const clearAll = () => {
			timers.forEach(clearTimeout);
			timers.length = 0;
		};
		const runOnce = () => {
			node.textContent = '';
			for (let i = 0; i < text.length; i++) {
				timers.push(setTimeout(() => (node.textContent = text.slice(0, i + 1)), i * TYPE_MS));
			}
		};
		runOnce();
		const loop = setInterval(runOnce, cycle); // type → (stays) → re-type every `cycle`
		return {
			destroy: () => {
				clearInterval(loop);
				clearAll();
			}
		};
	}

	const BASE = 'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/front%20page/';

	// pos = object-position (where to anchor the crop). Default 'center 35%' keeps heads
	// (most action shots have the subject in the upper-middle). Tuned per image below.
	// Removed (user, 2026-06-13): amanda-3, amanda-6, leo-2, together-4, together-3, amanda-5,
	// alen-4, amanda-7, amanda-4, amanda-1, alen-5, amanda-9, alen-7, amanda-10, together-5,
	// alen-9, alen-8. (leo-3 re-added.) New-batch rejects: amanda-11, amanda-13, amanda-14,
	// amanda-15, amanda-16, amanda-22, amanda-23, amanda-12, amanda-18. Rest dropped:
	// alen-1, alen-2, leo-1, mlinaric-family (alen-6 promoted to POTENTIAL).
	//
	// POOL = the stable master list (numbers don't shift). SHOW = which to display this
	// round (the narrowing workflow: 5 on screen, drop weak ones, refill from the pool).
	// Empty SHOW = show the whole pool.
	// Reordered (user, 2026-06-13): together-2 first, then alternate Alen/Amanda with the
	// other shots woven in (no clumped runs of one person).
	const POOL = [
		{ file: 'amanda-21.jpg', pos: 'center 35%' }, // 1 (moved from last to first, 2026-06-13)
		{ file: 'target.jpg', pos: 'center 50%' }, // 2 (swapped with together-2, 2026-06-13)
		{ file: 'amanda-8.jpg', pos: 'center 45%' }, // 3
		{ file: 'alen-3.jpg', pos: 'center 35%' }, // 4
		{ file: 'leo-3.jpg', pos: 'center 35%' }, // 5 (re-added 2026-06-13)
		{ file: 'alen-6.jpg', pos: 'center 35%' }, // 6
		{ file: 'together-1.jpg', pos: 'center 40%' }, // 7
		{ file: 'together-2.jpg', pos: 'center 40%' }, // 8 (swapped with target, 2026-06-13)
		// New batch (2026-06-13) — focal points default to 'center 35%', tune visually later.
		{ file: 'alen-11.jpg', pos: 'center 35%' },
		{ file: 'alen-12.jpg', pos: 'center 35%' },
		{ file: 'alen-13.jpg', pos: 'center 35%' },
		{ file: 'amanda-17.jpg', pos: 'center 35%' }
	].map((x) => ({
		url: BASE + x.file,
		name: x.file.replace(/\.jpg$/, ''),
		pos: x.pos,
		rotate: 'rotate' in x ? (x as { rotate: number }).rotate : 0
	}));

	// POTENTIAL = the running shortlist (survivors from EVERY round so far). 2026-06-13:
	// new-batch survivors + alen-6 joined the round-1 eight → 17 total. With the leftover
	// "rest" now dropped from POOL, POTENTIAL == POOL.
	const POTENTIAL: string[] = [
		'together-2',
		'alen-3',
		'amanda-8',
		'leo-3',
		'target',
		'together-1',
		'alen-11',
		'alen-12',
		'alen-13',
		'amanda-17',
		'amanda-21',
		'alen-6'
	];

	// HIDDEN = images parked OUT of the shown set but kept IN the pool (not displayed,
	// not removed). 2026-06-13: amanda-17, alen-11, target moved here.
	const HIDDEN: string[] = ['amanda-17', 'alen-11', 'target', 'together-1', 'alen-13', 'amanda-8'];

	// Display mode: 'all' = every POOL image NOT hidden · 'rest' = POOL minus POTENTIAL
	// (also minus hidden) · string[] = exactly those filenames, in order.
	type HeroImg = (typeof POOL)[number];
	function resolveImages(mode: 'all' | 'rest' | string[]): HeroImg[] {
		if (mode === 'all') return POOL.filter((p) => !HIDDEN.includes(p.name));
		if (mode === 'rest')
			return POOL.filter((p) => !POTENTIAL.includes(p.name) && !HIDDEN.includes(p.name));
		return mode
			.map((n) => POOL.find((p) => p.name === n))
			.filter((p): p is HeroImg => p !== undefined);
	}

	const SHOW: 'all' | 'rest' | string[] = 'all';
	const IMAGES = resolveImages(SHOW);

	// Which full-screen image is currently shown (driven by the hover zone under the cursor).
	let active = $state(0);

	// ── Intro sequence ──────────────────────────────────────────────────────────────
	// The loader + reveal play ONLY on a FRESH page load of '/' (first visit or reload),
	// NOT when navigating to the homepage from another page inside the site (that should
	// feel instant). SvelteKit's afterNavigate type is 'enter' only on the initial load;
	// 'link'/'goto'/'popstate' are client-side navigations → skip the intro then.
	//   On a fresh load: PageLoader shows a #34302d 0→100% counter, fades at 100%, fires
	//   onreveal → startIntro() which drops the curtain + animates the VSK wordmark,
	//   tagline, and the navbar sliding down.
	import PageLoader from '$lib/components/PageLoader.svelte';

	// FRESH-LOAD DETECTION (synchronous, at init — no first-paint flash):
	// The inline script in app.html sets <html data-nav-intro> ONLY on a true fresh page
	// load of '/' at the top (first visit / reload). It does NOT run on client-side
	// navigation. So the attribute's presence at component init = "fresh homepage load" →
	// play the loader + intro. On internal nav (page→home) the attr is absent → skip the
	// intro entirely and show the hero immediately.
	const freshLoad =
		typeof document !== 'undefined' && document.documentElement.hasAttribute('data-nav-intro');

	// On a fresh load the intro is armed (loader covers, curtain covering, wordmark parked).
	// On internal nav everything is already "in" so the hero shows at once.
	let revealed = $state(!freshLoad);
	let curtainGone = $state(!freshLoad);
	let introIn = $state(!freshLoad);

	// The hero image URLs the loader waits on (so the % tracks the real hero images).
	const heroAssets = IMAGES.map((img) => img.url);

	// Gap between the loader fading out and the VSK wordmark + tagline animating in.
	const INTRO_DELAY = 900;

	function startIntro() {
		// next frame so the curtain paints at its covering position first, then transitions
		requestAnimationFrame(() => {
			revealed = true; // curtain starts falling immediately on reveal
		});
		// remove the curtain after the fall completes (matches the CSS duration below)
		setTimeout(() => (curtainGone = true), 1100);
		// VSK + tagline animate in AFTER the gap (loader has fully faded by then).
		setTimeout(() => (introIn = true), INTRO_DELAY);
		// Navbar links slide down into place (alongside the VSK reveal beat).
		setTimeout(() => document.documentElement.removeAttribute('data-nav-intro'), INTRO_DELAY);
	}
</script>

{#if freshLoad}
	<PageLoader assets={heroAssets} onreveal={startIntro} />
{/if}

<div class="hero" aria-label="Pregled kandidata za naslovnu">
	<!-- Stacked full-screen images: all cover the whole viewport; only `active` is shown.
	     Real <img> so per-image object-position (focal point) applies. -->
	{#each IMAGES as img, i}
		<img
			class="hero-img"
			class:show={i === active}
			src={img.url}
			alt=""
			style={`object-position:${img.pos}${img.rotate ? `;transform:rotate(${img.rotate}deg)` : ''}`}
			loading={i < 3 ? 'eager' : 'lazy'}
		/>
	{/each}

	<!-- Invisible vertical hover zones — one per image — split across the full width. -->
	<div class="hero-zones">
		{#each IMAGES as _img, i}
			<button
				class="zone"
				aria-label={`Prikaži sliku ${i + 1}`}
				onmouseenter={() => (active = i)}
				onfocus={() => (active = i)}
			></button>
		{/each}
	</div>

	<!-- Current image label (number + name), bottom-left. -->
	<div class="hero-caption">
		<span class="num">{String(active + 1).padStart(2, '0')}</span>
		<span class="sep">/</span>
		<span class="total">{String(IMAGES.length).padStart(2, '0')}</span>
		<span class="name">{IMAGES[active].name}</span>
	</div>

	<!-- Big centred wordmark (numbered.com style) — letters rise/fade in on reveal. -->
	<h1 class="hero-wordmark" class:in={introIn} aria-label="Varaždinski streličarski klub">
		{#each ['V', 'S', 'K'] as letter, i}
			<span class="wm-letter" style={`transition-delay:${0.15 + i * 0.08}s`}>{letter}</span>
		{/each}
	</h1>

	<!-- Subtext, bottom-centre. -->
	<p class="hero-tagline" class:in={introIn}>
		A Croatian archery club from Varaždin, shooting for the world since 2014.
	</p>

	<!-- Intro curtain: covers the hero, then wipes off to the left to reveal it. -->
	{#if !curtainGone}
		<div class="hero-curtain" class:wipe={revealed} aria-hidden="true"></div>
	{/if}
</div>

<!-- ── Homepage sections (below the hero) ──────────────────────────────────────── -->
<!-- Container darkened to the SPONSOR-cap navy (#081530, --color-footer), not the page
     navy, so the sections read as a distinct darker band below the hero. -->
<div class="home-sections">
	<!-- Section 1: Latest news — 3D coverflow on a black band (navy fades in at top/bottom). -->
	{#if data.news.length > 0}
		<section class="home-news">
			<!-- "VIJESTI / Sve vijesti ›" — title, slash, then the all-link inline (left). -->
			<header class="home-sec-head">
				<h2 class="home-sec-title">Vijesti</h2>
				<span class="home-sec-slash" aria-hidden="true">/</span>
				<a class="home-sec-all" href="/najnovije">
					Sve vijesti <RightArrowIcon size={11} />
				</a>
			</header>
			<!-- Full-bleed 3D coverflow (edge to edge). -->
			<div class="home-news-coverflow">
				<NewsCoverflow slides={data.news} />
			</div>
		</section>
	{/if}

	<!-- Section 2: Upcoming events teaser (horizontal scroll of RM-style EventCards). -->
	{#if upcomingTeaser.length > 0}
		<section class="home-events">
			<header class="home-sec-head">
				<h2 class="home-sec-title home-events-title">Nadolazeće</h2>
				<span class="home-sec-slash" aria-hidden="true">/</span>
				<a class="home-sec-all" href="/raspored">
					Raspored <RightArrowIcon size={11} />
				</a>
			</header>
			<div class="home-events-carousel">
				{#if evCanLeft}
					<button
						class="home-events-arrow left br-full"
						onclick={() => scrollEvents(-1)}
						aria-label="Prethodno"
					>
						<ChevronIcon direction="left" size={22} />
					</button>
				{/if}
				<ul class="home-events-row" bind:this={eventsTrack} onscroll={updateEvArrows}>
					{#each upcomingTeaser as ev (ev.id)}
						<li class="home-events-item"><EventCard {ev} /></li>
					{/each}
				</ul>
				{#if evCanRight}
					<button
						class="home-events-arrow right br-full"
						onclick={() => scrollEvents(1)}
						aria-label="Sljedeće"
					>
						<ChevronIcon direction="right" size={22} />
					</button>
				{/if}
			</div>
		</section>
	{/if}

	<!-- Section 3: Achievements highlight — RM-style rotator (image left / text right;
	     slides exit left + enter from right; auto-advances every 5s, no visible timer). -->
	{#if data.achievements.length > 0}
		{@const ach = data.achievements[achIndex]}
		<section class="home-ach">
			<header class="home-sec-head">
				<h2 class="home-sec-title home-ach-honour-title">Ponos hrvatskog streličarstva</h2>
				<span class="home-sec-slash" aria-hidden="true">/</span>
				<a class="home-sec-all" href="/postignuca">
					Sva postignuća <RightArrowIcon size={11} />
				</a>
			</header>

			<a class="home-ach-stage" href="/postignuca" aria-label="Postignuća kluba">
				{#key achIndex}
					<div class="home-ach-slide">
						<div
							class="home-ach-media"
							in:fly={{ x: 260, duration: 650, easing: cubicInOut }}
							out:fly={{ x: -260, duration: 650, easing: cubicInOut }}
						>
							{#if ach.image}
								<ImageWithLoader src={ach.image.url} alt={ach.image.alt} />
							{/if}
						</div>
						<div
							class="home-ach-text"
							in:fly={{ x: 260, duration: 650, delay: 60, easing: cubicInOut }}
							out:fly={{ x: -260, duration: 650, easing: cubicInOut }}
						>
							<span class="home-ach-count" use:countUp={{ index: achIndex, target: ach.count }}
							>{ach.count}</span
						>
							<span class="home-ach-label">{ach.label}</span>
						</div>
					</div>
				{/key}
			</a>
		</section>
	{/if}

	<!-- Section 4: Join / contact invite — full-bleed looping video with a dark fade,
	     centered text on top, "Registriraj se" button → /kontakt (Učlanjenje). -->
	<section class="home-join">
		<!-- Two clips, crossfading A→B→A→B for a seamless loop. Only `joinActive` is shown. -->
		{#each JOIN_CLIPS as clip, i}
			<video
				class="home-join-video"
				class:active={i === joinActive}
				bind:this={joinVideoEls[i]}
				autoplay={i === 0}
				muted
				playsinline
				preload="auto"
				aria-hidden="true"
				ontimeupdate={() => joinTick(i)}
			>
				<source src={clip} type="video/mp4" />
			</video>
		{/each}
		<div class="home-join-fade" aria-hidden="true"></div>
		<div class="home-join-inner">
			<h2 class="home-join-title">Postani dio <span class="home-join-gold">kluba</span></h2>
			<p class="home-join-sub">
				Pridruži se Varaždinskom streličarskom klubu.
				<span
					class="home-join-type"
					use:typewriter={{ text: 'Početnici su dobrodošli.', cycle: 7000 }}
					aria-label="Početnici su dobrodošli."
				></span>
			</p>
			<a class="home-join-btn" href="/kontakt">Registriraj se</a>
		</div>
	</section>

	<!-- Section 5: Explore the club — the shared golden "MOŽDA ĆE VAM SE SVIDJETI" block
	     with 4 cover-photo nav cards (Povijest / Identitet / Postignuća / Sponzori). -->
	<SectionExplore />
</div>

<style>
	.hero {
		position: relative;
		width: 100%;
		height: 100svh;
		margin-top: calc(-1 * var(--nav-h, 64px)); /* pull under the transparent navbar */
		overflow: hidden;
		background: #000;
	}

	/* Every image covers the WHOLE screen; crossfade between them. object-position is set
	   per image (inline) so the crop keeps the subject. */
	.hero-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.7s cubic-bezier(0.26, 1.04, 0.54, 1);
		will-change: opacity;
	}
	.hero-img.show {
		opacity: 1;
	}

	.hero-zones {
		position: absolute;
		inset: 0;
		display: flex;
		z-index: 2;
	}
	.zone {
		flex: 1 1 0;
		height: 100%;
		padding: 0;
		margin: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
		appearance: none;
	}

	.hero-caption {
		position: absolute;
		left: clamp(1rem, 3vw, 2.5rem);
		bottom: clamp(1.25rem, 4vh, 2.5rem);
		z-index: 3;
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		color: #fff;
		text-shadow: 0 1px 10px rgba(0, 0, 0, 0.7);
		font: 600 1rem/1 system-ui, sans-serif;
		pointer-events: none;
	}
	.hero-caption .num {
		font-size: 1.6rem;
		color: #ffd24a;
		font-variant-numeric: tabular-nums;
	}
	.hero-caption .sep,
	.hero-caption .total {
		opacity: 0.7;
		font-variant-numeric: tabular-nums;
	}
	.hero-caption .name {
		margin-left: 0.6rem;
		font-weight: 400;
		letter-spacing: 0.02em;
		opacity: 0.9;
	}

	/* ── Big centred wordmark (numbered.com style) ──────────────────────────────── */
	.hero-wordmark {
		position: absolute;
		inset: 0;
		z-index: 3;
		margin: 0;
		display: flex;
		align-items: flex-start; /* upper third, like numbered.com (not dead-centre) */
		justify-content: center;
		padding-top: 13vh;
		gap: 0.04em;
		color: #fff;
		font-family: Georgia, 'Times New Roman', serif; /* serif wordmark, like numbered */
		font-weight: 400;
		font-size: clamp(5rem, 22vw, 20rem);
		line-height: 1;
		letter-spacing: 0.02em;
		text-shadow: 0 2px 40px rgba(0, 0, 0, 0.45);
		pointer-events: none;
		user-select: none;
	}
	.wm-letter {
		display: inline-block;
		opacity: 0;
		transform: translateY(0.4em);
		transition:
			opacity 1.4s ease,
			transform 1.4s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.hero-wordmark.in .wm-letter {
		opacity: 1;
		transform: translateY(0);
	}

	/* ── Tagline, bottom-centre ─────────────────────────────────────────────────── */
	.hero-tagline {
		position: absolute;
		left: 50%;
		bottom: clamp(1.5rem, 5vh, 3rem);
		z-index: 3;
		transform: translateX(-50%) translateY(0.6em);
		max-width: 96vw;
		margin: 0;
		text-align: center;
		white-space: nowrap; /* keep the tagline on ONE row */
		color: #fff;
		font: 600 clamp(0.85rem, 1.7vw, 1.45rem) / 1.4 system-ui, sans-serif;
		letter-spacing: 0.03em;
		text-shadow: 0 1px 14px rgba(0, 0, 0, 0.6);
		opacity: 0;
		transition:
			opacity 0.7s ease 0.5s,
			transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.5s;
		pointer-events: none;
	}
	.hero-tagline.in {
		opacity: 0.92;
		transform: translateX(-50%) translateY(0);
	}

	/* ── Intro curtain — covers the hero, wipes off to the LEFT to reveal it ──────── */
	.hero-curtain {
		position: absolute;
		inset: 0;
		z-index: 5;
		background: #34302d;
		transform: translateY(0);
		/* falls down off the bottom to reveal the hero top→bottom */
		transition: transform 1s cubic-bezier(0.7, 0, 0.3, 1);
		will-change: transform;
	}
	.hero-curtain.wipe {
		transform: translateY(100%);
	}

	@media (prefers-reduced-motion: reduce) {
		.wm-letter,
		.hero-tagline {
			transition-duration: 0.01ms;
		}
		.hero-curtain {
			transition-duration: 0.2s;
		}
	}

	/* ── Homepage sections container ─────────────────────────────────────────────── */
	/* Darker navy than the page (the SPONSOR-cap colour #081530), so the sections below
	   the hero read as a distinct band. */
	.home-sections {
		background: var(--color-footer);
	}

	/* ── Section 1: Latest news ──────────────────────────────────────────────────── */
	/* Equal vertical rhythm: each section's TOP gap = the hero→Vijesti gap, so the spacing
	   between News / Events / Achievements is uniform. (Join↔Explore gap left as-is.) */
	.home-events,
	.home-ach {
		padding-top: clamp(8rem, 18vh, 14rem);
		padding-bottom: 0;
	}
	/* News is a BLACK band (so the coverflow reads on black). The "VIJESTI" header sits on
	   the black too. Navy (--color-footer, the surrounding band's colour) only tints the
	   very top + bottom EDGES → black runs through the whole middle, blending seamlessly
	   into the navy sections above and below. */
	.home-news {
		padding-top: clamp(20rem, 42vh, 32rem); /* bigger gap from the hero (cover) above */
		padding-bottom: 0;
		background:
			linear-gradient(
				to bottom,
				var(--color-footer) 0%,
				transparent 18%,
				transparent 82%,
				var(--color-footer) 100%
			),
			#000;
	}
	/* Achievements keeps a bottom gap so the Join video isn't flush against it. */
	.home-ach {
		padding-bottom: clamp(8rem, 18vh, 14rem);
	}
	/* Shared section header: "TITLE / LINK ›" — all inline, left-aligned (reference style). */
	.home-sec-head {
		display: flex;
		align-items: baseline;
		gap: 0.9rem;
		padding: 0 clamp(1.5rem, 4vw, 4.5rem);
		margin-bottom: clamp(1.25rem, 3vh, 2rem);
	}
	.home-sec-title {
		margin: 0;
		font-size: clamp(2.2rem, 5vw, 3.6rem);
		font-weight: 800;
		font-style: italic; /* slanted like the reference */
		letter-spacing: 0.01em;
		text-transform: uppercase;
		color: var(--color-ink); /* light text — the bg is navy */
	}
	.home-sec-slash {
		/* same height as the link text */
		font-size: clamp(1rem, 1.5vw, 1.35rem);
		font-weight: 300;
		color: rgba(255, 255, 255, 0.45);
		line-height: 1;
	}
	.home-sec-all {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 700;
		font-size: clamp(1rem, 1.5vw, 1.35rem);
		letter-spacing: 0.06em;
		text-transform: uppercase; /* "SVE VIJESTI" like "VIEW ALL" */
		text-decoration: none;
		color: rgba(255, 255, 255, 0.75);
		transition: color 0.2s ease;
	}
	.home-sec-all:hover {
		color: var(--color-accent);
	}

	/* ── Section 2: Upcoming events (padding handled by the shared rhythm rule above) ── */
	/* "Nadolazeće" sized to match the achievements honorary title. */
	.home-events-title {
		font-size: clamp(1.4rem, 3vw, 2.4rem);
	}
	/* Carousel wrapper — centered/constrained, holds the track + side arrows. */
	.home-events-carousel {
		position: relative;
		max-width: 1720px;
		margin: 0 auto;
		padding: 0 clamp(1.5rem, 4vw, 4.5rem);
	}
	/* Scroll-snap track showing EXACTLY 4 cards per view; arrows drive it, native
	   scrollbar hidden (no bottom bar). */
	.home-events-row {
		display: flex;
		gap: 1.5rem;
		margin: 0;
		padding: 0.5rem 0 1.5rem;
		list-style: none;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none; /* hide native bar (Firefox) */
	}
	.home-events-row::-webkit-scrollbar {
		display: none; /* hide native bar (WebKit) */
	}
	/* 4 fully in view: a quarter of the track minus the 3 gaps (1.5rem each). */
	.home-events-item {
		flex: 0 0 calc((100% - 3 * 1.5rem) / 4);
		scroll-snap-align: start;
	}
	/* Side arrow buttons (drive the scroll; appear only when there's more that way). */
	.home-events-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10;
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: #fff;
		color: var(--color-ink-dark);
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
		transition: background-color 0.2s ease;
	}
	.home-events-arrow:hover {
		background: var(--color-bg-secondary);
	}
	.home-events-arrow.left {
		left: clamp(0.25rem, 2vw, 2.5rem);
	}
	.home-events-arrow.right {
		right: clamp(0.25rem, 2vw, 2.5rem);
	}
	@media (max-width: 1024px) {
		.home-events-item {
			flex-basis: calc((100% - 1.5rem) / 2); /* 2 per view on tablet */
		}
	}
	@media (max-width: 720px) {
		.home-events-item {
			flex-basis: 82%; /* ~1 per view on phone */
		}
	}

	/* ── Section 3: Achievements rotator (RM-style) ──────────────────────────────── */
	/* (.home-ach padding handled by the shared rhythm rule above) */
	/* Honorary title takes the section-title slot, kept GOLD + a bit smaller than the
	   other section titles (it's a longer phrase, not a single word). */
	.home-ach-honour-title {
		color: var(--color-accent);
		font-size: clamp(1.4rem, 3vw, 2.4rem);
	}
	/* Stage clips the flying slides; the slide overlays in/out copies during the swap. */
	.home-ach-stage {
		position: relative;
		display: block;
		max-width: 1720px;
		margin: 0 auto;
		padding: 0 clamp(1.5rem, 4vw, 4.5rem);
		height: clamp(480px, 66vh, 780px); /* image height */
		overflow: hidden;
		text-decoration: none;
	}
	.home-ach-slide {
		position: absolute;
		inset: 0;
		display: grid;
		/* Image flexible (1fr → fills the space); text column a FIXED width so the image
		   doesn't resize ("pulsate") as the counting number's digit-width changes. */
		grid-template-columns: 1fr clamp(16rem, 24vw, 26rem);
		align-items: center;
		gap: clamp(1.25rem, 3vw, 3rem);
		padding: 0 clamp(1.5rem, 4vw, 4.5rem);
	}
	.home-ach-media {
		height: 100%;
		width: 100%;
		max-width: 1120px; /* keep the image from stretching the whole column */
		justify-self: start;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
	}
	/* Number + label on the SAME row, small gap, baseline-aligned. */
	.home-ach-text {
		display: flex;
		flex-direction: row;
		align-items: flex-end; /* number + label share the same bottom line */
		gap: 0.75rem; /* small gap between number and its label */
		color: var(--color-ink);
	}
	.home-ach-count {
		flex: none;
		font-size: clamp(2.8rem, 7vw, 5.5rem); /* smaller — fit number + label in the column */
		font-weight: 800;
		font-variant-numeric: tabular-nums; /* digits don't shift width as it counts */
		line-height: 0.9;
		/* nudge the glyph down so its visual bottom lines up with the label's bottom
		   (the number's line-box leaves it sitting slightly high otherwise). */
		transform: translateY(0.12em);
		color: var(--color-accent);
		text-shadow: 0 2px 30px rgba(0, 0, 0, 0.35);
	}
	.home-ach-label {
		font-size: clamp(1.05rem, 2vw, 1.7rem); /* a few px bigger */
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		line-height: 1.1;
		white-space: nowrap; /* keep the label on ONE row beside the number, every slide */
	}
	@media (max-width: 720px) {
		.home-ach-slide {
			grid-template-columns: 1fr; /* stack: image over text */
			gap: 1rem;
		}
		.home-ach-media {
			height: 55%;
		}
	}

	/* ── Section 4: Join / contact invite (video + fade + centered CTA) ──────────── */
	.home-join {
		position: relative;
		width: 100%; /* full-bleed — .home-sections is full width, no inset */
		height: clamp(680px, 100vh, 1200px); /* taller */
		overflow: hidden;
		display: grid;
		place-items: center;
	}
	.home-join-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0; /* only the active clip is shown; others wait */
		transition: opacity 0.6s ease; /* crossfade at the A↔B handoff */
	}
	.home-join-video.active {
		opacity: 1;
	}
	/* Football-Forward-style fade: DARK navy at the top (holds through the upper-middle so
	   the headline reads), then LIGHTENS toward the bottom to a translucent blue-grey. */
	.home-join-fade {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(8, 18, 38, 0.92) 0%,
			rgba(8, 18, 38, 0.85) 35%,
			rgba(40, 70, 130, 0.6) 65%,
			rgba(150, 170, 205, 0.5) 100%
		);
	}
	.home-join-inner {
		position: relative; /* above the fade */
		z-index: 1;
		max-width: min(90vw, 56rem);
		padding: 0 1.5rem;
		text-align: center;
		color: #fff;
	}
	.home-join-title {
		margin: 0 0 0.75rem;
		font-size: clamp(2.2rem, 6vw, 4.5rem);
		font-weight: 800;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		text-shadow: 0 2px 24px rgba(0, 0, 0, 0.55);
	}
	/* "kluba" — gold with a soft glow. */
	.home-join-gold {
		color: var(--color-accent);
		text-shadow:
			0 0 18px rgba(239, 181, 47, 0.55),
			0 0 36px rgba(239, 181, 47, 0.35),
			0 2px 24px rgba(0, 0, 0, 0.5);
	}
	.home-join-sub {
		margin: 0 0 2rem;
		font-size: clamp(1rem, 1.7vw, 1.45rem);
		font-weight: 500;
		line-height: 1.4;
		text-shadow: 0 1px 14px rgba(0, 0, 0, 0.6);
	}
	/* Typed "Početnici su dobrodošli." line — cornflower, with a blinking caret. */
	.home-join-type {
		color: #747bff; /* cornflower */
		font-weight: 700;
	}
	.home-join-type::after {
		content: '|';
		margin-left: 0.05em;
		font-weight: 400;
		animation: home-type-caret 0.9s steps(1) infinite;
	}
	@keyframes home-type-caret {
		0%,
		50% {
			opacity: 1;
		}
		50.01%,
		100% {
			opacity: 0;
		}
	}
	.home-join-btn {
		display: inline-block;
		padding: 0.9rem 2.4rem;
		background: var(--color-accent);
		color: #1a1205;
		font-size: clamp(1rem, 1.4vw, 1.2rem);
		font-weight: 800;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		text-decoration: none;
		border-radius: 999px;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
		transition:
			transform 0.2s ease,
			filter 0.2s ease;
	}
	.home-join-btn:hover {
		transform: translateY(-2px);
		filter: brightness(1.06);
	}

	/* ── Coverflow wrapper for the homepage news ─────────────────────────────────── */
	/* The NewsCoverflow paints its own BLACK band with a navy glow fading in at the top
	   and bottom edges, so it blends into the surrounding navy sections. Here we just let
	   the band run full-bleed and give it breathing room from the "Vijesti" header above. */
	.home-news-coverflow {
		margin-top: 0;
	}

</style>
