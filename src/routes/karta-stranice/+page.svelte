<script lang="ts">
	// Karta stranice (sitemap) — a real, human-readable list of the site's pages, grouped.
	// Built from the footer columns (the maintained nav source) plus the home + contact
	// entry points, so it stays in sync as nav changes.
	import { FOOTER_COLUMNS } from '$lib/nav';

	// Lead with Home + Contact, then the footer's grouped columns (Klub / O klubu / Usluge).
	const GROUPS = [
		{
			heading: 'Početna',
			links: [
				{ label: 'Naslovnica', href: '/' },
				{ label: 'Kontakt', href: '/kontakt' }
			]
		},
		...FOOTER_COLUMNS
	];
</script>

<svelte:head>
	<title>Karta stranice | VSK</title>
</svelte:head>

<div class="sitemap">
	<header class="sitemap-hero">
		<h1 class="sitemap-title">Karta stranice</h1>
		<p class="sitemap-sub">Pregled svih stranica na web stranici.</p>
	</header>

	<div class="sitemap-grid">
		{#each GROUPS as group (group.heading)}
			<section class="sitemap-col">
				<h2>{group.heading}</h2>
				<ul>
					{#each group.links as link (link.label + link.href)}
						<li><a href={link.href}>{link.label}</a></li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	.sitemap {
		max-width: 1100px;
		margin: 0 auto;
		padding: clamp(3rem, 8vh, 6rem) clamp(1.5rem, 4vw, 3rem) clamp(5rem, 12vh, 9rem);
		color: var(--color-ink);
	}
	.sitemap-hero {
		margin-bottom: clamp(2rem, 5vh, 3.5rem);
	}
	.sitemap-title {
		margin: 0 0 0.75rem;
		font-size: clamp(2rem, 5vw, 3.2rem);
		font-weight: 800;
		letter-spacing: 0.01em;
		text-transform: uppercase;
	}
	.sitemap-sub {
		margin: 0;
		font-size: clamp(1rem, 1.6vw, 1.25rem);
		color: map.get(lib.$colors, 'jet-grey');
	}
	.sitemap-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: clamp(2rem, 4vw, 3.5rem);
	}
	.sitemap-col {
		h2 {
			margin: 0 0 1rem;
			font-size: 1.25rem;
			font-weight: 700;
			color: map.get(lib.$colors, 'blue-dress');
		}
		ul {
			margin: 0;
			padding: 0;
			list-style: none;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}
		a {
			color: var(--color-ink);
			text-decoration: none;
			font-size: 1rem;
			&:hover {
				text-decoration: underline;
			}
		}
	}
</style>
