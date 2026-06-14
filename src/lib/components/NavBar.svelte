<script lang="ts">
	// Unified site navigation: the Apple-style morphing top "pill" PLUS the blue
	// section strip below it. On the four SECTION pages, scrolling MERGES the strip's
	// links up into the pill (and back on scroll-to-top), animated with GSAP Flip.
	//
	// Merge layout (scrolled):
	//   [ Meni · Vijesti · Postignuća · Sponzori  (LOGO)  Identitet · Povijest · Momčad · Raspored ]
	// Split layout (at top): the pill shows Meni/Vijesti (LOGO) Momčad/Raspored, and
	// the blue strip below shows Postignuća · Sponzori · Identitet · Povijest.

	import { page } from '$app/state';
	import { ui } from '$lib/ui.svelte';
	import { TOP_BAR_LINKS, SECTION_NAV_LINKS, SECTION_NAV_PATHS } from '$lib/nav';
	import MenuIcon from '$lib/components/icons/MenuIcon.svelte';
	import { gsap } from 'gsap';
	import { Flip } from 'gsap/Flip';

	gsap.registerPlugin(Flip);

	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// Scroll state drives the pill morph (full bar ↔ rounded glass pill).
	// Initialise from the pre-paint marker set by the inline script in app.html (which
	// reads SvelteKit's saved scroll position), OR the live scrollY. This way a reload
	// while scrolled mid-page renders the pill shape on the FIRST paint — no flash of
	// the top-of-page shape, even while the heavy hero blocks the main thread. NB:
	// SvelteKit restores scroll MANUALLY a frame or two after init, so window.scrollY
	// alone is 0 at this point; the data-scrolled attribute is the reliable signal.
	let scrolled = $state(
		typeof document !== 'undefined' &&
			(document.documentElement.hasAttribute('data-scrolled') || window.scrollY > 10)
	);

	// Section pages show the blue strip + get the scroll-merge behaviour.
	const path = $derived(page.url.pathname.replace(/\/$/, ''));
	const onSectionPage = $derived(
		SECTION_NAV_PATHS.some((p) => path === p || path.startsWith(p + '/'))
	);

	// merged = section links sit INSIDE the pill (scrolled on a section page).
	const merged = $derived(onSectionPage && scrolled);

	// The Raspored page opens with a full-screen video hero that the navbar floats
	// over: at the TOP there, the pill goes transparent with black text/icons so it
	// reads on the bright video. Once scrolled, it reverts to the normal dark pill.
	// '/' (homepage) + '/raspored' get the transparent-over-hero navbar (permanent).
	// NB: `path` has its trailing slash stripped, so the homepage '/' becomes '' — match
	// that, not '/'. '/hero-candidates' is a TEMPORARY review page (delete with that route).
	const transparentTop = $derived(
		(path === '' || path === '/raspored' || path === '/hero-candidates') && !scrolled
	);

	// The current section link gets the gold underline — in the blue strip AND, once
	// merged, in the pill (so the active page stays marked after scrolling).
	const isActive = (href: string) => {
		const h = href.replace(/\/$/, '');
		return path === h || path.startsWith(h + '/');
	};

	// Flip needs the "before" geometry captured WHILE the old DOM is still on screen.
	// Svelte $effects run AFTER the DOM updates, so we snapshot the section links in
	// the scroll handler — the instant before `scrolled` flips and Svelte re-renders.
	let pendingFlip: Flip.FlipState | null = null;

	$effect(() => {
		const onScroll = () => {
			const next = window.scrollY > 10;
			if (next !== scrolled && navEl) {
				// state change incoming → capture the positions of BOTH the moving
				// section links AND the shifting Meni/Vijesti/Momčad/Raspored, so they
				// all animate to their new spots together (the black-bar links slide to
				// make room AS the section links arrive — no overlap).
				pendingFlip = Flip.getState(
					navEl.querySelectorAll<HTMLElement>('[data-flip-id], [data-flip-shift]')
				);
			}
			scrolled = next;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });

		// SvelteKit restores scroll position (manual mode) a frame or two AFTER mount,
		// which would otherwise leave the pill in the top-of-page shape until then. Re-
		// sync for the first few frames, setting `scrolled` DIRECTLY (no Flip capture) so
		// the correction snaps instantly instead of animating the merge on load.
		let frames = 0;
		const settle = () => {
			scrolled = window.scrollY > 10;
			if (++frames < 10) requestAnimationFrame(settle);
		};
		requestAnimationFrame(settle);

		return () => window.removeEventListener('scroll', onScroll);
	});

	// Publish the NavBar's natural height as --nav-h so the layout spacer can clear
	// the fixed bar (pill alone vs pill + blue strip). When merged/scrolled the pill
	// floats over content (no strip), so the spacer shrinks back to the pill height.
	$effect(() => {
		// recompute whenever the split/merged state changes
		void merged;
		void onSectionPage;
		const update = () => {
			const stripH = onSectionPage && !scrolled ? (stripEl?.offsetHeight ?? 0) : 0;
			document.documentElement.style.setProperty('--nav-h', `${64 + stripH}px`);
		};
		// after DOM settles
		requestAnimationFrame(update);
	});
	let stripEl: HTMLElement | undefined = $state();

	// After the DOM has re-rendered for the new merged/split state, play the Flip
	// from the geometry captured (pre-change) in the scroll handler. Animates ONLY
	// the four section links between the strip and the pill — Meni/Vijesti/Momčad/
	// Raspored shift smoothly via the flex + gap CSS transition (Flipping them, esp.
	// with `absolute`, was what made them fling right then snap back).
	let navEl: HTMLElement;
	$effect(() => {
		void merged; // re-run whenever the merged state changes
		if (!pendingFlip) return;
		const state = pendingFlip;
		pendingFlip = null;
		// targetsAreSame=false: the captured elements were destroyed and recreated
		// (pill set ↔ strip set), so Flip matches the NEW elements to the OLD ones by
		// data-flip-id and tweens them from the captured positions.
		Flip.from(state, {
			duration: 0.5,
			ease: 'power3.inOut',
			absolute: true,
			// Animate the section links AND the shift links together, so the black-bar
			// links glide aside as the section links arrive (concurrent, no overlap).
			targets: navEl.querySelectorAll<HTMLElement>('[data-flip-id], [data-flip-shift]'),
			onEnter: (els) => gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.4 }),
			onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.25 })
		});
	});
