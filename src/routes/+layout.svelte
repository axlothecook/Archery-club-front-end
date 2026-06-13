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

	let { children } = $props();

	// ── Page transitions / loader ──────────────────────────────────────────────────
	// THE universal transition: a full-screen panel in the loader colour (#1e1f1c) wipes
	// across on EVERY in-app navigation — it slides in to cover the screen, the page
	// swaps underneath, then it slides straight off to reveal it (a continuous in-then-out
	// sweep, no hold). Replaces the old crossed-arrows RouteLoader. Direction is purely
	// forward/back:
	//   • FORWARD (clicking a link, or the browser forward button) → sweeps RIGHT→LEFT.
	//   • BACK    (browser back button / popstate going backwards)  → sweeps LEFT→RIGHT.

	const SWIPE_MS = 1100; // total duration of the single pass (off-screen → across → off)

	type Wipe = 'lr' | 'rl';
	// Going BACK (popstate with a negative delta) = returning to a previous page → L→R.
	// Everything else (link click, goto, forward button) = going to a new page → R→L.
	function wipeFor(navigation: { type: string; delta?: number | null }): Wipe {
		const isBack = navigation.type === 'popstate' && (navigation.delta ?? 0) < 0;
		return isBack ? 'lr' : 'rl';
	}

	// The wipe overlay: a single continuous pass. `wipeDir` sets which way it travels;
	// `wiping` mounts the panel + runs the keyframe animation. The page swaps at the
	// MIDPOINT (when the panel fully covers the screen).
	let wipeDir = $state<Wipe | null>(null);
	let wiping = $state(false);
	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

	onNavigate((navigation) => {
		if (!navigation.to) return;
		// Skip if there's no origin page (hard load / first paint) — the destination's
		// own loader (homepage %-counter, etc.) or plain render handles those.
		if (!navigation.from) return;

		const dir = wipeFor(navigation);

		return new Promise<void>((resolve) => {
			(async () => {
				// Start the single-pass sweep from off-screen.
				wipeDir = dir;
				wiping = true;
				// Swap the page at the midpoint — the instant the panel fully covers.
				await wait(SWIPE_MS / 2);
				resolve();
				// Let the rest of the pass carry the panel off the far edge, then unmount.
				await wait(SWIPE_MS / 2);
				wiping = false;
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

	<!-- Page-transition wipe: a full-screen #1e1f1c panel that sweeps across in ONE pass
	     (off-screen → covers → off the far edge); the page swaps at the midpoint. -->
	{#if wiping}
		<div
			class="page-wipe"
			class:dir-lr={wipeDir === 'lr'}
			class:dir-rl={wipeDir === 'rl'}
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
	/* R→L pass (forward): in from the RIGHT, across, out the LEFT. */
	.page-wipe.dir-rl {
		animation: wipe-rl 1.1s linear both;
	}
	/* L→R pass (back): in from the LEFT, across, out the RIGHT. */
	.page-wipe.dir-lr {
		animation: wipe-lr 1.1s linear both;
	}
	@keyframes wipe-rl {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(-100%);
		}
	}
	@keyframes wipe-lr {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		/* Skip the sweep — a quick fade so motion-sensitive users aren't swept across. */
		.page-wipe.dir-rl,
		.page-wipe.dir-lr {
			animation: wipe-fade 0.4s ease both;
		}
		@keyframes wipe-fade {
			0%,
			100% {
				opacity: 0;
			}
			50% {
				opacity: 1;
			}
		}
	}
</style>
