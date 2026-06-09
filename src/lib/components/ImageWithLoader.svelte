<script lang="ts">
	// Reusable image with a loading fallback: a WHITE placeholder showing the
	// cycling crossed-arrows VSK emblem until the image has loaded, then the photo
	// fades in. Drop-in replacement for a plain <img> on any page.
	//
	// Usage: <ImageWithLoader src={url} alt="…" />
	//   - `fit`   : object-fit for the image (default 'cover'; use 'contain' for logos)
	//   - `rounded`: apply rounded corners (default false)
	//   - `loaderSize`: crossed-arrows size in px (default 56)
	//   - extra class via `class` is forwarded to the wrapper.

	import CrossedArrowsIcon from '$lib/components/icons/CrossedArrowsIcon.svelte';

	let {
		src,
		alt = '',
		fit = 'cover',
		rounded = false,
		autoHeight = false,
		loaderSize = 56,
		loading = 'lazy',
		class: className = ''
	}: {
		src: string;
		alt?: string;
		fit?: 'cover' | 'contain';
		rounded?: boolean;
		autoHeight?: boolean;
		loaderSize?: number;
		loading?: 'lazy' | 'eager';
		class?: string;
	} = $props();

	let loaded = $state(false);

	// If the image is already cached/complete by the time the element mounts, the
	// onload may not fire — detect that and mark loaded immediately.
	function watch(node: HTMLImageElement) {
		if (node.complete && node.naturalWidth > 0) loaded = true;
	}
</script>

<div class="img-loader {className}" class:rounded class:loaded class:auto-height={autoHeight}>
	{#if !loaded}
		<div class="img-loader-fallback" aria-hidden="true">
			<CrossedArrowsIcon size={loaderSize} />
		</div>
	{/if}
	<img
		{src}
		{alt}
		{loading}
		use:watch
		onload={() => (loaded = true)}
		style:object-fit={fit}
	/>
</div>

<style lang="scss">
	.img-loader {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #fff; // white placeholder behind the loader + image
		&.rounded {
			border-radius: 12px;
		}
		// Auto-height mode: when the host doesn't give a fixed height, let the image
		// define the box height (e.g. a natural-ratio photo). Opt in via `autoHeight`.
		&.auto-height {
			height: auto;
		}
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 0.5s ease;
	}
	// In auto-height mode the image keeps its natural height; the loader overlays it.
	.img-loader.auto-height img {
		height: auto;
	}
	.img-loader.loaded img {
		opacity: 1;
	}

	// White-background fallback with the cycling crossed-arrows emblem.
	.img-loader-fallback {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #fff;
	}
	// The two arrows alternate lighten↔darken: one blue, one gold (same cadence as
	// the chapter cover loader).
	.img-loader-fallback :global(.arrow-a) {
		animation: arrow-a-cycle 1.2s ease-in-out infinite;
	}
	.img-loader-fallback :global(.arrow-b) {
		animation: arrow-b-cycle 1.2s ease-in-out infinite;
	}
	@keyframes arrow-a-cycle {
		0%,
		100% {
			fill: #4d86ff;
		}
		50% {
			fill: #16306e;
		}
	}
	@keyframes arrow-b-cycle {
		0%,
		100% {
			fill: #b8860b;
		}
		50% {
			fill: #ffd24a;
		}
	}
</style>
