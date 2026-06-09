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
	import SectionNav from '$lib/components/SectionNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { onNavigate } from '$app/navigation';

	let { children } = $props();

	// History list ↔ chapter slide, via the View Transitions API (Chromium today;
	// unsupported browsers just navigate plainly — progressive enhancement).
	//   OPEN  (list → /klub/povijest/<slug>) → chapter slides UP from the bottom.
	//   CLOSE (chapter → list)               → chapter slides DOWN, revealing list.
	// We tag <html> with a direction class so the CSS knows which way to animate,
	// and ONLY enable the slide for these specific povijest navigations.
	const isList = (p: string) => p.replace(/\/$/, '') === '/klub/povijest';
	const isChapter = (p: string) => /^\/klub\/povijest\/[^/]+$/.test(p.replace(/\/$/, ''));

	onNavigate((navigation) => {
		if (!document.startViewTransition || !navigation.to) return;
		const from = navigation.from?.url.pathname ?? '';
		const to = navigation.to.url.pathname;

		let dir: 'open' | 'close' | null = null;
		if (isList(from) && isChapter(to)) dir = 'open';
		else if (isChapter(from) && isList(to)) dir = 'close';
		if (!dir) return; // not a povijest list↔chapter nav → no slide

		const cls = `vt-${dir}`;
		document.documentElement.classList.add(cls);
		return new Promise((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
			transition.finished.finally(() => document.documentElement.classList.remove(cls));
		});
	});
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
		<!-- Club section nav: a strip directly under the (fixed) TopBar; pushes
		     content down. The top spacer clears the fixed TopBar. -->
		<div class="section-nav-offset"><SectionNav /></div>
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
	/* clear the fixed TopBar so the section nav sits directly below it */
	.section-nav-offset {
		position: relative;
		z-index: 1;
		padding-top: 56px;
		background-color: var(--color-bg);
		/* view-transition-name applied only DURING the slide (scoped under html.vt-*
		   in the global stylesheet) so it stays still then, without a permanent
		   name affecting rest-state rendering. */
	}
	/* solid page bg + above the footer so the reveal-from-beneath works */
	.app-main {
		position: relative;
		z-index: 1;
		background-color: var(--color-bg);
		flex: 1 0 auto;
	}
</style>
