<script lang="ts">
	import { page } from '$app/state';
	import { ui } from '$lib/ui.svelte';
	import { MENU_LINKS, MENU_CONTACT, MENU_UTILITY, LOCALE_FLAGS, type MenuLink } from '$lib/nav';
	import FlagIcon from './icons/FlagIcon.svelte';
	import CloseIcon from './icons/CloseIcon.svelte';
	import ChevronIcon from './icons/ChevronIcon.svelte';
	import { fly } from 'svelte/transition';

	// Gucci-style menu with one level of drill-down. The main list shows direct
	// links; a link WITH children shows a › arrow and, when clicked, slides the
	// panel to a sub-view (‹ BACK + title + sub-links) instead of navigating.
	let activeSub = $state<MenuLink | null>(null);

	// Navigate: close the menu and reset to the main view (so it reopens fresh).
	function go() {
		ui.closeMenu();
		activeSub = null;
	}

	// Reset to the main list whenever the menu is closed.
	$effect(() => {
		if (!ui.menuOpen) activeSub = null;
	});

	// Club contact (smallest tier). Email is data-driven from ClubInfo; phone is
	// hardcoded until ClubInfo gains a phone field (see PLAN.md backlog).
	const email = $derived(page.data.clubInfo?.email ?? null);
	const PHONE = '+385 98 372 912';

	// Locale flag dropdown (opens downward).
	let localeOpen = $state(false);
	const activeFlag = $derived(
		LOCALE_FLAGS.find((l) => l.locale === ui.locale) ?? LOCALE_FLAGS[0]
	);
	function pickLocale(code: string) {
		ui.setLocale(code);
		localeOpen = false;
	}
</script>

<!-- Backdrop: shades + blurs the visible side while the panel is open. -->
<div
	class="menu-backdrop"
	class:open={ui.menuOpen}
	onclick={() => ui.closeMenu()}
	aria-hidden="true"
></div>

