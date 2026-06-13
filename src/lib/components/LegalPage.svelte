<script lang="ts">
	// Simple placeholder layout for the footer legal pages (Pravni uvjeti, Pravila
	// privatnosti, Kolačići). Real legal copy isn't written yet — rather than invent it
	// (or leave a dead '#' link), each page renders a titled "in preparation" notice. Swap
	// the placeholder for the real text when it's ready.
	let { title, intro }: { title: string; intro?: string } = $props();
</script>

<svelte:head>
	<title>{title} | VSK</title>
</svelte:head>

<div class="legal-page">
	<header class="legal-hero">
		<h1 class="legal-title">{title}</h1>
		{#if intro}
			<p class="legal-sub">{intro}</p>
		{/if}
	</header>

	<div class="legal-body">
		<p class="legal-note">
			Ova stranica je u pripremi. Sadržaj će biti objavljen uskoro. Za sva pitanja u
			međuvremenu javite nam se putem <a href="/kontakt">kontakt stranice</a>.
		</p>
	</div>
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	.legal-page {
		max-width: 880px;
		margin: 0 auto;
		padding: clamp(3rem, 8vh, 6rem) clamp(1.5rem, 4vw, 3rem) clamp(5rem, 12vh, 9rem);
		color: var(--color-ink);
	}
	.legal-hero {
		margin-bottom: clamp(2rem, 5vh, 3.5rem);
	}
	.legal-title {
		margin: 0 0 0.75rem;
		font-size: clamp(2rem, 5vw, 3.2rem);
		font-weight: 800;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		color: var(--color-ink);
	}
	.legal-sub {
		margin: 0;
		font-size: clamp(1rem, 1.6vw, 1.25rem);
		color: map.get(lib.$colors, 'jet-grey');
	}
	.legal-body {
		font-size: clamp(0.95rem, 1.3vw, 1.1rem);
		line-height: 1.7;
	}
	.legal-note {
		margin: 0;
		a {
			color: map.get(lib.$colors, 'blue-dress');
			text-decoration: underline;
		}
	}
</style>
