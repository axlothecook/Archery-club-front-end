<script lang="ts">
	// Homepage. Hero (numbered.com "MediasMouse" style): the cover images are stacked
	// FULL-SCREEN (each covers the viewport, object-fit:cover) and only ONE shows at a
	// time; invisible vertical hover ZONES swap which image shows (crossfade) as the cursor
	// moves left↔right. Below the hero: News (3D coverflow), Events, Achievements, Bows,
	// Join CTA, and the Explore block.
	//
	// CROP: object-fit:cover always crops to fill (screen ~2.16:1; photos are 1.5:1 or
	// portrait). Per-image `pos` (object-position) keeps the SUBJECT in frame instead of a
	// blind center crop (MDN focal-point art-direction).

	import NewsCoverflow from '$lib/components/NewsCoverflow.svelte';
	import NewsHero from '$lib/components/NewsHero.svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import EventCard from '$lib/components/EventCard.svelte';
	import SectionExplore from '$lib/components/SectionExplore.svelte';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import RightArrowIcon from '$lib/components/icons/RightArrowIcon.svelte';
	import CopyrightIcon from '$lib/components/icons/CopyrightIcon.svelte';
	import BowViewer from '$lib/components/bow/BowViewer.svelte';
	import { BOW_INFO, BOW_MODEL, BOW_DEMO, BOW_HOME_ORDER } from '$lib/bow';
	import { reveal } from '$lib/actions/reveal';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	let { data } = $props();

	// Homepage events teaser: the next few upcoming competitions (soonest first).
	const upcomingTeaser = $derived(data.upcoming.slice(0, 8));

	// PHONE news (PSG style): the first article is the big hero square, the next 6 are
	// ArticleCards in a 2-up grid. Desktop keeps the 3D coverflow instead.
	const phoneNewsHero = $derived(data.news[0]);
	const phoneNewsCards = $derived(data.news.slice(1, 7));

	// Phone flag. The desktop 3D NewsCoverflow (8 cards, each with permanent
	// `will-change:transform` + a `-webkit-box-reflect` mirror + `preserve-3d`) is heavy:
	// CSS `display:none` still leaves those nodes in the DOM incurring style-recalc + layer
	// churn, which measurably janked the phone Vijesti scroll. So we DON'T RENDER it on
	// phone at all (`{#if !isPhone}` below) — the phone uses the light hero+grid instead.
	let isPhone = $state(false);
	onMount(() => {
		const mq = window.matchMedia('(max-width: 720px)');
		const sync = () => (isPhone = mq.matches);
		sync();
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	// ── Bows: one panel, click-through tabs (like the archer page's stats/results tabs) ──
	// The user clicks a bow-type tab; the single panel below shows that bow. A sliding
	// underline glides to the active tab.
	let activeBow = $state<(typeof BOW_HOME_ORDER)[number]>(BOW_HOME_ORDER[0]);
	let bowTabsEl = $state<HTMLElement>();
	let bowUlLeft = $state(0);
	let bowUlWidth = $state(0);
	const activeBowInfo = $derived(BOW_INFO[activeBow]);
	const activeBowModel = $derived(BOW_MODEL[activeBow]);
	$effect(() => {
		void activeBow; // re-measure when the active bow tab changes
		const el = bowTabsEl?.querySelector<HTMLElement>('.home-bow-tab.active');
		if (!el) return;
		bowUlLeft = el.offsetLeft;
		bowUlWidth = el.offsetWidth;
	});

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
	// Only auto-advance while the achievements section is actually ON SCREEN. The advance
	// swaps the {#key achIndex} slide with `fly` transitions (which read layout) + runs the
	// count-up — a forced-reflow burst. Left running unconditionally (the old behaviour), it
	// fired every 5s even while the user was scrolling a DIFFERENT section, stuttering that
	// scroll. Gating on visibility means the bursts only happen when the section is in view
	// (where they're the point) and never interfere with scrolling elsewhere.
	let achSectionEl: HTMLElement | undefined = $state();
	let achInView = $state(false);
	$effect(() => {
		const el = achSectionEl;
		if (!el) return;
		const io = new IntersectionObserver(([e]) => (achInView = e.isIntersecting), {
			// Only count as "in view" once the section is well into the viewport (matches the
			// later reveal trigger), so the rotator's fly-in + count-up don't run while the
			// user is still scrolling toward it.
			rootMargin: '0px 0px -35% 0px'
		});
		io.observe(el);
		return () => io.disconnect();
	});
	$effect(() => {
		if (achCount <= 1 || !achInView) return;
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
		// Only run the loop while the line is ON SCREEN. Left running unconditionally, the
		// 7s re-type loop fired its char-by-char DOM mutations even while the user was
		// scrolling a different section, causing a periodic hitch (~every few scroll passes).
		// IntersectionObserver pauses it off-screen → no interference with scrolling elsewhere.
		let loop: ReturnType<typeof setInterval> | undefined;
		const io = new IntersectionObserver(([e]) => {
			if (e.isIntersecting && !loop) {
				runOnce();
				loop = setInterval(runOnce, cycle);
			} else if (!e.isIntersecting && loop) {
				clearInterval(loop);
				loop = undefined;
				clearAll();
			}
		});
		io.observe(node);
		return {
			destroy: () => {
				io.disconnect();
				if (loop) clearInterval(loop);
				clearAll();
			}
		};
	}

	const BASE = 'https://images.axlothecook.com/archery/front-page/';

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
		// 2026-06-13: swapped together-2 ↔ amanda-17, then dropped the first 6 — these 6 remain.
		// `credit` = the photo's source, shown bottom-left with a © mark.
		{ file: 'amanda-21.jpg', pos: 'center 35%', credit: 'World Archery' }, // 1
		{ file: 'alen-3.jpg', pos: 'center 35%', credit: 'World Archery' }, // 2
		{ file: 'leo-3.jpg', pos: 'center 35%', credit: 'Freyja Benedikts' }, // 3
		{ file: 'alen-6.jpg', pos: 'center 35%', credit: 'World Archery' }, // 4
		{ file: 'amanda-17.jpg', pos: 'center 35%', credit: 'Roman Sputo' }, // 5
		{ file: 'alen-12.jpg', pos: 'center 35%', credit: 'World Archery' } // 6
	].map((x) => ({
		url: BASE + x.file,
		name: x.file.replace(/\.jpg$/, ''),
		pos: x.pos,
		credit: x.credit,
		rotate: 'rotate' in x ? (x as { rotate: number }).rotate : 0
	}));

	// POTENTIAL = the running shortlist (survivors from EVERY round so far). 2026-06-13:
	// new-batch survivors + alen-6 joined the round-1 eight → 17 total. With the leftover
	// "rest" now dropped from POOL, POTENTIAL == POOL.
	const POTENTIAL: string[] = [
		'amanda-21',
		'alen-3',
		'leo-3',
		'alen-6',
		'amanda-17',
		'alen-12'
	];

	// HIDDEN = images parked OUT of the shown set but kept IN the pool (not displayed,
	// not removed). 2026-06-13: emptied — all 12 now show (previously-hidden 6 first, then
	// the previously-shown 6, per the POOL order above).
	const HIDDEN: string[] = [];

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
	// True once the wordmark's intro letter-animation has finished — drops the temporary
	// `will-change` promotion on the letters so they don't keep a compositor layer for life.
	let wordmarkDone = $state(!freshLoad);

	// The hero image URLs the loader waits on (so the % tracks the real hero images).
	const heroAssets = IMAGES.map((img) => img.url);

	// Gap between the loader fading out and the VSK wordmark + tagline animating in.
	const INTRO_DELAY = 900;

	// Lift the pre-paint #1e1f1c backstop (set in app.html) once the PageLoader's own
	// overlay has painted, so the handoff is seamless (both are #1e1f1c) with no flash.
	onMount(() => {
		if (!freshLoad) {
			document.documentElement.removeAttribute('data-prepaint');
			return;
		}
		requestAnimationFrame(() =>
			requestAnimationFrame(() => document.documentElement.removeAttribute('data-prepaint'))
		);
	});

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
		// After the wordmark letters finish their 1.4s fade-in (+ the 0.15-0.31s stagger),
		// drop the temporary will-change layer promotion (intro is over; text is now static).
		setTimeout(() => (wordmarkDone = true), INTRO_DELAY + 1800);
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

	<!-- Photo-source credit for the current image, bottom-left (© + source). Fades in with
	     the intro (alongside the tagline), so it's visible after the curtain reveal. -->
	{#if IMAGES[active].credit}
		<div class="hero-credit" class:in={introIn}>
			<CopyrightIcon size={13} />
			<span class="hero-credit-name">{IMAGES[active].credit}</span>
		</div>
	{/if}

	<!-- Big centred wordmark (numbered.com style) — letters rise/fade in on reveal. -->
	<h1
		class="hero-wordmark"
		class:in={introIn}
		class:done={wordmarkDone}
		aria-label="Varaždinski streličarski klub"
	>
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
		<section class="home-news" use:reveal={{ rootMargin: '0px 0px 20% 0px' }}>
			<!-- "VIJESTI / Sve vijesti ›" — title, slash, then the all-link inline (left). -->
			<header class="home-sec-head">
				<h2 class="home-sec-title">Vijesti</h2>
				<span class="home-sec-slash" aria-hidden="true">/</span>
				<a class="home-sec-all" href="/najnovije">
					Sve vijesti <RightArrowIcon size={11} />
				</a>
			</header>
			<!-- DESKTOP: full-bleed 3D coverflow (edge to edge). NOT rendered on phone (heavy
			     3D/reflection layers janked the phone scroll even while display:none). -->
			{#if !isPhone}
				<div class="home-news-coverflow">
					<NewsCoverflow slides={data.news} />
				</div>
			{/if}

			<!-- PHONE (PSG style): one big hero square + a 2-up grid of ArticleCards. Each
			     card fades+slides in individually AS it scrolls into view (per-card reveal,
			     lightly staggered) rather than the whole section at once — matches the PSG
			     news layout's scroll-in. `content-visibility: auto` (in the phone CSS) also
			     lets off-screen cards skip rendering until they near the viewport. -->
			<div class="home-news-phone">
				{#if phoneNewsHero}
					<div use:reveal={{ rootMargin: '0px 0px -10% 0px' }}>
						<NewsHero article={phoneNewsHero} />
					</div>
				{/if}
				{#if phoneNewsCards.length}
					<ul class="home-news-phone-grid">
						{#each phoneNewsCards as a, i (a.slug)}
							<li class="cv-card" use:reveal={{ rootMargin: '0px 0px -8% 0px', delay: (i % 2) * 90 }}>
								<ArticleCard article={a} />
							</li>
						{/each}
					</ul>
				{/if}
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
		<!-- Achievements reveal LATER than the other sections: a negative bottom rootMargin
		     means it only fires once the user has scrolled ~35% INTO the section (almost in
		     position), not when its top edge first peeks in. Keeps its fly-in + count-up off
		     the main thread until the user is actually arriving at it. -->
		<section class="home-ach" bind:this={achSectionEl} use:reveal={{ rootMargin: '0px 0px -35% 0px' }}>
			<header class="home-sec-head">
				<h2 class="home-sec-title home-ach-honour-title">Ponos hrvatskog streličarstva</h2>
				<span class="home-sec-slash" aria-hidden="true">/</span>
				<a class="home-sec-all" href="/postignuca">
					Sva postignuća <RightArrowIcon size={11} />
				</a>
			</header>

			<a class="home-ach-stage" href="/postignuca" aria-label="Postignuća kluba">
				{#key achIndex}
					<!-- ONE shared fly transition on the whole slide so the image + text move
					     together as a single unit (was two separate fly transitions — image with
					     no delay, text with a 60ms delay — which read as two animations). -->
					<div
						class="home-ach-slide"
						in:fly={{ x: 260, duration: 650, easing: cubicInOut }}
						out:fly={{ x: -260, duration: 650, easing: cubicInOut }}
					>
						<div
							class="home-ach-media"
							class:ach-shift-left={ach.slot === 'europeanRecords'}
						>
							{#if ach.image}
								<ImageWithLoader src={ach.image.url} alt={ach.image.alt} />
							{/if}
						</div>
						<div class="home-ach-text">
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

	<!-- Section 3.5: Bows the club's best archers use — ONE panel with click-through tabs
	     (Klasični / Složeni / Goli), like the archer page's stats/results tabs. The selected
	     bow shows its live 3D model (BowViewer) + a demo intro + the shared model description.
	-->
	<section class="home-bows" use:reveal={{ rootMargin: '0px 0px 20% 0px' }}>
		<header class="home-sec-head">
			<h2 class="home-sec-title home-bows-title">Lukovi najboljih streličara</h2>
		</header>

		<!-- Tabs: one per bow type, with a sliding gold underline. -->
		<nav class="home-bow-tabs" bind:this={bowTabsEl} aria-label="Tip luka">
			{#each BOW_HOME_ORDER as bow}
				<button
					class="home-bow-tab"
					class:active={activeBow === bow}
					type="button"
					onclick={() => (activeBow = bow)}
				>
					{BOW_INFO[bow].title}
				</button>
			{/each}
			<span
				class="home-bow-underline"
				style="--ul-left:{bowUlLeft}px; --ul-width:{bowUlWidth}px;"
				aria-hidden="true"
			></span>
		</nav>

		<!-- Single panel for the active bow. -->
		<div class="home-bow">
			<div class="home-bow-media">
				{#key activeBow}
					<BowViewer
						url={activeBowModel.url}
						alt={activeBowInfo.title}
						fixRotation={activeBowModel.fixRotation}
						yOffset={activeBowModel.yOffset}
						spinDir={activeBowModel.spinDir}
					/>
				{/key}
			</div>
			<div class="home-bow-text">
				<!-- Re-keyed on the active bow so the text animates in (slide + fade) on switch. -->
				{#key activeBow}
					<div
						class="home-bow-text-inner"
						in:fly={{ x: 40, duration: 450, easing: cubicInOut }}
					>
						<p class="home-bow-body">{BOW_DEMO[activeBow].intro} {activeBowInfo.body}</p>
						<!-- Required model-licence attribution (CC). -->
						<p class="home-bow-credit">
							3D model: <a href={activeBowModel.credit.url} target="_blank" rel="noopener"
								>{activeBowInfo.title} by {activeBowModel.credit.author}</a
							>
							({activeBowModel.credit.license})
						</p>
					</div>
				{/key}
			</div>
		</div>
	</section>

	<!-- Section 4: Join / contact invite — full-bleed looping video with a dark fade,
	     centered text on top, "Registriraj se" button → /kontakt (Učlanjenje). -->
	<section class="home-join" use:reveal={{ rootMargin: '0px 0px 20% 0px' }}>
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
	<div use:reveal={{ rootMargin: '0px 0px 20% 0px' }}>
		<SectionExplore />
	</div>
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
		-webkit-tap-highlight-color: transparent; /* no blue tap-flash on the cover */
	}

	/* Photo-source credit, bottom-left: © mark + source name. A bit smaller than the old
	   image-name caption (which sat at 1rem). Fades in with the intro (like the tagline)
	   so it shows up after the curtain reveal. */
	.hero-credit {
		position: absolute;
		left: clamp(1rem, 3vw, 2.5rem);
		bottom: clamp(1.25rem, 4vh, 2.5rem);
		z-index: 3;
		display: flex;
		align-items: center;
		gap: 0.35rem;
		color: #fff;
		text-shadow: 0 1px 10px rgba(0, 0, 0, 0.7);
		font: 500 0.85rem/1 system-ui, sans-serif;
		letter-spacing: 0.02em;
		opacity: 0;
		transform: translateY(0.6em);
		transition:
			opacity 0.7s ease 0.5s,
			transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.5s;
		pointer-events: none;
	}
	.hero-credit.in {
		opacity: 0.9;
		transform: translateY(0);
	}
	.hero-credit :global(svg) {
		flex: none;
		opacity: 0.85;
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
		/* Smaller shadow blur: a 40px blur on this huge wordmark is a very large per-frame
		   paint while the letters animate in (cover-intro jank). 18px still reads as a soft
		   glow but costs far less to rasterise. */
		text-shadow: 0 2px 18px rgba(0, 0, 0, 0.5);
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
		/* During the 1.4s intro the letters fade+rise while carrying the wordmark's big
		   blurred text-shadow — repainting that shadow every frame is what made the cover
		   text animation jank. Promote each letter to its own layer for the animation so the
		   shadow rasterises ONCE and only the layer is moved/faded by the compositor. The
		   layer is dropped after the intro finishes (cleared by `.hero-wordmark.in.done`). */
		will-change: opacity, transform;
	}
	.hero-wordmark.in .wm-letter {
		opacity: 1;
		transform: translateY(0);
	}
	/* After the intro completes, drop the promotion (no permanent layer for static text). */
	.hero-wordmark.done .wm-letter {
		will-change: auto;
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
		.hero-tagline,
		.hero-credit {
			transition-duration: 0.01ms;
		}
		.hero-curtain {
			transition-duration: 0.2s;
		}
	}

	/* ── PHONE hero tweaks ───────────────────────────────────────────────────────── */
	@media (max-width: 720px) {
		/* The hero crossfade only fires on HOVER/focus (the vertical zones) — which phones
		   don't have, so the active image never changes here. The base `will-change: opacity`
		   would otherwise keep all 5 FULL-SCREEN hero images permanently promoted to their own
		   GPU layers (large textures at high DPR) for an animation that never runs on phone —
		   pure compositor memory pressure during scroll. Drop the hint on phone. */
		.hero-img {
			will-change: auto;
		}
		/* ── SIMPLIFIED PHONE INTRO ─────────────────────────────────────────────────
		   On phone the cover intro is ONE cheap opacity fade instead of separately
		   animating the VSK letters (translateY), tagline (translateX/Y), and credit. Moving
		   several large, shadowed elements at once janked low-end phones; a pure opacity fade
		   composites cheaply. Desktop keeps the full staggered intro. */
		.wm-letter {
			transform: none !important; /* no per-letter rise */
			transition: opacity 0.6s ease !important; /* fade only, no stagger delay */
			will-change: auto !important; /* no need to promote for a plain fade */
		}
		.hero-wordmark.in .wm-letter {
			transform: none !important;
		}
		.hero-tagline {
			/* The phone tagline is full-width (left:0;right:0; centred by text-align), NOT
			   left:50%, so it must NOT carry translateX(-50%) — that shoved it off-screen left.
			   Just drop the translateY rise and fade. */
			transform: none !important;
			transition: opacity 0.6s ease 0.3s !important;
		}
		.hero-tagline.in {
			transform: none !important;
		}
		.hero-credit {
			transform: none !important;
			transition: opacity 0.6s ease 0.3s !important;
		}
		.hero-credit.in {
			transform: none !important;
		}
		/* Fade the hero photo into the navy sections below (like desktop's cover→body
		   blend). A bottom gradient transparent→navy sits above the zones/text but the
		   wordmark/tagline (z-index 3) stay readable on top. */
		.hero::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 38%;
			z-index: 1; /* above the images (0), below the wordmark/tagline/credit (3) */
			pointer-events: none;
			background: linear-gradient(to bottom, transparent 0%, var(--color-footer) 100%);
		}
		/* Bigger VSK wordmark on phone. */
		.hero-wordmark {
			font-size: clamp(7rem, 34vw, 14rem);
		}
		/* Tagline: allow it to WRAP (was nowrap, which overflowed/clipped) with side
		   padding so it never touches the screen edges. Span full width + centre the
		   text instead of the left:50%/translateX centring (which a wide box breaks). */
		.hero-tagline {
			left: 0;
			right: 0;
			transform: translateY(0.6em); /* keep only the vertical intro offset */
			white-space: normal;
			max-width: 100%;
			padding: 0 1.25rem;
			box-sizing: border-box;
		}
		.hero-tagline.in {
			transform: translateY(0);
		}
		/* Photo credit lower toward the bottom-left corner (clear of the tagline). */
		.hero-credit {
			left: 1rem;
			bottom: 0.6rem;
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
	.home-ach,
	.home-bows {
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
	/* Bows is the last section before the Join video — it carries the bottom gap so the
	   video isn't flush against it (matches the inter-section rhythm above). */
	.home-bows {
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
	/* "Nadolazeće" uses the full .home-sec-title size (mirrors "Vijesti"). */
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
		/* Match Vijesti's 1.25rem side gutter across every section inside the navy
		   container (headers + each section's content), so the whole page lines up. */
		.home-sec-head,
		.home-bow-tabs,
		.home-bow,
		.home-join-inner {
			padding-left: 1.25rem;
			padding-right: 1.25rem;
		}
		/* The section header (TITLE / link) is nowrap by default; at the bigger phone
		   title size the "/ link" can overflow the right edge. Allow it to WRAP. For the
		   LONGER titles (Nadolazeće/Ponos/Lukovi) force the title onto its own line so the
		   slash + link drop to the next line TOGETHER (dash beside the link). VIJESTI is
		   short — it keeps "/ Sve vijesti" on the SAME row (no forced wrap). */
		.home-sec-head {
			flex-wrap: wrap;
		}
		.home-events .home-sec-title,
		.home-ach .home-sec-title,
		.home-bows .home-sec-title {
			flex-basis: 100%;
		}
		/* A touch more space between wrapped title rows (e.g. the long Ponos title). */
		.home-sec-title {
			line-height: 1.18;
		}
		/* UNIFORM visual gap (~100px) between sections on phone (Vijesti→Nadolazeće→
		   Ponos→Lukovi→Join). The per-section padding-top is tuned to compensate for the
		   differing bottom whitespace of each section's content, so the gaps READ equal:
		   events lands ~100 at 5rem; ach needs a bit more, bows a bit less.
		   EXEMPT: cover→Vijesti (.home-news padding-top) + Join→Explore (golden block). */
		.home-events {
			padding-top: 5rem; /* → ~100px gap above Nadolazeće (the reference) */
		}
		.home-ach {
			padding-top: 6.25rem; /* +20px so the gap above Ponos matches (~100px) */
		}
		.home-bows {
			padding-top: 4.5rem; /* -8px so the gap above Lukovi matches (~100px) */
			padding-bottom: 5rem; /* Lukovi → Join gap */
		}
		.home-events-item {
			flex-basis: 82%; /* ~1 per view on phone */
			scroll-snap-stop: always; /* one card per swipe (like the Postignuća carousel) */
		}
		/* PHONE: no arrows — swipe only (arrows stay on desktop). */
		.home-events-arrow {
			display: none;
		}
		/* A touch of inner gutter so the next card peeks, hinting the swipe. */
		.home-events-carousel {
			padding: 0 1.25rem;
		}
	}

	/* ── Section 3: Achievements rotator (RM-style) ──────────────────────────────── */
	/* (.home-ach padding handled by the shared rhythm rule above) */
	/* Honorary title takes the section-title slot, kept GOLD; uses the full
	   .home-sec-title size (mirrors "Vijesti"). */
	.home-ach-honour-title {
		color: var(--color-accent);
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
		will-change: transform; /* promote to its own layer so the slide fly is smooth */
	}
	/* Number + label on the SAME row, small gap, baseline-aligned. */
	.home-ach-text {
		display: flex;
		flex-direction: row;
		align-items: flex-end; /* number + label share the same bottom line */
		gap: 0.75rem; /* small gap between number and its label */
		color: var(--color-ink);
		will-change: transform; /* smooth fly on slide switch */
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
		/* PHONE: the text sits ON the image (overlaid), not in a column beside/under it.
		   The image fills the slide and is TALLER; the count + label overlay the bottom
		   with a dark scrim for legibility. The count animation is unchanged. */
		.home-ach-stage {
			height: clamp(420px, 60vh, 560px); /* taller image area */
			padding: 0 1.25rem; /* match the other phone sections' side gutter */
		}
		.home-ach-slide {
			display: block; /* single layer; the media fills it, text overlays */
			padding: 0 1.25rem;
		}
		.home-ach-media {
			position: absolute;
			inset: 0 1.25rem; /* fill the slide (minus the side gutter) */
			height: auto;
			max-width: none;
			border-radius: 0; /* square corners on phone (no curved image corners) */
		}
		.home-ach-media :global(img) {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
		/* Only the "Europskih rekorda" slide shows more of its LEFT side. */
		.home-ach-media.ach-shift-left :global(img) {
			object-position: 20% center;
		}
		/* Dark gradient scrim at the bottom so the overlaid text is readable. */
		.home-ach-media::after {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: 0; /* match the square image corners on phone */
			background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 45%);
			pointer-events: none;
		}
		.home-ach-text {
			position: absolute;
			left: 2.25rem; /* 1.25rem stage gutter + 1rem inset from the image edge */
			right: 2.25rem;
			bottom: 2.25rem; /* lifted 1rem up from the image bottom edge */
			z-index: 1; /* above the image + scrim */
		}
		/* Bigger count + label on the phone card (the label keeps nowrap, so this is
		   sized to stay on one row for the longest labels). */
		.home-ach-count {
			font-size: 4.2rem;
		}
		.home-ach-label {
			font-size: 1.4rem;
		}
	}

	/* ── Section 3.5: Bows the club's best archers use (tabbed, single panel) ─────── */
	/* "Lukovi najboljih streličara" uses the full .home-sec-title size (mirrors "Vijesti"). */
	/* Tabs (Klasični / Složeni / Goli) with a sliding gold underline — same pattern as
	   the archer page's stats/results tabs. */
	.home-bow-tabs {
		position: relative; /* anchor for the sliding underline */
		display: flex;
		gap: clamp(1.25rem, 3vw, 2.5rem);
		max-width: 1720px;
		margin: 0 auto clamp(1.5rem, 4vh, 2.5rem);
		padding: 0 clamp(1.5rem, 4vw, 4.5rem);
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
	}
	.home-bow-tab {
		position: relative;
		padding: 0 0 0.5rem;
		font: inherit;
		font-size: clamp(0.9rem, 1.6vw, 1.2rem);
		font-weight: 800;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
		background: none;
		border: 0;
		cursor: pointer;
		transition: color 0.18s ease;
	}
	.home-bow-tab:hover,
	.home-bow-tab.active {
		color: var(--color-ink);
	}
	/* ONE underline that SLIDES between tabs. --ul-left/--ul-width come from the active
	   tab's offsetLeft/offsetWidth, which are already measured relative to this padded
	   nav (its offsetParent), so no padding is added here. */
	.home-bow-underline {
		position: absolute;
		bottom: -1px;
		left: var(--ul-left, 0px);
		width: var(--ul-width, 0px);
		height: 2px;
		background: var(--color-accent);
		transition:
			left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	/* The single active-bow panel: slim/tall 3D viewer on the left, text on the right. */
	.home-bow {
		max-width: 1720px;
		margin: 0 auto;
		padding: 0 clamp(1.5rem, 4vw, 4.5rem);
		display: grid;
		grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.28fr);
		align-items: center;
		gap: clamp(1.5rem, 4vw, 4rem);
	}
	.home-bow-media {
		width: 100%;
		height: clamp(360px, 56vh, 600px);
		border-radius: 12px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.03);
	}
	.home-bow-media :global(canvas) {
		width: 100% !important;
		height: 100% !important;
	}
	.home-bow-body {
		margin: 0;
		font-size: clamp(0.95rem, 1.3vw, 1.1rem);
		line-height: 1.6;
		color: var(--color-ink);
	}
	.home-bow-credit {
		margin: 1rem 0 0;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.5);
	}
	.home-bow-credit a {
		color: rgba(255, 255, 255, 0.7);
		text-decoration: underline;
	}
	@media (max-width: 720px) {
		.home-bow {
			grid-template-columns: 1fr; /* stack: model over text */
		}
		.home-bow-media {
			height: clamp(240px, 38vh, 360px);
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
	/* The phone PSG news block is hidden on desktop (coverflow shows instead). */
	.home-news-phone {
		display: none;
	}

	/* Phone: swap the 3D coverflow for the PSG hero + 2-up ArticleCard grid. */
	@media (max-width: 720px) {
		/* "Postani dio kluba" on ONE row, sized to fit the phone width (this block is
		   AFTER the base .home-join-title rule, so it wins). */
		.home-join-title {
			font-size: 1.7rem;
			white-space: nowrap;
		}
		.home-news-coverflow {
			display: none;
		}
		.home-news-phone {
			display: block;
			padding: 0 1.25rem;
			/* No extra top gap — the section's shared .home-sec-head bottom margin already
			   provides the title→content gap, so Vijesti now matches every other section. */
			margin-top: 0;
		}
		/* PHONE: the news section is plain NAVY (no black band, no edge-fades) — the
		   permanent section navy that runs through the whole page. The hero photo fades
		   into this navy via the .hero::after below. Bigger top gap from the hero. */
		.home-news {
			padding-top: clamp(6rem, 14vh, 10rem);
			padding-bottom: 3rem;
			background: none; /* drop the black + navy-edge gradient → show the navy bg */
		}
		.home-news-phone-grid {
			list-style: none;
			margin: 1.5rem 0 0;
			padding: 0;
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 1.5rem 1.25rem;
		}
		/* Off-screen news cards skip rendering (style/layout/paint) until they near the
		   viewport — the browser only does that work as the card scrolls in. Cuts the paint
		   cost of the whole grid during scroll. `contain-intrinsic-size` reserves an estimated
		   box so the page height / scrollbar don't jump as cards render in (web.dev guidance). */
		.cv-card {
			content-visibility: auto;
			contain-intrinsic-size: auto 220px;
		}
		/* The news band is BLACK, so the ArticleCards' default navy title / grey date are
		   unreadable here — lighten them to white on this page only. */
		.home-news-phone :global(.article-card-title) {
			color: #fff;
		}
		.home-news-phone :global(.article-card-date) {
			color: rgba(255, 255, 255, 0.7);
		}
	}

</style>
