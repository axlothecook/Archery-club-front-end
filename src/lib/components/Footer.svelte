<script lang="ts">
	import { page } from '$app/state';
	import { FOOTER_COLUMNS, FOOTER_LEGAL } from '$lib/nav';
	import type { SponsorResolved } from 'archery-contracts';
	import type { Component } from 'svelte';
	import FacebookIcon from './icons/FacebookIcon.svelte';
	import InstagramIcon from './icons/InstagramIcon.svelte';
	import YouTubeIcon from './icons/YouTubeIcon.svelte';
	import ArrowUpIcon from './icons/ArrowUpIcon.svelte';
	import RightArrowIcon from './icons/RightArrowIcon.svelte';
	import { slide } from 'svelte/transition';
	// NOTE: CopyrightIcon is intentionally NOT imported here right now — the official
	// "Copyright …" bottom line is held back until/unless this becomes the official VSK
	// site. The icon component is kept in ./icons/ to restore that line later.

	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// Site-wide data from +layout.ts (sponsors + clubInfo socials).
	const sponsors = $derived((page.data.sponsors ?? []) as SponsorResolved[]);
	const socials = $derived(page.data.clubInfo?.socials ?? []);

	// Split sponsors into "main" (big) and the rest (small).
	const MAIN_NAMES = ['lasercopy', 'kodra'];
	const bigSponsors = $derived(
		sponsors.filter((s) => MAIN_NAMES.includes(s.name.toLowerCase()))
	);
	const smallSponsors = $derived(
		sponsors.filter((s) => !MAIN_NAMES.includes(s.name.toLowerCase()))
	);

	const YEAR = new Date().getFullYear();

	function scrollTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// PHONE accordion: one footer section open at a time (default = the first, "Klub").
	// Opening another closes the current one. Desktop renders all columns expanded.
	let openSection = $state(FOOTER_COLUMNS[0]?.heading ?? '');
	function toggleSection(heading: string) {
		openSection = openSection === heading ? '' : heading;
	}

	// Map a social platform to its icon component (each renders an SVG using
	// currentColor, so it inherits the footer ink colour).
	const SOCIAL_ICON: Record<string, Component<{ size?: number }>> = {
		facebook: FacebookIcon,
		instagram: InstagramIcon,
		youtube: YouTubeIcon
	};
</script>

