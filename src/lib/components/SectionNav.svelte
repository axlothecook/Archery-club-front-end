<script lang="ts">
	import { page } from '$app/state';

	// Club section nav (Barça-style secondary strip): links between the club's
	// content sections. Shown below the hero, above the white content card.
	const LINKS = [
		{ label: 'Postignuća', href: '/postignuca' },
		{ label: 'Sponzori', href: '/sponzori' },
		{ label: 'Identitet', href: '/klub/identitet' },
		{ label: 'Povijest', href: '/klub/povijest' }
	];

	// A link is active when the current path is the link or a sub-path of it.
	const path = $derived(page.url.pathname.replace(/\/$/, ''));
	const isActive = (href: string) => path === href || path.startsWith(href + '/');
</script>

<nav class="section-nav" aria-label="Sekcije kluba">
	{#each LINKS as link (link.href)}
		<a class="section-link" class:active={isActive(link.href)} href={link.href}>{link.label}</a>
	{/each}
</nav>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$blue: map.get(lib.$colors, 'blue-dress'); // #187ff5 — identity header gradient start
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;

	.section-nav {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: $sp * 2.5;
		background-color: $blue;
		// Uppercase caps sit optically high inside their line box, and the gold
		// underline (bottom: -2px) draws the eye down — both make the text read as
		// closer to the top. Add a touch more top padding so the text is OPTICALLY
		// centred (equal gap top vs bottom), not just geometrically.
		padding: ($sp * 1.05) $sp ($sp * 0.85);
	}
	.section-link {
		position: relative;
		padding: ($sp * 0.3) 0;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		text-decoration: none;
		color: $white;
		opacity: 0.85;
		transition: opacity 0.15s ease;
		&:hover {
			opacity: 1;
		}

		// gold underline for the active section
		&::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: -2px;
			height: 3px;
			background-color: $gold;
			transform: scaleX(0);
			transform-origin: center;
			transition: transform 0.25s ease;
		}
		&.active {
			opacity: 1;
			&::after {
				transform: scaleX(1);
			}
		}
	}
</style>
