<script lang="ts">
	import { ui } from '$lib/ui.svelte';
	import { TOP_BAR_LINKS, LOCALE_FLAGS } from '$lib/nav';

	// The club crest (left chest logo) — served from the identity bucket.
	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';
</script>

<header class="topbar">
	<!-- Left cluster: menu button (label + icon) + primary left links -->
	<div class="topbar-cluster topbar-left">
		<button class="menu-button" onclick={() => ui.openMenu()} aria-label="Otvori izbornik">
			<span>Izbornik</span>
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

	<!-- Right cluster: primary right links + flag locale switcher -->
	<div class="topbar-cluster topbar-right">
		{#each TOP_BAR_LINKS.right as link (link.href)}
			<a class="topbar-link" href={link.href}>{link.label}</a>
		{/each}
		<div class="locale-switcher" role="group" aria-label="Jezik">
			{#each LOCALE_FLAGS as l (l.locale)}
				<button
					class="locale-flag"
					class:active={ui.locale === l.locale}
					title={l.label}
					aria-label={l.label}
					aria-pressed={ui.locale === l.locale}
					onclick={() => ui.setLocale(l.locale)}
				>
					{l.flag}
				</button>
			{/each}
		</div>
	</div>
</header>

<style lang="scss">
	.topbar {
		position: sticky;
		top: 0;
		z-index: 900;
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		padding: 0.6rem 1.5rem;
		background-color: var(--color-footer); // navy bar
		color: var(--color-ink);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
	}

	.topbar-cluster {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.topbar-right {
		justify-content: flex-end;
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

	.locale-switcher {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		margin-left: 0.5rem;
	}
	.locale-flag {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
		padding: 0.2rem;
		border-radius: 4px;
		opacity: 0.55;
		transition:
			opacity 0.2s ease,
			transform 0.2s ease;

		&:hover {
			opacity: 1;
		}
		&.active {
			opacity: 1;
			transform: scale(1.1);
		}
	}

	// Mobile: hide the inline primary links (they live in the menu); keep menu
	// button, logo, and locale switcher.
	@media (max-width: 640px) {
		.topbar-link {
			display: none;
		}
		.topbar {
			padding: 0.5rem 1rem;
		}
	}
</style>
