<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	// Global theme: the Inter font (self-hosted via @fontsource) + the SCSS entry
	// (library + palette control panel). Imported once here at the root.
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '@fontsource/inter/800.css';
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
	<main class="app-main">
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	.app-main {
		flex: 1 0 auto;
	}
</style>
