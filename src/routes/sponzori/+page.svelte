<script lang="ts">
	import type { SponsorResolved } from 'archery-contracts';
	import SponsorInquiryModal from '$lib/components/SponsorInquiryModal.svelte';
	import SectionExplore from '$lib/components/SectionExplore.svelte';
	import Flourish from '$lib/components/Flourish.svelte';

	let { data } = $props();
	const sponsors = $derived((data.sponsors ?? []) as SponsorResolved[]);

	const HERO_IMAGE =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/achivements/sponsors-cover.jpg';

	let heroLoaded = $state(false);
	let inquiryOpen = $state(false);

	// Each description ENDS with "...posjetite <host>." (e.g. "lasercopy.hr").
	// Turn that host, in place, into the clickable website link — so the link is
	// the last word INSIDE the paragraph, not a separate element. Returns the text
	// split into the part before the host, the host itself, and the part after.
	function hostOf(url: string | null): string {
		if (!url) return '';
		try {
			return new URL(url).host.replace(/^www\./, '');
		} catch {
			return url;
		}
	}
	function linkify(
		description: string,
		website: string | null
	): { before: string; link: string; after: string } {
		const host = hostOf(website);
		// Find the host as it appears in the text (last occurrence — it's the
		// trailing "posjetite <host>."). Fall back to no link if not present.
		const idx = host ? description.lastIndexOf(host) : -1;
		if (idx < 0) return { before: description, link: '', after: '' };
		return {
			before: description.slice(0, idx),
			link: description.slice(idx, idx + host.length),
			after: description.slice(idx + host.length)
		};
	}
</script>

<svelte:head>
	<title>Partneri | Varaždinski streličarski klub</title>
</svelte:head>

