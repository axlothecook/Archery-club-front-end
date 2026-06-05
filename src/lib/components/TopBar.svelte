<script lang="ts">
	import { ui } from '$lib/ui.svelte';
	import { TOP_BAR_LINKS, LOCALE_FLAGS } from '$lib/nav';

	// The club crest (left chest logo) — served from the identity bucket.
	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// Locale dropdown: show the active flag; clicking opens the others.
	let localeOpen = $state(false);
	const activeFlag = $derived(
		LOCALE_FLAGS.find((l) => l.locale === ui.locale) ?? LOCALE_FLAGS[0]
	);
	function pickLocale(code: string) {
		ui.setLocale(code);
		localeOpen = false;
	}
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

	<!-- Right cluster: primary right links + flag locale switcher -->
	<div class="topbar-cluster topbar-right">
		{#each TOP_BAR_LINKS.right as link (link.href)}
			<a class="topbar-link" href={link.href}>{link.label}</a>
		{/each}
		<div class="locale-switcher">
			<button
				class="locale-current"
				aria-haspopup="listbox"
				aria-expanded={localeOpen}
				aria-label="Odaberi jezik"
				title={activeFlag.label}
				onclick={() => (localeOpen = !localeOpen)}
			>
				<span class="fi fi-{activeFlag.country}"></span>
			</button>

			{#if localeOpen}
				<ul class="locale-list" role="listbox">
					{#each LOCALE_FLAGS as l (l.locale)}
						<li>
							<button
								class="locale-option"
								class:active={ui.locale === l.locale}
								role="option"
								aria-selected={ui.locale === l.locale}
								title={l.label}
								onclick={() => pickLocale(l.locale)}
							>
								<span class="fi fi-{l.country}"></span>
								<span class="lang-short">{l.short}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</header>

<style lang="scss">
	.topbar {
		position: sticky;
		top: 1rem; // float below the top edge
		z-index: 900;

		// floating pill that shrinks to fit its content, centred horizontally
		margin: 0.75rem auto 0;
		width: fit-content;
		max-width: calc(100% - 3rem);

		display: flex;
		align-items: center;
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

	.locale-switcher {
		position: relative;
		margin-left: 0.5rem;
	}

	// Collapsed state: just the flag, no chrome at all.
	.locale-current {
		display: inline-flex;
		align-items: center;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		line-height: 0;

		.fi {
			font-size: 1.25rem; // flag size
			border-radius: 3px;
		}
		&:hover .fi {
			outline: 2px solid rgba(255, 255, 255, 0.4);
			outline-offset: 1px;
		}
	}

	.locale-list {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		margin: 0;
		padding: 0.3rem;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;

		background-color: rgba(16, 46, 102, 0.85);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		z-index: 950;
	}
	.locale-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		color: var(--color-ink);
		opacity: 0.7;
		width: 100%;

		.fi {
			font-size: 1.1rem;
			border-radius: 2px;
		}
		.lang-short {
			font-size: 0.8rem;
			font-weight: 600;
			letter-spacing: 0.03em;
		}
		&:hover {
			background: rgba(255, 255, 255, 0.12);
			opacity: 1;
		}
		&.active {
			opacity: 1;
			background: rgba(255, 255, 255, 0.16);
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
