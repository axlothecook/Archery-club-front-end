<script lang="ts">
	// Full-screen page loader: a #34302d overlay with a centred 0→100% counter that
	// tracks REAL asset loading. Pass the URLs to wait for via `assets`; the loader
	// preloads each, ticks the percentage up as they finish, and once everything is
	// loaded (100%) fades out over 0.7s to reveal the page. A safety timeout guarantees
	// it never gets stuck on a broken/slow asset.
	//
	//   <PageLoader assets={[coverUrl, modelUrl, ...]} />
	//
	// SHARED — used by the archer profile page now; the homepage can reuse it.
	import { onMount } from 'svelte';

	let {
		assets = [],
		/** Hard cap (ms): force-finish even if an asset never loads. */
		timeout = 8000,
		/** Fires the moment the loader starts fading out (the page becomes visible), so
		 *  the page can kick off intro animations only AFTER the loader is gone. */
		onreveal
	}: { assets?: string[]; timeout?: number; onreveal?: () => void } = $props();

	// `pct` is the DISPLAYED number; it eases toward `target` (the REAL load progress)
	// each frame so the count visibly climbs instead of jumping. `done` flips after the
	// fade so the overlay leaves the DOM; `hiding` triggers the 0.7s fade.
	let pct = $state(0);
	let target = $state(0); // real progress 0–100 (set as assets finish)
	let hiding = $state(false);
	let done = $state(false);

	// Preload one URL → resolves when loaded OR errored (we don't want a 404 to hang
	// the bar). Images use decode() so the % reflects when they're actually paintable.
	function preload(url: string): Promise<void> {
		return new Promise((resolve) => {
			// Non-image assets (e.g. the .glb model) just fetch to completion.
			if (/\.(glb|gltf|mp4|webm)$/i.test(url)) {
				fetch(url).then(() => resolve()).catch(() => resolve());
				return;
			}
			const img = new Image();
			const finish = () => resolve();
			img.onload = () => (img.decode ? img.decode().then(finish, finish) : finish());
			img.onerror = finish;
			img.src = url;
		});
	}

	onMount(() => {
		const list = assets.filter(Boolean);
		const total = list.length;
		let loaded = 0;
		let complete = false; // all assets done (or forced) → target may go to 100
		let raf = 0;
		let faded = false;

		const startFade = () => {
			if (faded) return;
			faded = true;
			// Let 100% sit for a beat (HOLD), then fade out 0.7s, then remove from DOM. Signal
			// `onreveal` as the fade STARTS so the page can begin its intro animations right
			// as it becomes visible (e.g. the cover's echo slide-in).
			const HOLD = 820; // ms the bar holds at 100% before the page drops in
			setTimeout(() => {
				hiding = true;
				onreveal?.();
			}, HOLD);
			setTimeout(() => (done = true), HOLD + 700);
		};

		// rAF loop: ease the displayed pct toward the real target so it climbs smoothly.
		// While still loading, target is capped at 90 so the bar doesn't sit at 100
		// before everything is actually ready; on completion target jumps to 100.
		const animate = () => {
			const cap = complete ? 100 : 90;
			const aim = Math.min(target, cap);
			// Ease ~12% of the remaining gap per frame (smooth, ~no overshoot).
			pct += (aim - pct) * 0.12;
			if (complete && aim - pct < 0.4) {
				pct = 100;
				startFade();
				return; // stop the loop
			}
			raf = requestAnimationFrame(animate);
		};
		raf = requestAnimationFrame(animate);

		// Mark real progress as each asset finishes.
		const tick = () => {
			loaded += 1;
			target = total ? (loaded / total) * 100 : 100;
			if (loaded >= total) complete = true;
		};

		if (total === 0) {
			target = 100;
			complete = true;
		} else {
			for (const url of list) preload(url).then(tick);
		}

		// Safety: never hang longer than `timeout` — force completion.
		const safety = setTimeout(() => {
			target = 100;
			complete = true;
		}, timeout);

		return () => {
			cancelAnimationFrame(raf);
			clearTimeout(safety);
		};
	});
</script>

{#if !done}
	<div
		class="page-loader"
		class:page-loader--hiding={hiding}
		role="status"
		aria-live="polite"
		aria-label="Učitavanje"
	>
		<span class="page-loader-pct">{Math.round(pct)}<span class="page-loader-sign">%</span></span>
	</div>
{/if}

<style lang="scss">
	.page-loader {
		position: fixed;
		inset: 0;
		z-index: 3000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #34302d;
		// Fade OUT over 0.7s once loading hits 100%.
		opacity: 1;
		transition: opacity 0.7s ease;
	}
	.page-loader--hiding {
		opacity: 0;
		pointer-events: none;
	}
	.page-loader-pct {
		display: inline-flex;
		align-items: baseline;
		color: #f4efe9;
		font-size: 1.4rem; // small, understated counter
		font-weight: 400;
		letter-spacing: 0.01em;
		font-variant-numeric: tabular-nums; // digits don't jitter as the number changes
	}
	.page-loader-sign {
		// Same size as the digits so the % lines up with them top-and-bottom.
		font-size: 1em;
		font-weight: 400;
		margin-left: 0.05em;
		opacity: 0.85;
	}
	@media (prefers-reduced-motion: reduce) {
		.page-loader {
			transition: opacity 0.2s ease;
		}
	}
</style>
