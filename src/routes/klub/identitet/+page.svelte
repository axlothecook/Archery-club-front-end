<script lang="ts">
	import { page } from '$app/state';
	import { sectionByApiSlug } from '$lib/identity';
	import type { ClubIdentitySectionResolved } from 'archery-contracts';

	// Values is the default identity section. Read it from the layout's already-
	// loaded sections (no extra fetch).
	const sections = $derived((page.data.sections ?? []) as ClubIdentitySectionResolved[]);
	const values = $derived(sectionByApiSlug(sections, 'values'));

	// Lead quote — verbatim from the Olympic Charter (the club's values statement).
	const QUOTE =
		'Bavljenje sportom je ljudsko pravo. Svakom pojedincu mora biti omogućeno bavljenje sportom, bez diskriminacije bilo koje vrste i u olimpijskom duhu, što zahtijeva obostrano razumijevanje u duhu prijateljstva, solidarnosti i fair playa.';

	const OLYMPIC_IMG =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/olimpic-logo.jpg';

	// The four club values. Text supplied by the user (verbatim) for values 1 & 3;
	// values 2 & 4 expand the user's short text with the official Olympic Charter
	// principle. NOTE: the expansions in #2 and #4 are AGENT-TRANSLATED from the
	// official English Charter (not the official Croatian Charter wording) and are
	// flagged for the user to verify/correct.
	// TODO: move this into the backend seed (club-identity) so it's data-driven,
	// then read `values.content.blocks` again instead of this hardcode.
	const VALUE_BLOCKS = [
		{
			header: 'Sport je ljudsko pravo',
			body: 'Sport nije ničije vlasništvo. Bavljenje sportom je ljudsko pravo. Svakom pojedincu mora biti omogućeno kojom vrstom sporta se pojedinac želi baviti, odabir natjecanja na kojem želi sudjelovati, odabir kluba u kojem će trenirati, pravo na trenera s kojim on želi trenirati, pravo na tim čiji dio on želi biti. Pravo na prijatelje s kojima streličar želi dijeliti osmjehe nakon pobjede i koji će razumjeti zašto nakon takmičenja osoba plače.'
		},
		{
			header: 'Bez diskriminacije',
			// AGENT-COMPOSED (verify): user's line + translated Charter non-discrimination clause.
			body: 'Bavljenje sportom mora biti omogućeno bez diskriminacije bilo koje vrste i u olimpijskom duhu, neovisno o rasi, boji kože, spolu, spolnoj orijentaciji, jeziku, vjeri, političkom ili drugom uvjerenju, nacionalnom ili socijalnom podrijetlu, imovini, rođenju ili drugom statusu.'
		},
		{
			header: 'Prijateljstvo i solidarnost',
			body: 'Olimpijski duh zahtijeva obostrano razumijevanje u duhu prijateljstva i solidarnosti. U sportu Vam nitko ne može nametati svoju volju. Nitko Vas ne može prisiliti ni da budete u njemu, ako osjećate nelagodu. Ako trenirate bez volje, ako se ne osjećate kao dio tima, ako Vas okružuju ljudi s kojima Vam nije ugodno, maknite se, promijenite sport, klub, okolinu, krenite ispočetka. Oslobodite se. Sport je samo Vaš izbor.'
		},
		{
			header: 'Poštena igra',
			// User-supplied copy (4 typos corrected with the user's OK: poštivanja,
			// sportaša, vidljiva, poštovanje).
			body: 'Bavljenje sportom zahtijeva obostrano razumijevanje u duhu poštene igre i natjecanje u kojem rezultat nikada nije važniji od poštivanja pravila i suparnika. Pobjedu cijenimo, ali poraz prihvaćamo s jednakim poštovanjem, jer je prava vrijednost sportaša vidljiva u načinu na koji se nosi s oboje. U našem klubu njegujemo iskrenost, čestitost i međusobno poštovanje, na liniji i izvan nje.'
		}
	];
</script>

