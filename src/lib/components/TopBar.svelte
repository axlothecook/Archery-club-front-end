<script lang="ts">
	import { ui } from '$lib/ui.svelte';
	import { TOP_BAR_LINKS } from '$lib/nav';

	// The club crest (left chest logo) — served from the identity bucket.
	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';
</script>

<header class="topbar">
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
</header>

<style lang="scss">
	.topbar {
		position: sticky;
		top: 1rem; // float below the top edge
		z-index: 900;

		// floating pill, centred horizontally, much wider than its content
		margin: 0.75rem auto 0;
		width: 1623px; // wide pill; rendered width is governed by max-width below
		max-width: calc(100% - 28rem); // shortened pill (25rem narrower than original)

		display: flex;
		align-items: center;
		justify-content: space-between; // spread clusters across the wider pill
		// bigger gap between the logo and each side cluster than within a cluster
		gap: 4rem;

		padding: 0.4rem 2rem;

		color: var(--color-ink);

		// glassy: translucent navy + frosted blur, rounded full pill + subtle border
		background-color: rgba(16, 46, 102, 0.45); // footer navy, see-through
		backdrop-filter: blur(16px) saturate(140%);
		-webkit-backdrop-filter: blur(16px) saturate(140%);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
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
	// button + logo.
	@media (max-width: 640px) {
		.topbar-link {
			display: none;
		}
		.topbar {
			padding: 0.5rem 1rem;
		}
	}
</style>
