<script lang="ts">
	// Site-wide route-load overlay: a full-screen veil with the cycling crossed
	// arrows shown while SvelteKit is navigating between pages (covers slow loads /
	// lag of ANY route). It only appears for navigations that take longer than a
	// short threshold, so instant page changes don't flash the loader.

	import { navigating } from '$app/state';
	import CrossedArrowsIcon from '$lib/components/icons/CrossedArrowsIcon.svelte';

	// Show the loader only if a navigation is still in flight after this delay
	// (avoids a flash on fast/cached navigations).
	const SHOW_AFTER_MS = 180;
	let visible = $state(false);

	$effect(() => {
		// `navigating.to` is set while a navigation is pending, null when settled.
		const isNavigating = !!navigating.to;
		if (!isNavigating) {
			visible = false;
			return;
		}
		const t = setTimeout(() => (visible = true), SHOW_AFTER_MS);
		return () => clearTimeout(t);
	});
</script>

{#if visible}
	<div class="route-loader" role="status" aria-live="polite" aria-label="Učitavanje stranice">
		<div class="route-loader-arrows"><CrossedArrowsIcon size={84} /></div>
	</div>
{/if}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	// A clean veil over the page background so the loader reads on any route.
	.route-loader {
		position: fixed;
		inset: 0;
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-bg, #fff);
		// fade the veil in (the threshold already gated it, so this is a soft entrance)
		animation: route-loader-in 0.2s ease both;
	}
	@keyframes route-loader-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	// The two arrows cycle blue↔gold (same cadence as the image + cover loaders).
	.route-loader-arrows :global(.arrow-a) {
		animation: route-arrow-a 1.2s ease-in-out infinite;
	}
	.route-loader-arrows :global(.arrow-b) {
		animation: route-arrow-b 1.2s ease-in-out infinite;
	}
	@keyframes route-arrow-a {
		0%,
		100% {
			fill: #4d86ff;
		}
		50% {
			fill: #16306e;
		}
	}
	@keyframes route-arrow-b {
		0%,
		100% {
			fill: #b8860b;
		}
		50% {
			fill: #ffd24a;
		}
	}
</style>
