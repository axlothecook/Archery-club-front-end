<script lang="ts">
	import { ui } from '$lib/ui.svelte';
	import { MENU_GROUPS, LOCALE_FLAGS } from '$lib/nav';
	import FlagIcon from './icons/FlagIcon.svelte';

	// Real-Madrid-style two-column menu: left = categories, right = the selected
	// category's sub-items. The right column is empty until a category is CLICKED
	// (no hover/default selection).
	let activeIndex = $state<number | null>(null);
	const activeGroup = $derived(activeIndex === null ? null : MENU_GROUPS[activeIndex]);

	// Close the menu after navigating (so clicking a link dismisses the panel).
	function go() {
		ui.closeMenu();
	}

	function pickLocale(code: string) {
		ui.setLocale(code);
	}

	// Locale dropdown (RM shows a collapsible language control bottom-left).
	let localeOpen = $state(false);
	const activeFlag = $derived(
		LOCALE_FLAGS.find((l) => l.locale === ui.locale) ?? LOCALE_FLAGS[0]
	);
</script>

<!-- Backdrop: shades + blurs the visible side while the panel is open. -->
<div
	class="menu-backdrop"
	class:open={ui.menuOpen}
	onclick={() => ui.closeMenu()}
	aria-hidden="true"
></div>

<nav class="half-screen-menu rm-menu" class:open={ui.menuOpen} aria-label="Glavni izbornik">
	<div class="menu-head">
		<button class="menu-close" onclick={() => ui.closeMenu()} aria-label="Zatvori izbornik">
			<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
			</svg>
		</button>
	</div>

	<div class="rm-columns">
		<!-- Left column: categories -->
		<ul class="rm-categories">
			{#each MENU_GROUPS as group, i (group.heading)}
				<li>
					<button
						class="rm-category"
						class:active={activeIndex === i}
						onclick={() => (activeIndex = i)}
					>
						<span>{group.heading}</span>
						<svg class="rm-chevron" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</button>
				</li>
			{/each}
		</ul>

		<!-- Right column: sub-items of the selected category (hidden until clicked) -->
		{#if activeGroup}
			<ul class="rm-subitems">
				{#each activeGroup.links as link (link.href)}
					<li>
						<a class="rm-subitem" href={link.href} onclick={go}>{link.label}</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Locale switcher (RM bottom-left collapsible language control) -->
	<div class="rm-locale">
		<button
			class="rm-locale-toggle"
			aria-expanded={localeOpen}
			onclick={() => (localeOpen = !localeOpen)}
		>
			<svg class="rm-translate-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M4 5h7M9 3v2c0 4-2 7-5 9M5 9c0 3 3 5 6 6M12 20l4-9 4 9M13.5 17h5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
			<span class="rm-locale-short">{activeFlag.short}</span>
			<svg class="rm-caret" class:open={localeOpen} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M6 15l6-6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</button>

		{#if localeOpen}
			<div class="rm-locale-flags">
				{#each LOCALE_FLAGS as l (l.locale)}
					<button
						class="rm-locale-flag"
						class:active={ui.locale === l.locale}
						title={l.label}
						aria-label={l.label}
						aria-pressed={ui.locale === l.locale}
						onclick={() => pickLocale(l.locale)}
					>
						<FlagIcon country={l.country} size={1.25} />
						<span>{l.short}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</nav>

<style lang="scss">
	// ── Backdrop ──────────────────────────────────────────────────────────────
	.menu-backdrop {
		backdrop-filter: blur(6px);
		background-color: rgba(11, 31, 69, 0.25);
		transition:
			opacity 0.6s ease,
			visibility 0.6s ease;
	}

	// ── RM-style panel: white, wide, two columns ──────────────────────────────
	.rm-menu {
		// override the library's navy panel — RM is a light/white menu
		background-color: #ffffff;
		color: #0f2145;
		width: 60vw; // wide like RM (covers a large slice, not just half)
		max-width: 1100px;
		gap: 0;
		padding: 1.5rem 2.5rem 2rem;
		display: flex;
		flex-direction: column;
		// slow the slide in/out (library default is 0.3s)
		transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.menu-head {
		display: flex;
		justify-content: flex-start; // close X on the left, like RM
		margin-bottom: 2rem;
	}
	.menu-close {
		background: none;
		border: none;
		color: #0f2145;
		cursor: pointer;
		padding: 0.25rem;
		&:hover {
			opacity: 0.6;
		}
	}

	// ── Two columns ───────────────────────────────────────────────────────────
	.rm-columns {
		display: grid;
		grid-template-columns: minmax(280px, 360px) 1fr;
		gap: 2rem 3rem;
		flex: 1 1 auto;
	}

	.rm-categories,
	.rm-subitems {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	// Left: category rows
	.rm-category {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;

		font-size: 1.25rem; // 20px — RM
		font-weight: 700;
		color: #0f2145;

		padding: 1rem; // 16px — RM pill padding
		border-radius: 12px; // RM pill radius
		transition:
			background-color 0.15s ease,
			color 0.15s ease;

		.rm-chevron {
			color: #43526e;
			flex-shrink: 0;
		}

		// only the SELECTED (clicked) category gets the pill — no hover style
		&.active {
			background-color: #eef2fd; // RM active-pill light blue
			color: #3e31fa; // RM active blue
			.rm-chevron {
				color: #3e31fa;
			}
		}
	}

	// Right: sub-items panel — darker surface than the white menu
	.rm-subitems {
		background-color: #eee;
		border-radius: 12px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-self: start; // hug its content height, not full column height
	}
	.rm-subitem {
		font-size: 1.25rem; // 20px — RM
		font-weight: 400;
		color: #43526e; // RM grey-blue
		text-decoration: none;
		width: fit-content;
		transition: color 0.15s ease;
		&:hover {
			color: #0f2145;
			text-decoration: underline;
		}
	}

	// ── Locale control (bottom-left, RM style) ───────────────────────────────
	.rm-locale {
		margin-top: 2rem;
		position: relative;
	}
	.rm-locale-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: #0f2145;
		padding: 0.4rem 0;
		font-weight: 600;

		.rm-caret {
			transition: transform 0.2s ease;
			&.open {
				transform: rotate(180deg);
			}
		}
		&:hover {
			color: #3e31fa;
		}
	}
	.rm-locale-flags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}
	.rm-locale-flag {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: none;
		border: 1px solid transparent;
		border-radius: 10px;
		padding: 0.35rem 0.6rem;
		color: #43526e;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: background-color 0.15s ease;
		&:hover {
			background-color: #f1f4fb;
		}
		&.active {
			background-color: #eef2fd;
			border-color: #cdd6f5;
			color: #3e31fa;
		}
	}

	// On small screens cover (almost) the full width.
	@media (max-width: 820px) {
		.rm-menu {
			width: 92vw;
		}
		.rm-columns {
			grid-template-columns: 1fr; // stack on small screens
		}
	}
</style>
