<script lang="ts">
	import { page } from '$app/state';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import type { ClubHistoryPeriodResolved } from 'archery-contracts';

	// Newest chapter first → oldest last (reverse of the editorial `order`).
	const periods = $derived(
		[...((page.data.periods ?? []) as ClubHistoryPeriodResolved[])].sort((a, b) => b.order - a.order)
	);
</script>

<h1 class="history-heading">Klub kroz godine</h1>

<!-- Founder quote below the section heading. -->
<figure class="history-quote">
	<blockquote>
		Varaždinski streličarski klub od svojeg osnutka ima svoje streličare u redovima
		reprezentacije i oni redovito donose izvanredne rezultate za klub i za Hrvatsku,
		što je sve posljedica odličnog rada u klubu te izuzetnog zalaganja samih
		streličara.
	</blockquote>
	<figcaption>Osnivač Tomislav Mlinarić</figcaption>
</figure>

<div class="history-grid">
	{#each periods as period (period.slug)}
		<a class="period-card" href="/klub/povijest/{period.slug}">
			{#if period.coverImage}
				<div class="period-cover">
					<ImageWithLoader src={period.coverImage.url} alt={period.coverImage.alt} />
				</div>
			{/if}
			<div class="period-text">
				<h2 class="period-title">{period.title}</h2>
			</div>
		</a>
	{/each}
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$sp: lib.$base-padding;

	// Section heading: mirror the identity pages' title ("Vrijednosti" / "Grb") —
	// gold-blue→navy GRADIENT text fill, weight 700, 3rem, centred.
	.history-heading {
		margin: 0 0 ($sp * 2.5); // +1rem gap between the title and the quote
		font-size: 2.25rem; // smaller content-card heading
		font-weight: 700;
		line-height: 1.25; // room so the gradient-clip doesn't crop descenders
		padding-bottom: 0.1em;
		text-align: center;
		text-transform: uppercase;
		background-image: linear-gradient(90deg, map.get(lib.$colors, 'blue-dress'), var(--color-footer));
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}

	// Founder quote: centred, light italic (mirrors the identity Vrijednosti quote),
	// with the attribution right-aligned below it.
	.history-quote {
		max-width: 880px; // stretched a bit wider
		margin: 0 auto ($sp * 5); // +2rem gap before the cards below
		blockquote {
			margin: 0;
			text-align: center;
			font-size: 1.15rem;
			font-weight: 300;
			font-style: italic;
			line-height: 1.6;
			color: map.get(lib.$colors, 'black');
		}
		figcaption {
			margin-top: $sp * 0.75;
			text-align: right;
			font-size: 0.95rem;
			font-weight: 600;
			color: map.get(lib.$colors, 'deep-sapphire');
		}
	}

	// Mirror Barça's decade grid (measured): 4 cols, 16:9 image (~65% of card),
	// transparent card, centred 18px/400 title in the remaining space.
	.history-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $sp * 0.5;
	}

	.period-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		border: 1px solid #efefef; // Barça: thin light-grey border, square corners
		transition: transform 0.2s ease;
		// Kill the browser's blue/grey tap-flash overlay when a card is tapped on phone.
		-webkit-tap-highlight-color: transparent;
		&:hover {
			transform: translateY(-4px);
		}
	}

	.period-cover {
		// Shorter cover (2/1, was 16/9) so the white text area below it can be taller
		// WITHOUT changing the card's overall height — the image shrinks by what the
		// text grows. (Same rebalance is applied on phone in the media block.)
		aspect-ratio: 2 / 1;
		overflow: hidden;
	}

	.period-text {
		// Taller text surface (Barça cards have a bigger text block under the image).
		// Title sits at the TOP of the block; the cover above shrank by the same amount
		// this grew, so the overall card height is unchanged.
		min-height: 113px;
		padding: ($sp * 0.9) ($sp * 0.75) ($sp * 1.4);
	}
	.period-title {
		margin: 0;
		font-size: 18px; // Barça size
		font-weight: 700; // matches Barça's visual heft (their font renders heavier than Inter 400)
		line-height: 1.3;
		text-align: center;
		color: map.get(lib.$colors, 'black');
	}

	// Responsive: fewer columns on smaller screens.
	@media (max-width: 1024px) {
		.history-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 560px) {
		.history-grid {
			grid-template-columns: 1fr;
		}
	}
	// PHONE: smaller founder quote under the "Klub kroz godine" title (the 1.15rem
	// reads oversized here), matching the Identitet lead quote.
	@media (max-width: 720px) {
		.history-quote blockquote {
			font-size: 0.95rem;
		}
		// No desktop hover/lift on touch — it would "stick" after a tap on phones.
		.period-card:hover {
			transform: none;
		}
		// Grow the white text area UPWARD (taller) WITHOUT changing the card's overall
		// height: shrink the cover image by the same amount the text grows. (16/9 ≈ 196px
		// → 2/1 ≈ 175px cover; text min-height 96px → 119px. Total card height unchanged.)
		.period-cover {
			aspect-ratio: 2 / 1;
		}
		.period-text {
			min-height: 119px;
		}
	}
</style>
