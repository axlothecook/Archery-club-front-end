<script lang="ts">
	// A single roster card (Real-Madrid style): the archer photo sits on a radial
	// gradient that fades from near-white at the centre (where the archer stands) to
	// a saturated colour at the edges. Name + categories below. The whole card links
	// to the archer's profile (/momcad/{slug}). Reused for every archer in the grid.
	//
	// `tone` selects the gradient colour — passed through to CSS custom properties so
	// the same component can render different colours side by side while we pick one.
	import type { ArcherCard } from 'archery-contracts';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';

	type Tone = 'blue-dress' | 'navy';
	// fullSize = render the photo box at full card size; otherwise it's framed (more
	// gradient around it). `scale` then multiplies the photo within that box
	// (bottom-anchored) so each archer's figure can be tuned individually (1 = none).
	let {
		archer,
		tone = 'blue-dress',
		fullSize = false,
		scale = 1
	}: { archer: ArcherCard; tone?: Tone; fullSize?: boolean; scale?: number } = $props();

	// Surname overlay = the LAST word of lastName (largest). Earlier last-name words
	// (e.g. "Portner" in "Portner Pavićević") are MIDDLE names, sized between the
	// first name and the surname. Each name renders on its own row.
	const lastWords = $derived(archer.lastName.trim().split(/\s+/));
	const surname = $derived(lastWords[lastWords.length - 1]);
	const middleWords = $derived(lastWords.slice(0, -1));
</script>

