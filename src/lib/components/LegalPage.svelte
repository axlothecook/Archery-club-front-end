<script lang="ts">
	// Shared layout for the footer legal pages (Pravni uvjeti, Pravila privatnosti,
	// Kolačići). One title + intro + a list of {heading, body[]} sections rendered as
	// simple prose. The copy is GENERIC boilerplate (a personal-project template, not
	// lawyer-reviewed); a notice at the bottom says so. Karta stranice uses its own page.
	type Section = { heading: string; body: string[] };
	let {
		title,
		intro,
		sections = []
	}: { title: string; intro?: string; sections?: Section[] } = $props();
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
		{#each sections as section (section.heading)}
			<section class="legal-section">
				<h2>{section.heading}</h2>
				{#each section.body as para (para)}
					<p>{para}</p>
				{/each}
			</section>
		{/each}

		<p class="legal-disclaimer">
			Napomena: ovo je osobni projekt, a ne službena stranica kluba. Gornji tekst je
			općenit predložak i nije pravno provjeren. Za stvarna pravna pitanja obratite se
			klubu putem <a href="/kontakt">kontakt stranice</a>.
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
		font-size: clamp(0.95rem, 1.3vw, 1.08rem);
		line-height: 1.7;
	}
	.legal-section {
		margin-bottom: clamp(1.5rem, 4vh, 2.5rem);
		h2 {
			margin: 0 0 0.6rem;
			font-size: clamp(1.2rem, 2.2vw, 1.5rem);
			font-weight: 700;
			color: var(--color-ink);
		}
		p {
			margin: 0 0 0.75rem;
		}
	}
	.legal-disclaimer {
		margin: clamp(2rem, 5vh, 3.5rem) 0 0;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(127, 127, 127, 0.25);
		font-size: 0.9rem;
		color: map.get(lib.$colors, 'jet-grey');
		a {
			color: map.get(lib.$colors, 'blue-dress');
			text-decoration: underline;
		}
	}
</style>