<!-- Part A: sponsor + social cap, shown at the end of every page (PSG style). -->
<section class="page-cap">
	{#if bigSponsors.length}
		<hr class="cap-divider" />
		<div class="cap-row cap-big">
			{#each bigSponsors as s (s.id)}
				<a
					class="sponsor-logo"
					data-sponsor={s.name.toLowerCase()}
					href={s.website ?? '#'}
					target="_blank"
					rel="noopener"
					title={s.name}
				>
					<img src={s.logo.url} alt={s.logo.alt} />
				</a>
			{/each}
		</div>
	{/if}

	{#if smallSponsors.length}
		<hr class="cap-divider" />
		<div class="cap-row cap-small">
			{#each smallSponsors as s (s.id)}
				<a class="sponsor-logo small" href={s.website ?? '#'} target="_blank" rel="noopener" title={s.name}>
					<img src={s.logo.url} alt={s.logo.alt} />
				</a>
			{/each}
		</div>
	{/if}

	{#if socials.length}
		<hr class="cap-divider" />
		<div class="cap-row cap-socials">
			{#each socials as soc (soc.platform)}
				{#if SOCIAL_ICON[soc.platform]}
					{@const Icon = SOCIAL_ICON[soc.platform]}
					<a
						class="social-icon social-{soc.platform}"
						href={soc.url}
						target="_blank"
						rel="noopener"
						aria-label={soc.platform}
					>
						<Icon size={60} />
					</a>
				{/if}
			{/each}
		</div>
	{/if}
</section>

<!-- Part B + C: the footer that reveals from beneath as the page scrolls up. -->
<footer class="site-footer">
	<div class="footer-inner">
		<!-- DESKTOP: multi-column link layout. -->
		<div class="footer-columns">
			{#each FOOTER_COLUMNS as col (col.heading)}
				<div class="footer-col">
					<h4>{col.heading}</h4>
					{#each col.links as link (link.label + link.href)}
						<a href={link.href}>{link.label}</a>
					{/each}
				</div>
			{/each}
			<!-- 4th column: scroll-to-top arrow -->
			<div class="footer-col footer-col-top">
				<button class="to-top" onclick={scrollTop} aria-label="Natrag na vrh">
					<ArrowUpIcon size={40} strokeWidth={2} />
				</button>
			</div>
		</div>

		<!-- PHONE (PSG style): the same columns as a flush-left ACCORDION. One section open
		     at a time (default Klub); the header shows the section name + a › arrow that
		     rotates down when open; content slides in/out. -->
		<div class="footer-accordion">
			{#each FOOTER_COLUMNS as col (col.heading)}
				{@const isOpen = openSection === col.heading}
				<div class="facc-item" class:open={isOpen}>
					<button
						class="facc-head"
						aria-expanded={isOpen}
						onclick={() => toggleSection(col.heading)}
					>
						<span class="facc-title">{col.heading}</span>
						<span class="facc-arrow"><RightArrowIcon size={16} /></span>
					</button>
					{#if isOpen}
						<ul class="facc-links" transition:slide={{ duration: 280 }}>
							{#each col.links as link (link.label + link.href)}
								<li><a href={link.href}>{link.label}</a></li>
							{/each}
						</ul>
					{/if}
				</div>
			{/each}
		</div>

		<!-- PHONE: the "personal project" note sits ABOVE the crest (flex order below).
		     On desktop it's hidden here and shown inside .footer-bottom as before. -->
		<p class="copyright copyright-phone">
			<span class="copyright-line">Personal project website</span>
			<span class="copyright-sub">Author's version of an official website for VSK Club</span>
		</p>

		<!-- PHONE: club crest (no text), PSG style, below the accordion. -->
		<div class="footer-crest" aria-hidden="true">
			<img src={LOGO_URL} alt="" />
		</div>

		<!-- Barça-style bottom bar -->
		<div class="footer-brand">
			<div class="brand-left">
				<img src={LOGO_URL} alt="Varaždinski streličarski klub" />
				<span>Varaždinski streličarski klub</span>
			</div>
			<span class="brand-right">VSK</span>
		</div>

		<div class="footer-bottom">
			<p class="copyright">
				<span class="copyright-line">
					Personal project website
				</span>
				<span class="copyright-sub">Author's version of an official website for VSK Club</span>
			</p>
			<div class="legal">
				{#each FOOTER_LEGAL as l, i (l.label)}
					<a href={l.href}>{l.label}</a>
					{#if i < FOOTER_LEGAL.length - 1}<span class="sep">|</span>{/if}
				{/each}
			</div>
			<!-- empty right slot: space-between pulls the legal links to centre-left
			     (mirrors Barça, where legal sits well short of the right edge) -->
			<div class="footer-bottom-spacer" aria-hidden="true"></div>
		</div>
	</div>
</footer>

<style lang="scss">
	// ── Part A: page-end sponsor/social cap ──────────────────────────────────
	.page-cap {
		// part of the scrolling content layer — sits above the sticky footer
		position: relative;
		z-index: 1;
		// Swapped: sponsors/social cap now uses the darker footer navy.
		background-color: var(--color-footer);
		// Top padding absorbs the breathing room that used to be a separate navy gap
		// on each page (now in the SPONSOR colour, so there's no two-tone band).
		padding: 8.5rem 0 5rem; // full-bleed so dividers reach edges
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4.5rem;
	}
	.cap-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 4.5rem;
		padding: 0 1.5rem;
	}
	// Full-bleed divider: spans the entire page width, edge to edge.
	.cap-divider {
		width: 100%;
		height: 1px;
		border: none;
		background: rgba(255, 255, 255, 0.14);
		margin: 0;
	}
	.sponsor-logo {
		display: inline-flex;
		img {
			height: 80px; // bigger
			width: auto;
			object-fit: contain;
			// colored logos, transparent bg (logos are PNGs without a background)
		}
		&.small img {
			height: 56px;
		}
	}
	.cap-socials {
		gap: 2.25rem;
	}
	.social-icon {
		// uniform square box; each icon's <svg> fills it, so all icons share the
		// same footprint regardless of their source viewBox.
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 47px;
		height: 47px;

		color: var(--color-ink);
		opacity: 0.85;
		transition:
			opacity 0.2s ease,
			color 0.2s ease;

		:global(svg) {
			width: 100%;
			height: 100%;
			display: block;
		}

		&:hover {
			opacity: 1; // subtle brighten only — no movement
		}
	}

	// Optical-size normalisation: each source glyph fills its own viewBox by a
	// different amount (measured glyph height as a fraction of the box: FB ~0.83,
	// IG ~0.92, YT ~0.70). These scales bring every glyph to the same rendered
	// height (~0.85 of the box) so the three icons read as identical sizes.
	.social-facebook :global(svg) {
		transform: scale(1.03);
	}
	.social-instagram :global(svg) {
		transform: scale(0.93);
	}
	.social-youtube :global(svg) {
		transform: scale(1.21);
	}

	// ── Part B + C: the footer ────────────────────────────────────────────────
	.site-footer {
		// reveal-from-beneath: pinned behind the page content (which has the solid
		// page bg), uncovered as the page scrolls up.
		position: sticky;
		bottom: 0;
		z-index: 0;

		background-color: var(--color-bg); // swapped: lighter footer block
		color: var(--color-ink);
	}
	.footer-inner {
		max-width: 1500px; // RM-style centred container with side gutters
		margin: 0 auto;
		padding: 6.5rem 2.5rem 3.5rem; // top inset clears the reveal-overlap zone
	}

	.footer-columns {
		position: relative; // anchor for the absolutely-positioned arrow column
		display: flex;
		flex-wrap: wrap;
		justify-content: center; // cluster the columns toward the centre
		gap: 2rem 20rem; // wide column gaps; group stays centred (cols drift outward)
		margin-bottom: 7rem; // balances top padding so total footer stays ~645px
	}
	.footer-col {
		flex: 0 0 auto; // take content width so the group centres (no full-width spread)
		min-width: 140px;
	}
	.footer-col {
		display: flex;
		flex-direction: column;
		gap: 0.4rem; // Barça links sit close (line-height carries the rhythm)
		h4 {
			margin: 0 0 1.4rem; // gap to first link matches Barça (~30px)
			font-size: 1.5rem; // 24px — larger column heading
			font-weight: 700;
			color: #99b3c6; // PSG footer column-title colour (muted light blue-grey)
		}
		a {
			color: #fff; // full white column links
			text-decoration: none;
			font-size: 0.875rem; // 14px — Barça column link
			line-height: 2; // 32px — Barça link line-height
			&:hover {
				text-decoration: underline; // underline on hover, no colour change
			}
		}
	}

	// Barça-style brand row
	.footer-brand {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2.5rem 0;
	}
	.brand-left {
		display: inline-flex;
		align-items: center;
		gap: 1rem;
		color: var(--color-ink);
		text-decoration: none;
		img {
			height: 56px; // prominent brand crest
			width: auto;
		}
		span {
			font-weight: 700;
			font-size: 1.5rem; // 24px — prominent brand wordmark
			text-transform: capitalize; // Title Case (each word capitalised)
			letter-spacing: 0.02em;
		}
	}
	.brand-right {
		font-weight: 800;
		font-size: 2rem; // 32px — prominent big word
		letter-spacing: 0.08em;
	}

	.footer-bottom {
		display: flex;
		align-items: center;
		// Barça-style: copyright (left) + legal links (centre-left) on ONE row.
		// no-wrap keeps them on the same line; the legal margin sets its offset.
		justify-content: flex-start;
		flex-wrap: nowrap;
		gap: 1rem;
		padding-top: 1rem;

		.copyright {
			margin: 0;
			color: #fff; // full white copyright text
			font-size: 0.875rem; // 14px — Barça copyright
			// (literal casing in the markup — no text-transform, so the club name
			// is capitalised but "stranica" stays lowercase per the source phrasing)
			// Barça bottom-left: copyright (bolder) + tagline (lighter/smaller)
			// flowing on one line, no separator — just inline whitespace.
			// baseline so both text runs sit on the same line despite differing sizes.
			display: flex;
			align-items: baseline;
			flex-wrap: nowrap; // keep copyright + tagline on one line
			flex: 0 0 auto; // don't let the row squeeze the copyright text
			white-space: nowrap;
		}
		.copyright-line {
			// inline (not inline-flex) so its text baseline participates in the parent
			// baseline alignment; the icon is nudged to sit on that text baseline.
			font-weight: 600; // semi-bold — Barça copyright span
			:global(svg) {
				vertical-align: -0.15em; // align icon to the text baseline
				margin-right: 0.1rem;
			}
		}
		.copyright-sub {
			font-weight: 100; // thin — much lighter than the copyright
			font-size: 0.8125rem; // 13px — slightly smaller than the copyright
			margin-left: 0.25rem; // one normal word-space after the copyright (Barça)
		}
	}
	// Right spacer matched to the copyright's footprint so space-between pulls the
	// legal links to centre-left (Barça mirror), not hard against the right edge.
	.footer-bottom-spacer {
		flex: 0 0 auto;
		width: 90px;
	}
	.legal {
		display: inline-flex;
		align-items: center;
		flex-wrap: nowrap; // keep all legal links on one line
		gap: 0.6rem;
		margin-left: auto; // push to the right; sits on the copyright's row
		margin-right: 3rem; // pull in from the right edge
		white-space: nowrap;
		font-size: 0.875rem; // 14px — Barça legal links

		a {
			color: #fff; // full white legal links
			text-decoration: none;
			&:hover {
				text-decoration: underline; // underline on hover, no colour change
			}
		}
		.sep {
			color: #fff; // full white separators
		}
	}
	// 4th column holding only the scroll-to-top arrow — aligned to the top-right
	// so it sits level with the column headings, at the right edge.
	// Arrow lifted out of the flex flow so the 3 content columns can centre cleanly;
	// pinned top-right so its right edge lines up with the "VSK" wordmark's right
	// edge below (both at the inner container's right edge).
	.footer-col-top {
		position: absolute;
		top: 0;
		right: 0;
		flex: 0 0 auto;
		min-width: 0; // shrink to the arrow's width so its right edge hits the edge
		align-items: flex-end;
	}
	.to-top {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0;
		color: #fff; // full white arrow
		cursor: pointer;
		transition: opacity 0.2s ease;
		&:hover {
			opacity: 0.7; // subtle hover feedback, no colour change
		}
	}

	// PHONE-only footer accordion + crest + phone copyright are hidden on desktop.
	.footer-accordion,
	.footer-crest,
	.copyright-phone {
		display: none;
	}

	@media (max-width: 700px) {
		.footer-columns {
			gap: 2.5rem;
		}
		.footer-inner {
			padding: 3rem 1.5rem 2rem;
		}
		// ── PSG-style accordion (phone) ────────────────────────────────────────────
		// Hide the desktop multi-column layout + the Barça brand row; show the accordion.
		.footer-columns,
		.footer-brand {
			display: none;
		}
		.footer-accordion {
			display: block;
		}
		.facc-item {
			border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		}
		// Header: section name (left) + arrow (right), vertically CENTRED so neither
		// sits higher than the other.
		.facc-head {
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1rem;
			padding: 1.1rem 0;
			background: none;
			border: none;
			cursor: pointer;
			text-align: left;
			color: #99b3c6; // muted heading colour (matches desktop column titles)
			font-size: 1.25rem;
			font-weight: 700;
		}
		.facc-title {
			display: block;
			line-height: 1;
		}
		// Arrow: › when closed, rotates to point DOWN when the section is open.
		.facc-arrow {
			display: inline-flex;
			align-items: center;
			color: #99b3c6;
			transition: transform 0.28s ease;
			:global(svg) {
				display: block;
			}
		}
		.facc-item.open .facc-arrow {
			transform: rotate(90deg); // › → ⌄ (points down)
		}
		// Section links — flush left, indent-free, white, stacked.
		.facc-links {
			list-style: none;
			margin: 0;
			// Extra bottom padding = more gap between the last link of an open
			// section and the next section's header below it.
			padding: 0 0 2.4rem;
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			li {
				margin: 0;
			}
			a {
				color: #fff;
				text-decoration: none;
				font-size: 1.1rem; // bigger
				font-weight: 600; // bolder
				&:hover {
					text-decoration: underline;
				}
			}
		}
		// Reorder the phone footer: accordion → "personal project" note → crest → legal.
		// (.footer-inner is a column; assign each child an order. Hidden children — the
		// desktop columns/brand — don't matter.)
		.footer-inner {
			display: flex;
			flex-direction: column;
		}
		.footer-accordion {
			order: 0;
		}
		.copyright-phone {
			order: 1;
		}
		.footer-crest {
			order: 2;
		}
		.footer-bottom {
			order: 3;
		}

		// The "personal project / Author" note: shown here (above the crest), with a gap
		// from the sections above and from the crest below.
		.copyright-phone {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
			margin: 3.5rem 0; // generous gap from the sections above AND the crest below
			.copyright-line {
				color: #fff;
				font-weight: 700;
				font-size: 0.95rem;
			}
			.copyright-sub {
				color: rgba(255, 255, 255, 0.6);
				font-size: 0.85rem;
			}
		}
		// Hide the original copyright inside .footer-bottom on phone (moved above).
		.footer-bottom .copyright {
			display: none;
		}

		// Club crest below the note (no text), PSG style — generous gap above (from the
		// note) and below (to the legal row).
		.footer-crest {
			display: block;
			margin: 0 0 2.25rem; // top gap comes from .copyright-phone's bottom margin
			img {
				height: 84px;
				width: auto;
			}
		}

		// Legal links: keep them on ONE row at the bottom.
		.legal {
			flex-wrap: nowrap;
			white-space: nowrap;
			gap: 0.4rem;
			a {
				font-size: 0.74rem;
			}
			.sep {
				margin: 0 0.1rem;
			}
		}
		.brand-left span {
			font-size: 0.95rem;
		}
		// Sponsor cap: tighten the gap + shrink logos so they wrap within the phone width
		// instead of overflowing (desktop uses a wide 4.5rem gap + 80px logos).
		.cap-row {
			gap: 1.5rem 2rem;
			padding: 0 1rem;
		}
		.sponsor-logo img {
			height: 52px;
		}
		// Per-sponsor tuning on phone: Lasercopy a touch smaller, Kodra bigger.
		.sponsor-logo[data-sponsor='lasercopy'] img {
			height: 44px;
		}
		.sponsor-logo[data-sponsor='kodra'] img {
			height: 72px;
		}
		// More breathing room between the two big logos (Lasercopy ↔ Kodra).
		.cap-big {
			gap: 2.5rem 3rem;
		}
		// The other three (small row) bumped up.
		.sponsor-logo.small img {
			height: 52px;
		}
		// Bottom row: stack/wrap copyright + legal links instead of forcing one no-wrap
		// line (the desktop one-line layout overflows the viewport on phones).
		.footer-bottom {
			flex-wrap: wrap;
			gap: 0.75rem 1rem;
		}
		.footer-bottom-spacer {
			display: none; // the centring spacer isn't needed once the row wraps
		}
		// NB: match the base rule's nesting (`.footer-bottom .copyright`, specificity
		// 0-2-0) so this override actually WINS — a bare `.copyright` (0-1-0) loses to
		// it even inside a media query (media queries don't add specificity).
		.footer-bottom .copyright {
			// Base rule has `flex: 0 0 auto` (don't shrink) + `white-space: nowrap`,
			// so the copyright + tagline stay one ~489px line that overflows a 390px
			// phone — which widened the whole document and stretched the fixed navbar.
			// Reset to allow shrinking + wrapping so it fits the phone width.
			flex: 1 1 100%;
			min-width: 0;
			flex-wrap: wrap;
			white-space: normal;
		}
		.footer-bottom .copyright .copyright-sub {
			white-space: normal; // the tagline wraps to the next line instead of pushing wide
			margin-left: 0;
		}
		.legal {
			margin-left: 0; // don't push right; sit under the copyright
			margin-right: 0;
			flex-wrap: wrap;
			white-space: normal;
		}
	}
</style>
