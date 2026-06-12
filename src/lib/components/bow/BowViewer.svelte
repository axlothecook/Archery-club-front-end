<script lang="ts">
	// Client-only 3D bow viewer. Wraps the Threlte <Canvas> and fires the spin intro
	// when the viewer is ~30% scrolled into view (IntersectionObserver). The <Canvas>
	// is browser-only; we additionally gate on `mounted` so nothing 3D runs during SSR.
	import { Canvas } from '@threlte/core';
	import { onMount } from 'svelte';
	import BowModel from './BowModel.svelte';

	let { url, alt = '' }: { url: string; alt?: string } = $props();

	let mounted = $state(false);
	let active = $state(false); // becomes true once ~30% in view (stays true after)
	let host = $state<HTMLDivElement>();

	onMount(() => {
		mounted = true;
		if (!host) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						active = true; // first time only — BowModel won't replay the intro
						io.disconnect();
					}
				}
			},
			// Fire when ~30% of the viewer is visible.
			{ threshold: 0.3 }
		);
		io.observe(host);
		return () => io.disconnect();
	});
</script>

<div class="bow-viewer" bind:this={host} role="img" aria-label={alt}>
	{#if mounted}
		<Canvas>
			<BowModel {url} {active} />
		</Canvas>
	{/if}
</div>

<style lang="scss">
	.bow-viewer {
		width: 100%;
		height: 100%;
		min-height: 320px;
		// The canvas fills this box; the cursor hints the model is grab-rotatable.
		cursor: grab;
		&:active {
			cursor: grabbing;
		}
		:global(canvas) {
			display: block;
			width: 100% !important;
			height: 100% !important;
			// Don't let the canvas hijack vertical scroll; horizontal drag rotates it.
			touch-action: pan-y;
		}
	}
</style>
