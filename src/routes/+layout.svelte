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
	import 'flag-icons/css/flag-icons.min.css';
	import '../styles/index.scss';

	import TopBar from '$lib/components/TopBar.svelte';
	import HalfScreenMenu from '$lib/components/HalfScreenMenu.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<TopBar />
	<HalfScreenMenu />
	<!-- Content layer sits ABOVE the sticky footer (z-index) with a solid bg, so
	     scrolling up "uncovers" the footer that's pinned beneath it. -->
	<div class="content-layer">
		<main class="app-main">
			{@render children()}
		</main>
		<Footer />
	</div>
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
	/* solid page bg + above the footer so the reveal-from-beneath works */
	.app-main {
		position: relative;
		z-index: 1;
		background-color: var(--color-bg);
		flex: 1 0 auto;
	}
</style>
