<script lang="ts">
	import { ui } from '$lib/ui.svelte';
	import { MENU_GROUPS } from '$lib/nav';

	// Close the menu after navigating (so clicking a link dismisses the panel).
	function go() {
		ui.closeMenu();
	}
</script>

<!-- Backdrop: shades + blurs the visible half while the panel is open. -->
<div
	class="menu-backdrop"
	class:open={ui.menuOpen}
	onclick={() => ui.closeMenu()}
	aria-hidden="true"
></div>

<nav class="half-screen-menu" class:open={ui.menuOpen} aria-label="Glavni izbornik">
	<div class="menu-head">
		<button class="menu-close" onclick={() => ui.closeMenu()} aria-label="Zatvori izbornik">
			<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
		</button>
	</div>

	<div class="menu-groups">
		{#each MENU_GROUPS as group (group.heading)}
			<div class="menu-group">
				{#if group.heading}
					<h3 class="menu-group-heading">{group.heading}</h3>
				{/if}
				{#each group.links as link (link.href)}
					<a class="menu-option" href={link.href} onclick={go}>{link.label}</a>
				{/each}
			</div>
		{/each}
	</div>
</nav>

<style lang="scss">
	// Add a blur to the library's shaded backdrop (per design: the visible half
	// is blurred, not just dimmed).
	.menu-backdrop {
		backdrop-filter: blur(6px);
		background-color: rgba(11, 31, 69, 0.45); // tinted with the bg navy
	}

	.half-screen-menu {
		background-color: var(--color-footer); // navy panel
		color: var(--color-ink);
		gap: 1.5rem;
	}

	.menu-head {
		display: flex;
		justify-content: flex-end;
	}
	.menu-close {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0.25rem;
		&:hover {
			color: var(--color-accent);
		}
	}

	.menu-groups {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 1rem;
	}
	.menu-group {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.menu-group-heading {
		margin: 0 0 0.25rem;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--color-accent);
		opacity: 0.85;
	}
	.menu-option {
		color: inherit;
		text-decoration: none;
		font-size: 1.5rem;
		font-weight: 600;
		width: fit-content;
		transition: color 0.2s ease;
		&:hover {
			color: var(--color-accent);
		}
	}

	// On small screens let the panel cover the full width (half-screen is for big
	// screens, per the library docs).
	@media (max-width: 640px) {
		.half-screen-menu {
			width: 85vw;
		}
		.menu-option {
			font-size: 1.25rem;
		}
	}
</style>