<a class="archer-card" data-tone={tone} href="/momcad/{archer.slug}">
	<div class="ac-photo" class:full={fullSize} style="--photo-scale:{scale}">
		{#if archer.cardPhoto}
			<ImageWithLoader src={archer.cardPhoto.url} alt={archer.cardPhoto.alt} fit="contain" />
		{:else}
			<div class="ac-fallback" aria-hidden="true">
				<PersonIcon size={72} />
			</div>
		{/if}

		<!-- Real-Madrid-style name overlay: white text, bottom-left. Surname first
		     (large, with a tint of the card tone), given name above it. -->
		<div class="ac-name">
			<span class="ac-surname">{surname}</span>
			<span class="ac-first">{archer.firstName}</span>
			{#each middleWords as w (w)}
				<span class="ac-middle">{w}</span>
			{/each}
			{#if archer.competitionCategories.length}
				<span class="ac-cats">{archer.competitionCategories.join(' · ')}</span>
			{/if}
		</div>
	</div>
</a>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$white: map.get(lib.$colors, 'white');
	$ink: map.get(lib.$colors, 'deep-sapphire');

	// Real-Madrid-style palette for a given base colour. RM's card background is a
	// radial gradient (centred high) running from a pale lavender core through the
	// brand colour to a dark navy. We rebuild that 8-stop curve from a single base:
	// the core is near-white, the mid is the vivid base, the deep is a darkened base.
	@mixin tone($c) {
		--ac-0: #{color.mix($white, $c, 96%)}; // pale core
		--ac-1: #{color.mix($white, $c, 92%)};
		--ac-2: #{color.mix($white, $c, 86%)};
		--ac-3: #{color.mix($white, $c, 74%)};
		--ac-4: #{$c}; // vivid base
		--ac-5: #{color.adjust($c, $lightness: -10%)};
		--ac-6: #{color.adjust($c, $lightness: -20%)};
		--ac-7: #{color.adjust($c, $lightness: -30%)}; // deep navy end
		--ac-name: #{$c};
		// Surname colour: mostly white with a slight tint of the tone.
		--ac-name-tint: #{color.mix($white, $c, 82%)};
	}

	.archer-card {
		display: flex;
		flex-direction: column;
		text-decoration: none;
		color: inherit;
		border-radius: 10px;
		overflow: hidden;
		background: $white;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
		transition:
			transform 0.18s ease,
			box-shadow 0.18s ease;

		&[data-tone='blue-dress'] {
			@include tone(map.get(lib.$colors, 'blue-dress'));
		}
		&[data-tone='navy'] {
			@include tone(map.get(lib.$colors, 'navy-blue'));
		}

		&:hover {
			transform: translateY(-5px);
			box-shadow: 0 16px 34px rgba(0, 0, 0, 0.22);
		}
	}

	// Card photo area = the WHOLE card now (the name overlays it, no separate footer).
	// 469px ≈ 29.3125rem. Real-Madrid radial gradient fills it.
	.ac-photo {
		position: relative;
		height: 29.3125rem; // ≈ 469px
		width: 100%;
		// ── Option A (kept, currently OFF): Real-Madrid radial fade. Pale core lowered
		//    to ≈40% down so the bright spot sits on the archers' heads. Restore by
		//    swapping this comment with the diagonal block below.
		// background: radial-gradient(
		// 	115% 80% at 50% 40%,
		// 	var(--ac-0) 0%, var(--ac-1) 11%, var(--ac-2) 19%, var(--ac-3) 29%,
		// 	var(--ac-4) 55%, var(--ac-5) 69%, var(--ac-6) 86%, var(--ac-7) 100%
		// );

		// ── Option B (active): DIAGONAL TWO-TONE. Light at the top-left corner ramping
		//    down to the deep tone at the bottom-right — a 135° angled split.
		background: linear-gradient(
			135deg,
			var(--ac-1) 0%,
			var(--ac-2) 22%,
			var(--ac-4) 58%,
			var(--ac-6) 82%,
			var(--ac-7) 100%
		);
	}
	// ImageWithLoader paints a white box behind the image by default; make it
	// transparent so the gradient shows around the archer photo.
	.ac-photo :global(.img-loader),
	.ac-photo :global(.img-loader-fallback) {
		background: transparent;
	}
	// Photo fills the frame and is bottom-anchored. With object-fit: contain the WHOLE
	// image shows (no shoulder crop); the gradient fills any space around it.
	.ac-photo :global(.img-loader) {
		position: absolute;
		inset: 0;
	}
	.ac-photo :global(.img-loader img) {
		object-position: center bottom;
	}
	// Per-archer photo scale (bottom-anchored so the figure grows from its base).
	.ac-photo :global(.img-loader img) {
		transform: scale(var(--photo-scale, 1));
		transform-origin: center bottom;
	}
	// Default: photo scaled down a touch so the gradient frames it. Full-size opt-out
	// fills the frame edge to edge.
	.ac-photo:not(.full) :global(.img-loader) {
		left: 50%;
		bottom: 0;
		top: auto;
		transform: translateX(-50%);
		width: 88%;
		height: 94%;
	}
	.ac-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.9);
	}

	// Real-Madrid-style name overlay: white text in the bottom-left of the photo,
	// over a subtle dark scrim so it stays legible against the light gradient top.
	.ac-name {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		gap: 0.05rem;
		padding: (lib.$base-padding * 1.1) (lib.$base-padding);
		background: linear-gradient(to top, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 100%);
		text-align: left;
		pointer-events: none;
	}
	// Given name: smallest line, at the top of the stack.
	.ac-first {
		order: -2;
		font-size: 1.15rem;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.92);
		line-height: 1.1;
	}
	// Middle name(s) (extra last-name words): between the first name and the surname
	// in size — bigger than the first name, still much smaller than the surname.
	.ac-middle {
		order: -1;
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.05;
		color: rgba(255, 255, 255, 0.95);
	}
	// Surname: large, with a slight tint of the card tone mixed into the white.
	.ac-surname {
		font-size: 2.4rem;
		font-weight: 800;
		line-height: 1.02;
		letter-spacing: 0.01em;
		text-transform: uppercase;
		color: var(--ac-name-tint);
	}
	.ac-cats {
		margin-top: 0.35rem;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.85);
	}
</style>
