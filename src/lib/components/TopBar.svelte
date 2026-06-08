<script lang="ts">
	import { ui } from '$lib/ui.svelte';
	import { TOP_BAR_LINKS } from '$lib/nav';

	// The club crest (left chest logo) — served from the identity bucket.
	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// At the top of the page the bar is full-width + flush to the top; once the
	// user scrolls it transforms into a floating, rounded pill. This one flag
	// drives the whole transform via a `scrolled` class.
	let scrolled = $state(false);

	$effect(() => {
		const onScroll = () => (scrolled = window.scrollY > 10);
		onScroll(); // initial state (e.g. reload while scrolled down)
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<!-- Outer wrapper is ALWAYS full-width + fixed (never changes width → no reflow,
     no left-anchored expand). It only animates its padding (symmetric, so the
     inner pill insets from both edges equally = centred morph). The inner element
     is the visible bar/pill and animates its background + border-radius. -->
<header class="topbar" class:scrolled>
	<div class="topbar-inner">
		<!-- Left cluster: menu button (label + icon) + primary left links -->
		<div class="topbar-cluster topbar-left">
			<button class="menu-button" onclick={() => ui.openMenu()} aria-label="Otvori meni">
				<span>Meni</span>
				<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
					<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
			</button>
			{#each TOP_BAR_LINKS.left as link (link.href)}
				<a class="topbar-link" href={link.href}>{link.label}</a>
			{/each}
		</div>

		<!-- Centre: club logo → homepage -->
		<a class="topbar-logo" href="/" aria-label="Naslovnica">
			<img src={LOGO_URL} alt="Varaždinski streličarski klub" />
		</a>

		<!-- Right cluster: primary right links -->
		<div class="topbar-cluster topbar-right">
			{#each TOP_BAR_LINKS.right as link (link.href)}
				<a class="topbar-link" href={link.href}>{link.label}</a>
			{/each}
		</div>
	</div>
</header>

<style lang="scss">
	// Outer wrapper: ALWAYS full-width + fixed, so the inner pill never changes
	// the layout (no reflow / no left-anchored expand). Only its padding animates,
	// and because the horizontal padding is symmetric the inner pill insets from
	// both edges equally → the morph happens from the CENTRE.
	.topbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 900;

		// TOP STATE: no padding → inner bar is edge-to-edge, flush to the top.
		padding: 0;

		transition: padding 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	// SCROLLED: symmetric horizontal padding insets the pill from both sides
	// equally (centred), plus a top gap.
	.topbar.scrolled {
		padding: 1rem 14rem 0;
	}

	// The visible bar/pill. Width follows the (padded) wrapper, so it never
	// animates width itself — only its appearance (radius / background / border).
	.topbar-inner {
		display: flex;
		align-items: center;
		justify-content: center; // logo + links clustered in the centre
		gap: 4rem; // wide gap between the logo and each side cluster

		padding: 0.7rem 2rem;
		color: var(--color-ink);

		// TOP STATE: solid dark, square, no blur (Apple goes translucent only on scroll).
		background-color: #0a0a0a;
		border: 1px solid transparent;
		border-radius: 0;
		box-shadow: none;

		transition:
			padding 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			background-color 0.4s ease,
			box-shadow 0.4s ease,
			border-color 0.4s ease;
	}

	// SCROLLED: rounded pill + translucent BLACK glass (Apple-style blur).
	.topbar.scrolled .topbar-inner {
		padding: 0.4rem 2rem;
		border-radius: 999px;
		border-color: rgba(255, 255, 255, 0.12);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);

		// more transparent, stronger blur — mirrors Apple's frosted glass
		background-color: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
	}

	.topbar-cluster {
		display: flex;
		align-items: center;
		gap: 2.25rem; // gap between options within a side cluster
	}

	.menu-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		font-weight: 600;
		letter-spacing: 0.02em;
		cursor: pointer;
		padding: 0.25rem 0;

		svg {
			display: block;
		}
		&:hover {
			color: var(--color-accent);
		}
	}

	.topbar-link {
		color: inherit;
		text-decoration: none;
		font-weight: 500;
		&:hover {
			color: var(--color-accent);
		}
	}

	.topbar-logo {
		justify-self: center;
		display: inline-flex;
		img {
			height: 44px; // smaller than the old prototype
			width: auto;
			display: block;
		}
	}

	// Mobile: hide the inline primary links (they live in the menu); keep menu
	// button + logo. The scrolled inset is much smaller on a narrow screen so the
	// pill isn't squished.
	@media (max-width: 640px) {
		.topbar-link {
			display: none;
		}
		.topbar.scrolled {
			padding: 0.75rem 1rem 0;
		}
		.topbar-inner {
			padding: 0.5rem 1rem;
		}
	}
</style>