</script>

<div
	class="navbar"
	class:scrolled
	class:section={onSectionPage}
	class:nav-clear={transparentTop}
	bind:this={navEl}
>
	<!-- ── The morphing top pill ─────────────────────────────────────────────── -->
	<header class="pill-wrap">
		<div class="pill">
			<div class="cluster cluster-left">
				<button
					class="menu-button"
					data-flip-shift
					onclick={() => ui.openMenu()}
					aria-label="Otvori meni"
				>
					<span>Meni</span>
					<MenuIcon size={22} />
				</button>
				{#each TOP_BAR_LINKS.left as link (link.href)}
					<a
						class="nav-link"
						class:active={isActive(link.href)}
						data-flip-shift
						href={link.href}>{link.label}</a
					>
				{/each}
				{#if merged}
					{#each SECTION_NAV_LINKS.left as link (link.href)}
						<a
							class="nav-link section-link"
							class:active={isActive(link.href)}
							data-flip-id="sec-{link.href}"
							href={link.href}>{link.label}</a
						>
					{/each}
				{/if}
			</div>

			<a class="logo" href="/" aria-label="Naslovnica">
				<img src={LOGO_URL} alt="Varaždinski streličarski klub" />
			</a>

			<div class="cluster cluster-right">
				{#if merged}
					{#each SECTION_NAV_LINKS.right as link (link.href)}
						<a
							class="nav-link section-link"
							class:active={isActive(link.href)}
							data-flip-id="sec-{link.href}"
							href={link.href}>{link.label}</a
						>
					{/each}
				{/if}
				{#each TOP_BAR_LINKS.right as link (link.href)}
					<a
						class="nav-link"
						class:active={isActive(link.href)}
						data-flip-shift
						href={link.href}>{link.label}</a
					>
				{/each}
			</div>
		</div>
	</header>

	<!-- ── The blue section strip (only on section pages, only while split) ───── -->
	{#if onSectionPage && !merged}
		<nav class="strip" aria-label="Sekcije kluba" bind:this={stripEl}>
			{#each [...SECTION_NAV_LINKS.left, ...SECTION_NAV_LINKS.right] as link (link.href)}
				<a
					class="strip-link"
					class:active={isActive(link.href)}
					data-flip-id="sec-{link.href}"
					href={link.href}>{link.label}</a
				>
			{/each}
		</nav>
	{/if}
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$blue: map.get(lib.$colors, 'blue-dress'); // #187ff5 — section strip
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');

	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 900;
	}

	// ── Pill (morphing top bar) ───────────────────────────────────────────────
	.pill-wrap {
		// Full-width wrapper. Its inset padding changes INSTANTLY (no transition) so
		// the pill's final width/centre settle in one frame — GSAP Flip then measures
		// the true resting positions and glides the links there (carrying the morph),
		// while the inner pill's radius/background animate. Transitioning this padding
		// shifted the layout mid-Flip and caused an end-snap.
		padding: 0;
	}
	.navbar.scrolled .pill-wrap {
		padding: 1rem 14rem 0;
	}
	.navbar.scrolled.section .pill-wrap {
		// merged pill carries 4 more links → less side padding so it fits.
		padding: 1rem 5rem 0;
	}

	.pill {
		display: flex;
		align-items: center;
		gap: 2rem;
		padding: 0.7rem 2rem;
		color: var(--color-ink);

		background-color: #0a0a0a;
		border: 1px solid transparent;
		border-radius: 0;
		box-shadow: none;
		// NB: `padding` + `gap` change INSTANTLY (not transitioned) so the final
		// link layout settles in one frame — GSAP Flip then measures the correct
		// resting positions and the links glide there with no end-snap. Only the
		// visual morph (radius / background / shadow) animates.
		transition:
			border-radius 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			background-color 0.4s ease,
			box-shadow 0.4s ease,
			border-color 0.4s ease,
			transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
	}
	// Homepage intro: the links/pill start ABOVE the screen and slide down into place.
	// The homepage sets <html data-nav-intro> on load (pill parked up) and removes it on
	// reveal (pill transitions down). Homepage-only — no other page sets this attr.
	:global(html[data-nav-intro]) .pill {
		transform: translateY(-150%);
		transition: none; // no slide WHILE parked; the slide plays when the attr is removed
	}
	// Raspored hero exception: clear pill, black text/icons over the video.
	// NB: the modifier is `nav-clear`, NOT `transparent` — the sass library defines a
	// global `.transparent` glass utility (blur + 120deg gradient) that would
	// otherwise paint a glassy strip on the navbar.
	// `color` cascades to .menu-button / .nav-link (color: inherit) and MenuIcon
	// (currentColor), so they all turn black with no per-element overrides.
	.navbar.nav-clear .pill,
	.navbar.nav-clear.scrolled .pill {
		// Nothing but the text over the video: no fill, glass, blur, or shadow.
		background-color: transparent !important;
		box-shadow: none !important;
		border-color: transparent !important;
		backdrop-filter: none !important;
		-webkit-backdrop-filter: none !important;
		// Keep the transform transition so the homepage intro slide-down still plays
		// (only the colour/glass morph is suppressed here, not the transform).
		transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
		// White unselected links/icons (the active link keeps its gold via .active).
		color: #fff;
	}
	.navbar.scrolled .pill {
		padding: 0.4rem 2rem;
		border-radius: 999px;
		border-color: rgba(255, 255, 255, 0.12);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
		// Apple #globalnav frosted glass (verified live).
		background-color: rgba(29, 29, 31, 0.8);
		backdrop-filter: saturate(180%) blur(20px);
		-webkit-backdrop-filter: saturate(180%) blur(20px);
	}
	.navbar.scrolled.section .pill {
		gap: 2.5rem; // tighter centre gap when the 4 section links are docked in
	}

	.cluster {
		flex: 1 1 0; // each cluster = equal half → logo stays dead-centre
		display: flex;
		align-items: center;
		gap: 2.25rem;
		min-width: 0;
	}
	.cluster-left {
		justify-content: flex-end; // links hug the logo from the left
	}
	.cluster-right {
		justify-content: flex-start; // links hug the logo from the right
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
		text-transform: uppercase;
		letter-spacing: 0.03em;
		cursor: pointer;
		padding: 0.25rem 0;
		// the MenuIcon component renders the <svg>, so target it globally
		:global(svg) {
			display: block;
		}
		&:hover {
			color: var(--color-accent);
		}
	}

	.nav-link {
		color: inherit;
		text-decoration: none;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		&:hover {
			color: var(--color-accent);
		}
	}
	// Inside the pill the active SECTION link is shown in GOLD TEXT (same colour as
	// the hover accent) rather than an underline — marks the current page in the
	// merged bar without a stray underline among the pill links.
	.section-link.active {
		color: var(--color-accent);
	}
	// The active TOP-BAR link (Vijesti / Momčad / Raspored) is marked the same way:
	// gold text for the page the user is currently on.
	.nav-link.active {
		color: $gold;
	}

	// The two clusters each take an EQUAL half of the pill (flex: 1), so the logo
	// between them always sits at the pill's exact centre — which, with the pill
	// centred in the full-width navbar, is screen centre. The clusters justify
	// toward the logo (left cluster right-aligned, right cluster left-aligned) so
	// the links sit near the crest. Changing cluster CONTENTS no longer shifts the
	// logo, because each side's BOX stays half-width.
	.logo {
		flex: 0 0 auto;
		display: inline-flex;
		img {
			height: 44px;
			width: auto;
			display: block;
		}
	}

	// ── Blue section strip ────────────────────────────────────────────────────
	.strip {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 2.5rem;
		background-color: $blue;
		padding: 0 1rem; // vertical space comes from the fixed height below
		// Fixed height so the strip does NOT grow from short→tall as the links
		// settle: during the split Flip the links are briefly position:absolute (out
		// of flow), which would otherwise collapse the strip to its padding height.
		height: 3rem;
		// sits directly below the (full-width) pill at the top of the page
		margin-top: 0;
	}
	.strip-link {
		position: relative;
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
		&::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: -8px; // more gap between the gold underline and the text
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

	// ── Mobile ────────────────────────────────────────────────────────────────
	// Keep the TOP-BAR links (Vijesti / Momčad / Raspored) visible on phones — only the
	// extra SECTION links (Postignuća/Sponzori/Identitet/Povijest) collapse into Meni.
	// Everything shrinks + tightens so the row fits a narrow screen.
	@media (max-width: 640px) {
		.section-link {
			display: none; // the docked section links would overcrowd the phone pill
		}
		// Keep the desktop layout: clusters each take an equal half (logo dead-centre,
		// links hugging it from both sides). The document is now clamped to the viewport
		// (html/body overflow-x: hidden), so this no longer overflows. min-width:0 lets
		// the halves shrink so the links stay on screen.
		.cluster {
			flex: 1 1 0;
			gap: 1.1rem; // more air between the links within each half
			min-width: 0;
		}
		// Fill the full nav height (var --nav-h, ~64px) with the black pill so NO navy
		// page background peeks out between the short pill and the content below. Extra
		// vertical padding makes the black bar cover that gap; links sit centred in it.
		// `gap` here sets the space the LOGO gets from its flanking links.
		.pill {
			gap: 1.1rem;
			padding: 1rem 0.6rem;
			align-items: center;
		}
		.navbar.scrolled .pill {
			padding: 1rem 0.9rem;
		}
		.navbar.scrolled.section .pill {
			gap: 1.1rem;
		}
		// Bigger + bolder link / Meni text (was 0.7rem/500).
		.nav-link {
			font-size: 0.82rem;
			font-weight: 700;
			letter-spacing: 0.02em;
		}
		.menu-button {
			gap: 0.3rem;
			font-size: 0.82rem;
			font-weight: 700;
		}
		.logo img {
			height: 2.25rem; // a touch bigger; still clears the 65px bar
		}
		// Pill-wrap side padding must collapse on phones — the desktop 14rem/5rem
		// insets would push the pill far narrower than the screen and overflow.
		.navbar.scrolled .pill-wrap,
		.navbar.scrolled.section .pill-wrap {
			padding: 1rem 0.5rem 0;
		}
	}

	// Narrow phones (≤400px): hide the "Meni" word (keep the icon) so the links keep
	// their bigger size without crowding.
	@media (max-width: 400px) {
		.menu-button span {
			display: none;
		}
		.nav-link {
			font-size: 0.76rem;
		}
		.cluster {
			gap: 0.85rem;
		}
		.pill {
			gap: 0.85rem;
			padding: 1rem 0.4rem;
		}
	}

	// Smallest phones (≤340px): last-resort squeeze so nothing overflows.
	@media (max-width: 340px) {
		.nav-link {
			font-size: 0.68rem;
			letter-spacing: 0.01em;
		}
		.logo img {
			height: 1.7rem;
		}
	}
</style>