<article class="values">
	<h1 class="values-title">{values?.title ?? 'Vrijednosti'}</h1>

	<figure class="values-quote">
		<blockquote>{QUOTE}</blockquote>
		<figcaption>Olimpijska povelja</figcaption>
	</figure>

	<img class="values-image" src={OLYMPIC_IMG} alt="Olimpijski duh" />

	<div class="values-blocks">
		{#each VALUE_BLOCKS as block (block.header)}
			<section class="value-block">
				<h2 class="value-header">{block.header}</h2>
				<p class="value-body">{block.body}</p>
			</section>
		{/each}
	</div>
</article>

<style lang="scss">
	// Pull the sass-library palette + base spacing so colours/gaps come from the
	// library, not hardcoded values (per the project's library-over-CSS rule).
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire'); // #102E66 — site navy / ink
	$gold: map.get(lib.$colors, 'macaroni-and-cheese'); // #efb52f — accent gold
	$sp: lib.$base-padding; // 1rem base spacing unit

	// Text column ≈ 668px, matching Barça's paragraph width (measured), centred
	// inside the content card. Generous bottom space to the card edge (Barça).
	.values {
		max-width: 668px;
		margin: 0 auto;
		padding-bottom: $sp * 4;
	}
	// Section title: gold→navy GRADIENT text fill (Barça's "Values" style),
	// weight 400, centred.
	.values-title {
		margin: 0 0 ($sp * 1.5);
		font-size: 3rem;
		font-weight: 700; // heavier to match Barça's visual heft
		line-height: 1.25; // room so the gradient-clip doesn't crop descenders (j)
		padding-bottom: 0.1em;
		text-align: center;
		// lighter blue → dark navy (current page bg)
		background-image: linear-gradient(90deg, map.get(lib.$colors, 'blue-dress'), var(--color-footer));
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}
	// Lead quote: italic, lighter weight, and widened (≈880px) so it isn't cramped
	// into too many rows. Breaks out wider than the 668px column; centred.
	.values-quote {
		width: 880px;
		max-width: 90vw;
		margin-left: 50%;
		transform: translateX(-50%);
		margin-bottom: $sp * 2.5;
		blockquote {
			margin: 0;
			font-size: 1.2rem;
			font-weight: 300; // nuked weight (Barça-style light)
			font-style: italic;
			line-height: 1.6;
			color: map.get(lib.$colors, 'black');
		}
		figcaption {
			margin-top: $sp * 0.75;
			text-align: right;
			font-size: 0.95rem;
			font-weight: 600;
			color: $navy;
		}
	}
	// Large thematic image — sized to Barça's image (1110 × 693.75px → 1.6 / 16:10
	// aspect-ratio) and responsive: it scales with the viewport but never exceeds
	// 1110px. Breaks out wider than the 668px lead column; centred via 50%/translateX.
	.values-image {
		display: block;
		width: 90vw;
		max-width: 1110px;
		aspect-ratio: 1110 / 693.75; // = 1.6, mirrors Barça's image ratio
		margin-left: 50%;
		transform: translateX(-50%);
		margin-bottom: $sp * 3;
		object-fit: contain;
	}
	// Value blocks sit in the standard 668px column (reverted from the breakout).
	.values-blocks {
		display: flex;
		flex-direction: column;
		gap: $sp * 2;
	}
	.value-header {
		margin: 0 0 ($sp * 0.5);
		font-size: 1.35rem;
		font-weight: 600;
		color: map.get(lib.$colors, 'black'); // black header
	}
	// Mirror Barça's value paragraph: max-width 668px, #222 ink, 18px / 28px line.
	// (Barça uses a 10px rem base; converted to px here for our 16px base.)
	.value-body {
		max-width: 668px;
		margin: 20px auto 32px;
		font-size: 18px;
		font-weight: 400;
		line-height: 28px;
		color: map.get(lib.$colors, 'shark'); // #232323 ≈ Barça's #222
	}
</style>