<nav class="half-screen-menu gucci-menu" class:open={ui.menuOpen} aria-label="Glavni izbornik">
	<div class="menu-head">
		<button class="menu-close" onclick={() => ui.closeMenu()} aria-label="Zatvori izbornik">
			<CloseIcon size={22} />
		</button>
	</div>

	<!-- Sliding track: main view + sub view side by side; slides left when a
	     drill-down category is open. -->
	<div class="menu-views" class:sub-open={activeSub}>
		<!-- View 1: main list -->
		<div class="menu-view" aria-hidden={activeSub ? 'true' : 'false'}>
			<ul class="menu-links">
				{#each MENU_LINKS as link (link.href)}
					<li>
						{#if link.children}
							<button class="menu-link menu-link-parent" onclick={() => (activeSub = link)}>
								{link.label}
								<span class="menu-arrow"><ChevronIcon size={18} direction="right" /></span>
							</button>
						{:else}
							<a class="menu-link" href={link.href} onclick={go}>{link.label}</a>
						{/if}
					</li>
				{/each}
			</ul>

			<!-- Middle tier (Gucci secondary block): Kontakt alone -->
			<div class="menu-middle">
				<a class="menu-link-middle" href={MENU_CONTACT.href} onclick={go}>{MENU_CONTACT.label}</a>
			</div>

			<!-- Utility tier (smallest size): contact details + Log In -->
			<div class="menu-utility">
				{#if email}
					<span class="menu-small">{email}</span>
				{/if}
				<span class="menu-small">{PHONE}</span>
				{#each MENU_UTILITY as link (link.label)}
					<a class="menu-small menu-small-link" href={link.href} onclick={go}>{link.label}</a>
				{/each}
			</div>
		</div>

		<!-- View 2: sub-items of the drilled-into category -->
		<div class="menu-view menu-view--sub" aria-hidden={activeSub ? 'false' : 'true'}>
			{#if activeSub}
				<button class="menu-back" onclick={() => (activeSub = null)}>
					<ChevronIcon size={16} direction="left" />
					<span>Natrag</span>
				</button>
				<h2 class="menu-sub-title">{activeSub.label}</h2>
				<ul class="menu-links">
					{#each activeSub.children ?? [] as sub (sub.href)}
						<li><a class="menu-link" href={sub.href} onclick={go}>{sub.label}</a></li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Locale flag dropdown -->
	<div class="menu-locale">
		<button
			class="menu-locale-toggle"
			aria-expanded={localeOpen}
			onclick={() => (localeOpen = !localeOpen)}
		>
			<FlagIcon country={activeFlag.country} size={1.1} />
			<span>{activeFlag.short}</span>
			<span class="menu-caret" class:open={localeOpen}><ChevronIcon size={14} direction="up" /></span>
		</button>

		{#if localeOpen}
			<div class="menu-locale-flags" transition:fly={{ y: 10, duration: 250 }}>
				{#each LOCALE_FLAGS as l (l.locale)}
					<button
						class="menu-locale-flag"
						class:active={ui.locale === l.locale}
						title={l.label}
						aria-label={l.label}
						aria-pressed={ui.locale === l.locale}
						onclick={() => pickLocale(l.locale)}
					>
						<FlagIcon country={l.country} size={1.1} />
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

	// ── Gucci-style panel: white, narrow, single column, left-aligned ─────────
	.gucci-menu {
		background-color: #ffffff;
		color: #0f2145; // navy ink (deep-sapphire family)
		width: 42vw; // match Gucci + a bit more — TUNED LIVE
		max-width: 620px;
		min-width: 360px;
		padding: 1.5rem 2.5rem 2rem;
		display: flex;
		flex-direction: column;
		overflow: hidden; // clip the off-screen sub-view in the sliding track
		transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.menu-head {
		display: flex;
		justify-content: flex-end; // close-X TOP-RIGHT
		margin-bottom: 2rem;
	}
	.menu-close {
		background: none;
		border: none;
		color: #0f2145;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 999px;
		&:hover {
			opacity: 0.6;
		}
	}

	// ── Sliding track (main view ↔ sub view) ──────────────────────────────────
	.menu-views {
		display: flex;
		flex: 1 1 auto;
		width: 200%; // two views side by side, each 50% of the track
		transform: translateX(0);
		transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.menu-views.sub-open {
		transform: translateX(-50%); // slide so the sub view comes into view
	}
	.menu-view {
		width: 50%;
		flex: 0 0 50%;
		display: flex;
		flex-direction: column;
	}

	// ── Main links (medium size) ──────────────────────────────────────────────
	.menu-links {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1.75rem; // airy vertical gap between links (Gucci-style)
	}
	.menu-link {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 1.5rem; // medium — Gucci main link size
		font-weight: 600; // bolder, Gucci-style
		color: #0f2145;
		text-decoration: none;
		width: fit-content;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
	}

	// Center-out gold underline on hover for DIRECT links (a.menu-link) — grows
	// from the word's bottom-centre outward to both edges. Drill parents (<button>)
	// are excluded. Gold = the library accent (var --color-accent).
	a.menu-link::after,
	.menu-link-middle::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: -0.15rem;
		height: 2px;
		background-color: var(--color-accent);
		transform: scaleX(0);
		transform-origin: center;
		transition: transform 0.3s ease;
	}
	a.menu-link:hover::after,
	.menu-link-middle:hover::after {
		transform: scaleX(1);
	}

	// › arrow on drill-down parents — slow fade-in on hover (Gucci). The drill
	// parent keeps a colour-shift hover (it has no underline).
	.menu-link-parent {
		transition: color 0.15s ease;
		&:hover {
			color: #102e66;
		}
	}
	.menu-arrow {
		display: inline-flex;
		opacity: 0;
		transition: opacity 0.5s ease;
	}
	.menu-link-parent:hover .menu-arrow {
		opacity: 1;
	}

	// ── Middle tier (Kontakt) — between big links and the small tier ──────────
	.menu-middle {
		margin-top: 3.5rem; // generous space above (from the big links)
	}
	.menu-link-middle {
		position: relative; // anchor for the center-out underline
		display: inline-block;
		font-size: 1.15rem; // middle — Gucci secondary-block size
		font-weight: 600; // bolder, Gucci-style
		color: #0f2145;
		text-decoration: none;
		width: fit-content;
	}

	// ── Sub-view header (‹ Natrag + big category title) ───────────────────────
	.menu-back {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: #43526e;
		font-size: 0.85rem;
		font-weight: 600;
		text-decoration: underline;
		width: fit-content;
		transition: color 0.15s ease;
		&:hover {
			color: #102e66;
		}
	}
	.menu-sub-title {
		margin: 1.5rem 0 2rem;
		font-size: 1.9rem;
		font-weight: 300; // thin, like Gucci's sub-view title
		color: #0f2145;
	}

	// Sub-view links (Grb/Dres/Vrijednosti) are smaller + lighter than the main list.
	.menu-view--sub .menu-link {
		font-size: 1rem;
		font-weight: 500; // fatter than the thin (300) sub-view title
	}

	// ── Utility tier (smallest size) ──────────────────────────────────────────
	.menu-utility {
		margin-top: 3.5rem; // generous space below Kontakt (separating tiers)
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.menu-small {
		font-size: 0.85rem; // smallest — email / phone / Log In
		font-weight: 400;
		color: #43526e;
	}
	.menu-small-link {
		text-decoration: underline; // Log In reads as a utility link (Gucci)
		width: fit-content;
		transition: color 0.15s ease;
		&:hover {
			color: #102e66;
		}
	}

	// ── Locale flag dropdown ──────────────────────────────────────────────────
	.menu-locale {
		margin-top: 1.5rem;
		position: relative;
	}
	.menu-locale-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: #0f2145;
		padding: 0.3rem 0;
		font-weight: 600;
		font-size: 0.95rem;
		.menu-caret {
			display: inline-flex;
			transition: transform 0.2s ease;
			&.open {
				transform: rotate(180deg);
			}
		}
		&:hover {
			color: #102e66;
		}
	}
	.menu-locale-flags {
		position: absolute;
		bottom: 100%; // open UPWARD from the toggle (it sits at the panel bottom)
		left: 0;
		margin-bottom: 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.menu-locale-flag {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		border-radius: 8px;
		padding: 0.3rem 0.5rem;
		color: #43526e;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		width: fit-content;
		transition: background-color 0.15s ease;
		&:hover {
			background-color: #f1f4fb;
		}
		&.active {
			color: #102e66;
		}
	}

	// On tablets the panel covers most of the width.
	@media (max-width: 820px) {
		.gucci-menu {
			width: 88vw;
			max-width: none;
		}
	}

	// On phones the panel goes (nearly) full-width. CRITICAL: clear the desktop
	// `min-width: 360px` — otherwise on a ~320–390px screen that floor overrides
	// the 88vw target, so the panel overflows / crowds out the tap-to-close
	// backdrop. Tighten the side padding so link text isn't cramped at 320px.
	@media (max-width: 560px) {
		.gucci-menu {
			width: 100vw;
			min-width: 0;
			padding: 1.25rem 1.5rem 1.75rem;
		}
		.menu-link {
			font-size: 1.35rem;
		}
		.menu-sub-title {
			font-size: 1.6rem;
		}
	}
</style>