<div class="sponsors">
	<!-- ── Hero (Barça-inspired): photo + gold title + intro + CTA ─────────── -->
	<header class="sp-hero">
		<img
			class="sp-hero-img"
			class:loaded={heroLoaded}
			src={HERO_IMAGE}
			alt=""
			onload={() => (heroLoaded = true)}
		/>
		<div class="sp-hero-overlay"></div>
		<div class="sp-hero-inner">
			<h1 class="sp-hero-title">VSK Službeni partneri</h1>
			<p class="sp-hero-text">
				Varaždinski streličarski klub poznat je po svojoj predanosti i izvrsnosti, s
				dosljednim uspjesima na svjetskim i državnim natjecanjima, te njegovanom zajednicom u
				kojoj napreduju i početnici i iskusni streličari. Ovo poticajno okruženje duboko je
				povezano s velikodušnom podrškom partnera, čiji doprinosi osiguravaju vrhunsku opremu,
				jačaju natjecateljsku snagu kluba, te učvršćuju zajedničku predanost promicanju sporta i
				razvoju talenata.
			</p>
			<button class="sp-hero-cta" type="button" onclick={() => (inquiryOpen = true)}>
				Pridružite se
			</button>
		</div>
	</header>

	<!-- ── Partners: alternating offset cards (logo + description + link) ───── -->
	<section class="sp-partners" aria-label="Partneri">
		{#if sponsors.length === 0}
			<p class="sp-empty">Popis partnera uskoro će biti dostupan.</p>
		{:else}
			<ul class="sp-list">
				{#each sponsors as s (s.id)}
					{@const parts = linkify(s.description, s.website)}
					<li class="partner">
						<div class="partner-card">
							<div class="partner-logo" data-sponsor={s.name}>
								<img src={s.logo.url} alt={s.logo.alt} loading="lazy" />
							</div>
							<p class="partner-desc">
								{parts.before}{#if parts.link}<a
										class="partner-link"
										href={s.website}
										target="_blank"
										rel="noopener">{parts.link}</a
									>{/if}{parts.after}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- ── Honorary mention ────────────────────────────────────────────────── -->
	<section class="sp-honorary" aria-label="Počasno priznanje">
		<h2 class="sp-honorary-heading">Počasno priznanje</h2>
		<blockquote class="sp-honorary-quote">
			Nećemo zaboraviti prijateljsku gestu Općine Vidovec na čelu s gospodinom Hranićem te
			Osnovne škole Vidovec s ravnateljem gospodinom Mašićem, koji su nam ustupili prijeko
			potreban prostor za zimske treninge. Još jednom, veliko hvala svima u ime osnivača i
			streličara Varaždinskog streličarskog kluba. Opravdat ćemo vaše povjerenje!
		</blockquote>
	</section>

	<!-- End-of-card flourish + golden explore block (consistent with other pages). -->
	<div class="sp-flourish"><Flourish /></div>
	<SectionExplore />
</div>

<SponsorInquiryModal bind:open={inquiryOpen} />

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire'); // #102E66
	$gold: map.get(lib.$colors, 'macaroni-and-cheese'); // #efb52f
	$white: map.get(lib.$colors, 'white');
	$grey: map.get(lib.$colors, 'jet-grey');
	$sp: lib.$base-padding;
	$page-bg: var(--color-footer);

	.sponsors {
		width: 100%;
		background-color: $page-bg;
	}

	// ── Hero ──────────────────────────────────────────────────────────────────
	.sp-hero {
		position: relative;
		min-height: 600px; // taller hero cover photo
		display: flex;
		align-items: flex-end; // content sits LOWER on the cover photo
		justify-content: center;
		overflow: hidden;
	}
	.sp-hero-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 25%;
		opacity: 0;
		transition: opacity 0.8s ease;
		&.loaded {
			opacity: 1;
		}
	}
	.sp-hero-overlay {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
			to bottom,
			color.change($navy, $alpha: 0.55) 0%,
			color.change($navy, $alpha: 0.6) 55%,
			$page-bg 100%
		);
	}
	.sp-hero-inner {
		position: relative;
		max-width: 920px;
		// Bottom-aligned in the hero: a modest bottom gap so it sits LOW on the
		// cover photo without touching the edge.
		padding: ($sp * 4) ($sp * 1.5) ($sp * 3);
		text-align: center;
	}
	.sp-hero-title {
		margin: 0 0 ($sp * 1.25);
		color: $gold;
		// 3.4rem (not the 4rem of the other heroes): the longer "VSK SLUŽBENI
		// PARTNERI" text would otherwise dominate the hero — this keeps it optically
		// balanced with the shorter single-word titles.
		font-size: 3.4rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}
	.sp-hero-text {
		margin: 0 auto ($sp * 2);
		max-width: 640px;
		color: $white;
		font-size: 14px;
		font-weight: 300;
		line-height: 1.6;
	}
	.sp-hero-cta {
		padding: ($sp * 0.85) ($sp * 2.5);
		font: inherit;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: $white;
		// Match the blue section-nav strip below the topbar (blue-dress #187ff5).
		background: map.get(lib.$colors, 'blue-dress');
		border: none;
		border-radius: 7px;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			transform 0.12s ease;
		&:hover {
			// darker on hover (dark text-on-light state-layer direction)
			background: color.adjust(map.get(lib.$colors, 'blue-dress'), $lightness: -10%);
			transform: translateY(-2px);
		}
	}

	// ── Partners (alternating offset cards) ─────────────────────────────────────
	.sp-partners {
		width: 85%;
		max-width: 1200px;
		margin: 0 auto;
		padding: ($sp * 4) 0 ($sp * 2);
	}
	.sp-empty {
		color: map.get(lib.$colors, 'heather');
		font-weight: 300;
	}

	.sp-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: $sp * 3;
	}
	// Each partner card is ~66% wide and alternates left/right (the prototype's
	// staggered layout).
	.partner {
		display: flex;
	}
	.partner:nth-child(odd) {
		justify-content: flex-start;
	}
	.partner:nth-child(even) {
		justify-content: flex-end;
	}
	.partner-card {
		width: 66%;
		// Pure white (no grey wash over the logos) so they read crisp.
		background: $white;
		color: $navy;
		border-radius: 14px;
		padding: ($sp * 1.75) ($sp * 2);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
	}
	.partner-logo {
		margin-bottom: $sp * 1.5;
		img {
			max-height: 110px;
			max-width: 380px;
			width: auto;
			height: auto;
			object-fit: contain;
			display: block;
		}
		// KODRA + Raiffeisen Bank logos read large at their native size — keep them
		// at the smaller cap while the others are bumped up.
		&[data-sponsor='KODRA'] img,
		&[data-sponsor='Raiffeisen Bank'] img {
			max-height: 84px;
			max-width: 320px;
		}
	}
	.partner-desc {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 300;
		line-height: 1.6;
		color: map.get(lib.$colors, 'black');
	}
	// The website link is the host word INSIDE the paragraph's closing sentence.
	.partner-link {
		font-weight: 600;
		color: map.get(lib.$colors, 'blue-dress');
		text-decoration: none;
		&:hover {
			text-decoration: underline;
		}
	}

	// ── Honorary mention ────────────────────────────────────────────────────────
	.sp-honorary {
		width: 85%;
		max-width: 900px;
		margin: 0 auto;
		// More breathing room above (from the partner cards) and below (to the flourish).
		padding: ($sp * 7) 0 ($sp * 8);
		text-align: center;
	}
	.sp-honorary-heading {
		margin: 0 0 ($sp * 1.5);
		color: $white;
		font-size: 1.6rem;
		font-weight: 800;
	}
	.sp-honorary-quote {
		margin: 0;
		color: map.get(lib.$colors, 'heather');
		font-size: 1.05rem;
		font-weight: 300;
		font-style: italic;
		line-height: 1.7;
	}

	.sp-flourish {
		margin: ($sp * 2) 0 ($sp * 2);
	}

	// ── Responsive ────────────────────────────────────────────────────────────
	@media (max-width: 900px) {
		.partner-card {
			width: 100%;
		}
		.sp-partners,
		.sp-honorary {
			width: 92%;
		}
	}
	@media (max-width: 560px) {
		.sp-hero-title {
			font-size: 2rem;
		}
	}
</style>
