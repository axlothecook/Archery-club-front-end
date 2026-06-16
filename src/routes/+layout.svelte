<script lang="ts">
	// Club crest favicon (served from /static). Replaces the default Svelte-logo SVG (whose
	// orange-red also contributed to the cold-load colour flash).
	const favicon = '/favicon.png';

	// Global theme: the Inter font (self-hosted via @fontsource) + the SCSS entry
	// (library + palette control panel). Imported once here at the root.
	import '@fontsource/inter/100.css';
	import '@fontsource/inter/300.css';
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '@fontsource/inter/800.css';
	// Italic faces (only the upright weights were loaded, so `font-style: italic`
	// rendered upright — quotes need the real italic glyphs to slant).
	import '@fontsource/inter/300-italic.css';
	import '@fontsource/inter/400-italic.css';
	import '@fontsource/inter/900-italic.css';
	import 'flag-icons/css/flag-icons.min.css';
	import '../styles/index.scss';

	import NavBar from '$lib/components/NavBar.svelte';
	import HalfScreenMenu from '$lib/components/HalfScreenMenu.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { tick } from 'svelte';

	let { children } = $props();

	const locale = $derived(page.data.locale);

	// ── Page transitions / loader ──────────────────────────────────────────────────
	// THE universal transition: a full-screen panel in the loader colour (#1e1f1c) wipes
	// across on EVERY in-app navigation — it slides in to cover the screen, the page
	// swaps underneath, then it slides straight off to reveal it (a continuous in-then-out
	// sweep, no hold). Replaces the old crossed-arrows RouteLoader. Direction is purely
	// forward/back:
	//   • FORWARD (clicking a link, or the browser forward button) → sweeps RIGHT→LEFT.
	//   • BACK    (browser back button / popstate going backwards)  → sweeps LEFT→RIGHT.

	const SWIPE_MS = 1500; // total duration of the single pass (off-screen → across → off)

	type Wipe = 'lr' | 'rl';
	// Going BACK (popstate with a negative delta) = returning to a previous page → L→R.
	// Everything else (link click, goto, forward button) = going to a new page → R→L.
	function wipeFor(navigation: { type: string; delta?: number | null }): Wipe {
		const isBack = navigation.type === 'popstate' && (navigation.delta ?? 0) < 0;
		return isBack ? 'lr' : 'rl';
	}

	// The wipe overlay runs in two phases so the OLD page is never briefly uncovered:
	//   cover  — panel slides from off-screen to fully covering the screen.
	//   (then) — swap the page + AWAIT navigation.complete, so the NEW page has rendered
	//            behind the covering panel before we uncover (no flash of the old page).
	//   reveal — panel slides off the far edge.
	// `wipeDir` sets travel direction; `wipePhase` drives the CSS. The two eased halves
	// (slow-in on cover, slow-out on reveal) read as one slow-fast-slow sweep.
	let wipeDir = $state<Wipe | null>(null);
	let wipePhase = $state<'enter' | 'cover' | 'reveal' | null>(null);
	let wipeEl = $state<HTMLDivElement>();
	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

	// Individual history-chapter pages (/klub/povijest/<slug>) get a SLIDE-UP View
	// Transition (the page rises from the bottom over the povijest list) instead of
	// the full-screen dark wipe. Detect when a chapter detail page is the origin or
	// destination so we can branch to that animation.
	const isChapterPath = (path: string | undefined) =>
		!!path && /^\/klub\/povijest\/[^/]+\/?$/.test(path);

	onNavigate((navigation) => {
		if (!navigation.to) return;
		// Skip if there's no origin page (hard load / first paint) — the destination's
		// own loader (homepage %-counter, etc.) or plain render handles those.
		if (!navigation.from) return;

		const toChapter = isChapterPath(navigation.to.url.pathname);
		const fromChapter = isChapterPath(navigation.from.url.pathname);

		// ── Chapter open/close: slide-up View Transition (no dark wipe) ──────────────
		// OPEN  (list → chapter): the new chapter page slides UP from the bottom, over
		//        the list which stays put beneath it.
		// CLOSE (chapter → list): the chapter slides back DOWN off the bottom.
		// Falls back to an instant swap if the browser lacks the View Transitions API.
		if (toChapter || fromChapter) {
			if (!document.startViewTransition) return; // no API → plain swap
			const mode = toChapter ? 'open' : 'close';
			document.documentElement.dataset.chapterVt = mode;
			return new Promise<void>((resolve) => {
				const vt = document.startViewTransition(async () => {
					resolve();
					await navigation.complete;
				});
				vt.finished.finally(() => {
					delete document.documentElement.dataset.chapterVt;
				});
			});
		}

		const dir = wipeFor(navigation);

		return new Promise<void>((resolve) => {
			(async () => {
				// 0. ENTER: mount the panel off-screen on the entering edge. Wait for Svelte to
				//    render it, then FORCE a reflow at that position so the COVER transition
				//    actually animates FROM off-screen (without the reflow the two style
				//    changes batch into one frame and the panel just snaps to covering).
				wipeDir = dir;
				wipePhase = 'enter';
				await tick();
				void wipeEl?.offsetWidth; // force reflow — commit the off-screen start position
				// 1. COVER: transition it in until it fully covers the screen.
				wipePhase = 'cover';
				await wait(SWIPE_MS / 2);
				// 2. Swap the page (now hidden behind the panel) and WAIT for it to render.
				resolve();
				await navigation.complete;
				// 3. REVEAL: slide the panel off the far edge to show the ready new page.
				wipePhase = 'reveal';
				await wait(SWIPE_MS / 2);
				wipePhase = null;
				wipeDir = null;
			})();
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Site-wide DEFAULT title + description. Pages set their own via the <Seo>
	     component; SvelteKit dedupes <svelte:head> titles so the page value wins. This
	     fallback covers any page without an explicit <Seo>. -->
	<title>{t(locale, 'clubName')}</title>
	<meta name="description" content={t(locale, 'meta.defaultDesc')} />
</svelte:head>

<div class="app-shell">
	<NavBar />
	<HalfScreenMenu />
	<!-- Content layer sits ABOVE the sticky footer (z-index) with a solid bg, so
	     scrolling up "uncovers" the footer that's pinned beneath it. -->
	<div class="content-layer">
		<!-- Spacer clears the fixed NavBar (pill + blue strip when present). -->
		<div class="nav-offset"></div>
		<main class="app-main">
			{@render children()}
		</main>
		<Footer />
	</div>

	<!-- Page-transition wipe: a full-screen #1e1f1c panel. COVER slides it in to fully
	     cover; the page then swaps + renders behind it; REVEAL slides it off. Two eased
	     halves read as one slow-fast-slow sweep, and the old page is never uncovered. -->
	{#if wipePhase}
		<div
			class="page-wipe"
			class:dir-lr={wipeDir === 'lr'}
			class:dir-rl={wipeDir === 'rl'}
			data-phase={wipePhase}
			bind:this={wipeEl}
			aria-hidden="true"
		></div>
	{/if}
</div>

<style>
	/* Global guard against horizontal overflow. If ANY element (a wide hero, a
	   100vw block, an over-wide grid) sticks out past the viewport, the document
	   becomes wider than the screen on phones: the page scrolls sideways AND the
	   fixed navbar (left:0;right:0) paints across the full document width, so it
	   looks "monitor-sized" instead of phone-sized.
	   Use overflow-x: CLIP (not hidden): `hidden` forces the computed overflow-y to
	   `auto`, turning html/body into a scroll container — which BREAKS `position:
	   sticky` descendants (the chapter cover's scroll-over, the momčad filter rail).
	   `clip` clips the horizontal overflow WITHOUT creating a scroll container, so
	   sticky keeps working while sideways scroll is still suppressed. */
	:global(html),
	:global(body) {
		overflow-x: clip;
		max-width: 100%;
	}

	.app-shell {
		display: flex;
		flex-direction: column;
		/* 100dvh (dynamic viewport height), not 100vh: on mobile, 100vh is sized to
		   the LARGE viewport (URL bar hidden), so while the bar is visible the shell
		   is taller than the screen → phantom scroll / footer pushed below the fold.
		   dvh tracks the actual visible height as the toolbar expands/collapses.
		   Fallback to 100vh first for the ~5% of browsers without dvh support. */
		min-height: 100vh;
		min-height: 100dvh;
	}
	.content-layer {
		flex: 1 0 auto;
		display: flex;
		flex-direction: column;
	}
	/* Spacer that clears the fixed NavBar (pill, plus the blue strip on section
	   pages). The NavBar sets --nav-h to its current natural height. */
	.nav-offset {
		height: var(--nav-h, 64px);
		transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}
	/* solid page bg + above the footer so the reveal-from-beneath works */
	.app-main {
		position: relative;
		z-index: 1;
		background-color: var(--color-bg);
		flex: 1 0 auto;
	}

	/* ── Page-transition wipe panel ─────────────────────────────────────────────
	   A full-screen #1e1f1c panel (the homepage loader colour) above everything
	   (incl. the NavBar). It sweeps across in ONE continuous pass: off-screen on the
	   entering edge → fully covering at the midpoint → off the far edge. The dir-*
	   class picks which way it travels. Duration = SWIPE_MS in the script. */
	.page-wipe {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: #1e1f1c;
		pointer-events: none;
		will-change: transform;
	}
	/* Two-phase transform (each half = SWIPE_MS/2 = 0.75s). COVER eases IN (slow start,
	   accelerating into full cover); REVEAL eases OUT (decelerating to a slow exit) — so the
	   combined motion reads as one slow-fast-slow sweep, with a render gap in the middle. */
	.page-wipe[data-phase='cover'] {
		transition: transform 0.75s cubic-bezier(0.6, 0, 1, 1); /* ease-in */
	}
	.page-wipe[data-phase='reveal'] {
		transition: transform 0.75s cubic-bezier(0, 0, 0.4, 1); /* ease-out */
	}
	/* enter = instant off-screen start position (no transition), then cover transitions in. */
	.page-wipe[data-phase='enter'] {
		transition: none;
	}
	/* dir-rl (forward, travels LEFT): enter from the RIGHT, cover at 0, out the LEFT. */
	.page-wipe.dir-rl[data-phase='enter'] {
		transform: translateX(100%);
	}
	.page-wipe.dir-rl[data-phase='cover'] {
		transform: translateX(0);
	}
	.page-wipe.dir-rl[data-phase='reveal'] {
		transform: translateX(-100%);
	}
	/* dir-lr (back, travels RIGHT): enter from the LEFT, cover at 0, out the RIGHT. */
	.page-wipe.dir-lr[data-phase='enter'] {
		transform: translateX(-100%);
	}
	.page-wipe.dir-lr[data-phase='cover'] {
		transform: translateX(0);
	}
	.page-wipe.dir-lr[data-phase='reveal'] {
		transform: translateX(100%);
	}

	@media (prefers-reduced-motion: reduce) {
		/* No sweep — just hold the cover briefly (a quick fade) so motion-sensitive users
		   aren't swept across; the cover→reveal still hides the swap. */
		.page-wipe {
			transition: opacity 0.25s ease !important;
			transform: none !important;
		}
		.page-wipe[data-phase='reveal'] {
			opacity: 0;
		}
	}

	/* ── Chapter open/close: slide-up View Transition ───────────────────────────
	   When opening/closing a history chapter, the page snapshots animate so the new
	   chapter rises from the bottom (open) or drops off the bottom (close), while the
	   other page stays still underneath. We disable the default cross-fade and drive
	   the incoming/outgoing snapshots with slide keyframes. Keyed on the html
	   data-attribute set in onNavigate, so normal navigations are unaffected. */

	/* Lift the fixed NavBar (black pill + blue strip) OUT of the sliding `root`
	   snapshot so it stays pinned on top while only the page content slides. Only
	   during the chapter transition (the name is set before the snapshot is taken). */
	:global(html[data-chapter-vt] .navbar) {
		view-transition-name: navbar;
	}
	/* The navbar snapshot holds still (no slide) and stays above the sliding content. */
	:global(html[data-chapter-vt]::view-transition-group(navbar)) {
		z-index: 100;
	}
	:global(html[data-chapter-vt]::view-transition-old(navbar)),
	:global(html[data-chapter-vt]::view-transition-new(navbar)) {
		animation: none;
	}
	:global(html[data-chapter-vt]::view-transition-old(root)),
	:global(html[data-chapter-vt]::view-transition-new(root)) {
		/* both share the same group box; we position them and animate individually */
		animation: none;
		mix-blend-mode: normal;
	}
	/* OPEN: the list (old) stays put beneath; the chapter (new) slides UP from below. */
	:global(html[data-chapter-vt='open']::view-transition-old(root)) {
		animation: none; /* list holds still */
		z-index: 0;
	}
	:global(html[data-chapter-vt='open']::view-transition-new(root)) {
		z-index: 1;
		animation: chapter-slide-up 1s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	/* CLOSE: the chapter (old) slides DOWN off the bottom; the list (new) holds beneath. */
	:global(html[data-chapter-vt='close']::view-transition-new(root)) {
		animation: none; /* list holds still */
		z-index: 0;
	}
	:global(html[data-chapter-vt='close']::view-transition-old(root)) {
		z-index: 1;
		animation: chapter-slide-down 1s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	@keyframes chapter-slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	@keyframes chapter-slide-down {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(100%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(html[data-chapter-vt]::view-transition-old(root)),
		:global(html[data-chapter-vt]::view-transition-new(root)) {
			animation-duration: 0.01ms !important;
		}
	}
</style>
