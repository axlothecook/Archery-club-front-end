<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

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
	import { tick } from 'svelte';

	let { children } = $props();

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

	onNavigate((navigation) => {
		if (!navigation.to) return;
		// Skip if there's no origin page (hard load / first paint) — the destination's
		// own loader (homepage %-counter, etc.) or plain render handles those.
		if (!navigation.from) return;

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
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
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
</style>
