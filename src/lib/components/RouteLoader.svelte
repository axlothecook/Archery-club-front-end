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

	// Routes that mount their OWN full-screen PageLoader (the #34302d 0→100% counter).
	// We suppress the site-wide crossed-arrows veil for those so the user doesn't see
	// the blue arrows flash before the page's own loader takes over. Matching rules:
	//   - The root '/' is matched EXACTLY (it's a prefix of every path, so it must never
	//     be a startsWith() match). Add '/' here when the homepage gets its own PageLoader.
	//   - A pattern ending in '/' (e.g. '/momcad/') is a PREFIX match → covers its
	//     sub-routes (the bare '/momcad' roster page is NOT matched, keeps the veil).
	//   - Any other pattern is matched exactly.
	const SELF_LOADING = ['/momcad/', '/'];
	const isSelfLoading = (path: string) =>
		SELF_LOADING.some((p) => {
			if (p === '/') return path === '/';
			if (p.endsWith('/')) return path.startsWith(p);
			return path === p;
		});

	$effect(() => {
		// `navigating.to` is set while a navigation is pending, null when settled.
		const to = navigating.to;
		if (!to || isSelfLoading(to.url.pathname)) {
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
