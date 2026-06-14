<script lang="ts">
	// Roster card — "International call-ups" style. A wide rectangular card; the card sits
	// a little SHORTER than the photo so the figure's head pokes out the top.
	//
	// Resting: only the SURNAME shows (bottom-left, bold). Photo sits a touch low.
	// On HOVER: photo slides UP (revealing more figure) + card grows up behind it; the
	// first name slides ABOVE the surname, the bow type slides BELOW it; and a BOW IMAGE
	// emerges from behind the archer (centre) and slides RIGHT, sitting behind the figure.
	// On LOAD: the photo slides up from below into its resting place (eased).
	import type { ArcherCard, Bow } from 'archery-contracts';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import { bowLabel } from '$lib/archer';

	let {
		archer,
		/** Optional front-end override for the card photo URL (when the backend image
		 *  doesn't frame well for this layout). */
		photoOverride = '',
		/** When true the bow emerges on the LEFT (default right); the first-name watermark
		 *  then sits flush against the RIGHT wall (opposite the bow), and vice-versa. */
		bowLeft = false,
		/** TALL variant (used on the archer page's coach/Trenira rows): the card is taller at
		 *  rest and does NOT grow on hover — every other hover animation (image slide+scale,
		 *  watermark reveal, bow slide, bow-type) still plays. */
		tall = false,
		/** Pin the first-name watermark letters FLUSH to the wall (instead of the default
		 *  centred). Used for FILIP so his narrow "I" lines up with the other letters. */
		flushLetters = false
	}: {
		archer: ArcherCard;
		photoOverride?: string;
		bowLeft?: boolean;
		tall?: boolean;
		flushLetters?: boolean;
	} = $props();

	const photoUrl = $derived(photoOverride || archer.cardPhoto?.url || '');
	const bow = $derived(bowLabel(archer.bowType));
	// First name split into letters for the vertical watermark (one letter per line).
	const firstLetters = $derived([...archer.firstName]);

	// Bow image shown on hover (slides out behind the archer). Per bow TYPE, with Amanda's
	// own compound photo as a special case.
	const BOW_IMG: Record<Bow, string> = {
		recurve:
			'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/stock-bow-photos/recurve-bow.png',
		compound:
			'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/stock-bow-photos/compound.png',
		barebow:
			'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/stock-bow-photos/barebow.png'
	};
	const AMANDA_BOW =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/stock-bow-photos/amanda-compound.png';
	const bowImg = $derived(
		archer.slug === 'amanda-mlinaric' ? AMANDA_BOW : (BOW_IMG[archer.bowType?.[0]] ?? '')
	);
	// PHONE bow watermark is mirrored over the Y-axis for KLASIČNI LUK (recurve) and
	// GOLI LUK (barebow) archers, so those bows face the other way. Složeni luk (compound)
	// is left as-is, EXCEPT specific archers in FORCE_FLIP (compound bows we still mirror).
	// Drives the `.flip-bow` class consumed only in the phone styles.
	const FORCE_FLIP = new Set(['nikola-portner-pavicevic', 'aurelia-mlinaric']);
	const flipPhoneBow = $derived(
		archer.bowType?.[0] === 'recurve' ||
			archer.bowType?.[0] === 'barebow' ||
			FORCE_FLIP.has(archer.slug)
	);
	// RECURVE (klasični luk) bows read small on phone, so enlarge them. This bow-TYPE scale
	// multiplies the per-archer --phone-bow-scale in the phone styles (.recurve-bow class).
	const recurveBow = $derived(archer.bowType?.[0] === 'recurve');
	// BAREBOW (goli luk) bows get the SAME phone enlargement as recurve.
	const barebowBow = $derived(archer.bowType?.[0] === 'barebow');
	// COMPOUND (složeni luk) bows match Amanda's bow size + sit higher on phone. Amanda
	// herself is EXCLUDED (she keeps her own per-archer position via the page's inline vars).
	const compoundBow = $derived(
		archer.bowType?.[0] === 'compound' && archer.slug !== 'amanda-mlinaric'
	);
	// Specific archers whose bow should NOT be mirrored (face the other way from their
	// bow-type default). Overrides the type-driven flip.
	const NO_FLIP = new Set([
		'nicole-bratonja',
		'bojan-rodik',
		'luka-ciglaric',
		'tena-mikolaj',
		'mija-mance'
	]);
	const noFlipBow = $derived(NO_FLIP.has(archer.slug));
</script>

<a
	class="rc"
	class:bow-left={bowLeft}
	class:tall={tall}
	class:flush-letters={flushLetters}
	href="/momcad/{archer.slug}"
>
	<!-- The colour card (background panel that grows on hover). It also holds the PHONE
	     bow (a faint watermark clipped by the box's overflow:hidden on phone). The phone
	     bow is display:none on desktop; the desktop bow below is display:none on phone. -->
	<div class="rc-card">
		{#if bowImg}
			<img
				class="rc-bowimg-phone"
				class:flip-bow={flipPhoneBow}
				class:recurve-bow={recurveBow}
				class:barebow-bow={barebowBow}
				class:compound-bow={compoundBow}
				class:no-flip={noFlipBow}
				src={bowImg}
				alt=""
				aria-hidden="true"
			/>
		{/if}
	</div>

	<!-- Desktop bow image: sibling of .rc-card so the card's hover scaleY never stretches
	     it; hidden behind the archer at centre, slides right on hover. (Phone uses the bow
	     inside .rc-card instead.) -->
	{#if bowImg}
		<img class="rc-bowimg" src={bowImg} alt="" aria-hidden="true" />
	{/if}

	<!-- Photo: taller than the card so the head pokes out; slides up on hover + on load. -->
	<div class="rc-photo">
		{#if photoUrl}
			<ImageWithLoader src={photoUrl} alt={archer.cardPhoto?.alt ?? ''} fit="contain" />
		{:else}
			<div class="rc-fallback" aria-hidden="true"><PersonIcon size={72} /></div>
		{/if}
	</div>

	<!-- Big vertical first-name watermark (one letter per line), on the side OPPOSITE the
	     bow; fades+slides up on hover, ending slightly transparent. --letters drives the
	     font-size so the WHOLE name always fits the card height. -->
	<span class="rc-first" style="--letters:{firstLetters.length}" aria-hidden="true">
		{#each firstLetters as ch, i (i)}<span class="rc-first-l">{ch}</span>{/each}
	</span>

	<!-- Text: surname always (bottom-left). On hover the bow type slides in ABOVE it.
	     On PHONE this whole block moves BELOW the image box (PSG style): first name on
	     top, surname, then bow type — all always visible (no hover). `.rc-firstname` is
	     desktop-hidden (the watermark covers the first name there). -->
	<div class="rc-meta">
		<span class="rc-firstname">{archer.firstName}</span>
		<span class="rc-last">{archer.lastName}</span>
		{#if bow}<span class="rc-bow">{bow}</span>{/if}
	</div>
</a>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$white: map.get(lib.$colors, 'white');
	$gold: map.get(lib.$colors, 'macaroni-and-cheese'); // club gold (matches active nav tab)
	$ink-meta: map.get(lib.$colors, 'deep-sapphire'); // phone: dark name text on white page bg
	$gold-meta: map.get(lib.$colors, 'macaroni-and-cheese'); // phone: bow-type accent

	// How far the photo extends above the card (head sticks out) + how much the card grows
	// up + how low the photo sits at rest (so the hovered figure's feet stay on the floor).
	$head-out: 3rem;
	$card-rise: 9rem;
	// TALL variant static height = the same as a normal card's GROWN height, so the figure /
	// watermark / bow have the same room but the box never animates its size.
	$tall-h: 12rem + $card-rise + $head-out;

	.rc {
		position: relative;
		display: block;
		text-decoration: none;
		color: $white;
		height: 12rem; // less tall
		overflow: visible;
		isolation: isolate;
		// Clip the CARD region's BOTTOM (so a photo translated DOWN has its lowered part
		// hidden below the card) while leaving the TOP OPEN (head pokes out, never cut).
		// This clip stays FIXED at the card bottom because .rc itself doesn't move; the
		// photo slides inside it.
		clip-path: inset(-100vh 0 0 0);
	}
	// TALL variant: a taller static card (matches a normal card's grown height) that does NOT
	// grow on hover — so the figure/watermark/bow already have full room at rest.
	.rc.tall {
		height: $tall-h;
	}

	// ── Colour card ───────────────────────────────────────────────────────────────
	// Alternating colours are set on the <li> in the page (odd = cornflower, even =
	// deep-sapphire) via the --card-bg custom property.
	.rc-card {
		position: absolute;
		inset: 0;
		background: var(--card-bg, cornflowerblue);
		z-index: 0;
		transform-origin: bottom center;
		transition: transform 0.35s ease;
	}

	// The phone-only bow (inside .rc-card) is hidden on desktop; the desktop bow below
	// handles the hover slide-out.
	.rc-bowimg-phone {
		display: none;
	}

	// ── Bow image (behind the archer) ─────────────────────────────────────────────
	// Hidden behind the archer at centre; on hover it slides out, peeking out from the
	// figure's side, staying BEHIND the photo (z above card, below photo). Direction is
	// per-archer: default RIGHT, the .bow-left class (from the shared BOW_LEFT set) → LEFT.
	.rc-bowimg {
		position: absolute;
		z-index: 1;
		left: 50%;
		// BIG bow, anchored at the card bottom and CLIPPED to the card region: anything that
		// overflows past the top of the (grown-on-hover) card is hidden, so the bow never
		// visibly sticks out above the div — parts may be cut off by the clip, which is fine.
		// Lowered: the bow sits BELOW the card bottom by $bow-drop (its lower part runs off
		// the bottom and is clipped), pushing more of the upper bow into view.
		$bow-h: 54rem;
		$bow-drop: 13rem; // how far below the card bottom the bow is pushed
		$grown: 12rem + $card-rise + $head-out;
		bottom: calc(-1 * #{$bow-drop});
		height: $bow-h;
		width: auto;
		opacity: 0;
		// Clip top overflow (above the grown card) AND the bottom overflow (the dropped part
		// below the card), so the big bow stays contained to the card even when lowered.
		clip-path: inset(calc(#{$bow-h} - #{$grown} - #{$bow-drop}) 0 #{$bow-drop} 0);
		// Rest: centred behind the archer, fully hidden (translateX(0rem) = at centre).
		transform: translateX(-50%) translateX(0rem) scale(0.92);
		transition:
			transform 0.5s ease,
			opacity 0.4s ease;
		pointer-events: none;
	}

	// ── Photo ─────────────────────────────────────────────────────────────────────
	// At REST the photo is pushed DOWN by $rest-drop, so its bottom goes below the card
	// and that lowered part is HIDDEN (clipped by .rc's bottom). You see the upper part.
	// On HOVER it slides UP to translateY(0) → the figure's bottom aligns with the card
	// bottom and the whole figure is revealed. The head is never cut (.rc top is open).
	$rest-drop: 4rem;
	.rc-photo {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		top: 0;
		z-index: 2;
		// --photo-nudge (per-archer, default 0; negative = pull the figure UP) shifts the
		// figure in BOTH rest and hover so individual photos can be vertically aligned.
		transform: translateY(calc(#{$rest-drop} + var(--photo-nudge, 0px)));
		transition: transform 0.4s cubic-bezier(0.33, 0, 0.2, 1);
		// Composite the photo on its own GPU layer so the hover slide/scale is smooth.
		will-change: transform;
		backface-visibility: hidden;
	}
	.rc-photo :global(.img-loader),
	.rc-photo :global(.img-loader-fallback) {
		background: transparent;
	}
	.rc-photo :global(.img-loader) {
		position: absolute;
		inset: 0;
		// ImageWithLoader clips with overflow:hidden by default; make it visible so the
		// figure (head above, lowered part below) isn't clipped here — .rc does the clip.
		overflow: visible;
	}
	.rc-photo :global(.img-loader img) {
		object-position: center bottom;
		// Bigger figure, bottom-anchored. --fig-scale lets specific archers be nudged
		// bigger/smaller (set per-slug on .rc in the page); default 1.4. The figure GROWS
		// on hover (scale bumped below) as the photo slides up. translateZ(0) keeps it on the
		// GPU layer so the scale is composited, not re-rastered each frame.
		transform: scale(var(--fig-scale, 1.4)) translateZ(0);
		transform-origin: center bottom;
		transition: transform 0.4s cubic-bezier(0.33, 0, 0.2, 1);
		backface-visibility: hidden;
	}
	.rc-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.85);
	}

	// ── Text ──────────────────────────────────────────────────────────────────────
	.rc-meta {
		position: absolute;
		left: 0;
		right: 0;
		// Surname LOWERED a bit (less bottom padding than before).
		bottom: 0;
		z-index: 3;
		display: flex;
		flex-direction: column;
		padding: 0.9rem 1rem 0.5rem;
		pointer-events: none;
	}
	// First name: only used on the PHONE variant (shown below the box). On desktop the
	// vertical watermark (.rc-first) covers the first name, so this is hidden.
	.rc-firstname {
		display: none;
	}
	// Surname: always visible, bottom-left, bold, big.
	.rc-last {
		order: 2;
		font-size: 2.1rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.01em;
		line-height: 1;
		color: $white;
		text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
	}
	// Bow type: hidden by default, slides in ABOVE the surname on hover.
	.rc-bow {
		order: 1;
		margin-bottom: 0.2rem;
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: $gold; // club gold
		text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
		opacity: 0;
		transform: translateY(0.8rem);
		transition:
			transform 0.32s ease,
			opacity 0.28s ease;
	}

	// First name: BIG vertical watermark (one letter per line) IN FRONT of the image, on the
	// wall OPPOSITE the bow. Default (bow right) → flush against the LEFT wall; `.bow-left`
	// (bow left) → flush against the RIGHT wall. A small gap sits between the letters and the
	// card's top + side edge. Hidden at rest; on hover it slides UP + fades in.
	$first-gap: 0.2rem; // small gap from the side + top/bottom edges
	// The card GROWS to this height on hover (origin bottom, see .rc:hover .rc-card). The
	// watermark must span THIS grown height, not the 12rem rest height.
	$grown-h: 12rem + $card-rise + $head-out;
	.rc-first {
		position: absolute;
		z-index: 1; // BEHIND the photo (z2), in front of the card bg (z0) — a watermark
		// Anchor to the BOTTOM and extend UP by the full grown height, so on hover (when the
		// card has grown up) the column spans the whole visible card top→bottom. The letters
		// distribute edge-to-edge (space-between).
		bottom: $first-gap;
		top: auto;
		height: calc(#{$grown-h} - #{$first-gap} * 2);
		left: $first-gap; // default: flush LEFT (bow is on the right)
		right: auto;
		display: flex;
		flex-direction: column;
		// Letters are CENTRED within the name column by default (a narrow letter like an
		// "I" sits centred over the wider letters). The `.flush-letters` variant instead
		// pins each letter to the wall the name sits against (used for FILIP, whose "I"
		// should line up flush with the other letters rather than centre).
		align-items: center;
		justify-content: flex-start; // letters PINNED TO THE TOP (packed), not spread
		line-height: 1;
		gap: 0.08em; // tiny space between stacked letters
		// Sized DOWN so the WHOLE name fits (all letters visible) within the grown card.
		// Divisor 1.12 (vs the old 0.8) makes the glyphs smaller. --letters set per-card.
		font-size: calc((#{$grown-h} - #{$first-gap} * 2) / (var(--letters, 6) * 1.12));
		font-weight: 900;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		color: rgba(255, 255, 255, 0.4); // translucent watermark behind the figure
		// Reveal BOTTOM→TOP in sync with the card grow using ONLY transform + opacity (both
		// GPU-composited) — NOT clip-path, whose per-frame repaint was causing the hover
		// stutter. Start lower + faded, slide up to place. Same 0.35s ease as the card grow.
		opacity: 0;
		transform: translateY(2.5rem);
		transition:
			transform 0.35s ease,
			opacity 0.35s ease;
		pointer-events: none;
	}
	// Bow on the LEFT → name flush against the RIGHT wall (position only; default letters
	// stay centred unless `.flush-letters` is set).
	.rc.bow-left .rc-first {
		left: auto;
		right: $first-gap;
	}
	// FILIP only: pin letters flush to the wall the name sits against (left wall default,
	// right wall on bow-left) so his narrow "I" lines up with the other letters' edges.
	.rc.flush-letters .rc-first {
		align-items: flex-start;
	}
	.rc.flush-letters.bow-left .rc-first {
		align-items: flex-end;
	}
	.rc-first-l {
		display: block;
		// Trim the font's leading so each box hugs the cap-height→baseline ink; the glyphs
		// then tile the container and the name spans the card top→bottom (no floating-low).
		text-box-trim: trim-both;
		text-box-edge: cap alphabetic;
	}

	// ── HOVER ─────────────────────────────────────────────────────────────────────
	.rc:hover {
		z-index: 5;
	}
	// Photo slides UP from its rested-low position to translateY(0): the figure's bottom
	// aligns with the card bottom and the whole figure is revealed.
	.rc:hover .rc-photo {
		transform: translateY(var(--photo-nudge, 0px));
	}
	// The figure also GROWS as it slides up (bottom-anchored, so it grows upward).
	.rc:hover .rc-photo :global(.img-loader img) {
		transform: scale(calc(var(--fig-scale, 1.4) * 1.12)) translateZ(0);
	}
	// Card grows UP behind the figure (origin bottom) so the revealed full figure has room.
	.rc:hover .rc-card {
		transform: scaleY(calc((12rem + #{$card-rise} + #{$head-out}) / 12rem));
	}
	// TALL variant: the card does NOT grow on hover (it's already tall) — all OTHER hover
	// animations (photo slide+scale, watermark, bow) still play.
	.rc.tall:hover .rc-card {
		transform: none;
	}

	// ── TALL variant fine-tuning ───────────────────────────────────────────────────
	// Photo: sits HIGHER at rest (smaller drop) and moves up LESS on hover, so the head
	// never reaches the card top or overflows it.
	$tall-rest-drop: 2rem;
	.rc.tall .rc-photo {
		transform: translateY(calc(#{$tall-rest-drop} + var(--photo-nudge, 0px)));
	}
	.rc.tall:hover .rc-photo {
		transform: translateY(var(--photo-nudge, 0px));
	}
	// Tall figures are SMALLER overall: --fig-scale × 0.82 at rest …
	$tall-fig: 0.82;
	.rc.tall .rc-photo :global(.img-loader img) {
		transform: scale(calc(var(--fig-scale, 1.4) * #{$tall-fig})) translateZ(0);
	}
	// … and grow only a LITTLE on hover (×1.05), staying inside the card.
	.rc.tall:hover .rc-photo :global(.img-loader img) {
		transform: scale(calc(var(--fig-scale, 1.4) * #{$tall-fig} * 1.05)) translateZ(0);
	}
	// Bow (reduced from the default 54rem but bigger than before) — re-clip to the tall card.
	.rc.tall .rc-bowimg {
		$t-bow-h: 40rem;
		$t-bow-drop: 7rem;
		height: $t-bow-h;
		bottom: calc(-1 * #{$t-bow-drop});
		clip-path: inset(calc(#{$t-bow-h} - #{$tall-h} - #{$t-bow-drop}) 0 #{$t-bow-drop} 0);
	}
	// Smaller first-name watermark, letters PINNED TO THE TOP (packed) with a TINY gap.
	.rc.tall .rc-first {
		font-size: calc((#{$tall-h} - #{$first-gap} * 2) / (var(--letters, 6) * 1.15));
		justify-content: flex-start;
		gap: 0.12em; // tiny space between stacked letters
	}
	// Bow emerges from behind the archer and slides out to peek from the figure's side.
	// Direction is driven by the .bow-left CLASS (single source of truth, set from the shared
	// BOW_LEFT set on BOTH pages) — default RIGHT, .bow-left flips to LEFT. Slide in rem
	// (card-relative) so it clears the figure; keep the -50% centring.
	.rc:hover .rc-bowimg {
		// Desktop hover bow: more visible than the phone watermark (0.18) but still subtle.
		opacity: 0.35;
		// --bow-nudge (per-archer, default 0) fine-tunes the horizontal landing.
		transform: translateX(-50%) translateX(5.5rem) translateX(var(--bow-nudge, 0px)) scale(1);
	}
	.rc.bow-left:hover .rc-bowimg {
		transform: translateX(-50%) translateX(-5.5rem) translateX(var(--bow-nudge, 0px)) scale(1);
	}
	// Bow slides up into view above the surname.
	.rc:hover .rc-bow {
		opacity: 1;
		transform: translateY(0);
	}
	// The big vertical first-name watermark rises into place (translateY → 0) + fades in,
	// on the same 0.35s ease as the card's grow so they move together. Transform/opacity
	// only — composited, no clip-path repaint.
	.rc:hover .rc-first {
		opacity: 1;
		transform: translateY(0);
	}

	// ── ON-LOAD: photo slides up from below into its resting place (eased) ──────────
	// Plays once when the page opens / reloads (the component mounts). Slides from below the
	// card up to the resting transform. Lands at the SAME resting value as .rc-photo's base
	// transform (incl. --photo-nudge) so there's no snap when the animation ends. A small
	// per-card stagger (--i set on the <li> in the page) makes the cards cascade in.
	@keyframes rc-rise-in {
		from {
			transform: translateY(140%);
		}
		to {
			transform: translateY(calc(#{$rest-drop} + var(--photo-nudge, 0px)));
		}
	}
	.rc-photo {
		// `backwards` holds the FROM (below) state during the stagger delay so un-started
		// cards stay hidden below — but NOT `forwards`, so after it ends the base transform
		// + hover transition take over cleanly (no fighting the hover slide-up).
		animation: rc-rise-in 0.7s cubic-bezier(0.33, 0, 0.2, 1) backwards;
		animation-delay: calc(var(--i, 0) * 45ms);
	}

	@media (prefers-reduced-motion: reduce) {
		.rc-card,
		.rc-photo,
		.rc-bowimg,
		.rc-first,
		.rc-bow {
			transition: none;
			animation: none;
		}
	}

	// ── Phone variant (PSG-style) ───────────────────────────────────────────────
	// Touch has NO hover, so the whole hover-reveal mechanic is dropped here. The card
	// becomes a normal-flow block: a coloured box holding the WHOLE photo (contain), with
	// a text block BELOW it on the white page background — first name, then surname, then
	// bow type, all always visible. No bow image, no first-name watermark.
	@media (max-width: 720px) {
		.rc,
		.rc.tall {
			display: flex;
			flex-direction: column;
			height: auto; // normal flow (was the fixed hover-grow height)
			overflow: visible;
			clip-path: none;
			isolation: auto;
			position: relative; // offset parent for the absolutely-overlaid photo
		}

		// The coloured box: fixed aspect ratio so all cards line up; the photo overlays it.
		// `position: relative` makes it the containing block for the absolutely-placed photo,
		// so the photo fills the BOX only (not the text area below).
		.rc-card {
			position: relative; // back into flow (was absolute inset:0)
			inset: auto;
			width: 100%;
			aspect-ratio: 3 / 4;
			transform: none;
			transition: none;
			overflow: hidden; // contain the photo within the box
		}

		// Photo overlays ONLY the box: anchored to the card top, full width, with the SAME
		// aspect-ratio as the box → its height matches the box exactly, so it never spills
		// into the text block below. (.rc is the offset parent; the meta flows after the box.)
		.rc-photo {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: auto;
			aspect-ratio: 3 / 4;
			height: auto;
			transform: none;
			will-change: auto;
			z-index: 2;
			// The desktop `rc-rise-in` slide (translateY 140%→rest) is WRONG on phone: the
			// photo is a SIBLING of the clipping box, so it rises UP over the white text /
			// neighbouring cards before snapping in. On phone the photo sits in the box, so
			// swap the slide for a contained FADE-IN — nothing escapes the box. The stagger
			// is kept via the same --i animation-delay.
			animation-name: rc-fade-in;
		}
		// Fade-in only (no vertical slide) for the contained phone photo.
		@keyframes rc-fade-in {
			from {
				opacity: 0;
			}
			to {
				opacity: 1;
			}
		}
		.rc-photo :global(.img-loader) {
			position: absolute;
			inset: 0;
			overflow: hidden; // keep the contained image inside the box
		}
		.rc-photo :global(.img-loader img) {
			width: 100%;
			height: 100%;
			object-fit: contain; // WHOLE photo, letterboxed by the card bg
			object-position: center bottom;
			// Per-archer phone scale (--phone-scale, default 1) bumps figures that read small
			// in the contained box. The box's overflow:hidden clips any overspill.
			transform: scale(var(--phone-scale, 1));
			transform-origin: center bottom;
		}

		// Drop the first-name watermark (its job is taken by the text block below).
		.rc-first {
			display: none;
		}
		// Bow image: shown as a faint decorative element INSIDE the colour box, BEHIND the
		// contained photo. Reset all the desktop hover positioning/clipping; centre it in
		// the box, contained, and make it slightly transparent.
		// The DESKTOP bow (sibling of .rc-card) is hidden on phone; the phone uses a SEPARATE
		// bow rendered INSIDE .rc-card (.rc-bowimg-phone) so the box's overflow:hidden clips
		// it. Keeping them separate means the desktop card's hover scaleY never stretches the
		// phone bow, and the phone box always clips its enlarged/shifted bow.
		.rc-bowimg {
			display: none;
		}
		// Phone bow: lives inside the colour box (clipped by it), faint, behind the photo.
		.rc-bowimg-phone {
			display: block;
			position: absolute;
			inset: 0;
			top: 0;
			bottom: auto;
			aspect-ratio: 3 / 4; // == the box
			width: 100%;
			height: auto;
			object-fit: contain;
			// Per-archer tuning: --phone-bow-x shifts left/right (negative = LEFT),
			// --phone-bow-y shifts up/down (negative = UP), --phone-bow-scale sizes.
			// --bow-flip (1 or -1) mirrors over the Y-axis (set by .flip-bow below);
			// --bow-type-scale enlarges by bow TYPE (recurve), multiplied with the per-archer
			// --phone-bow-scale so both stack.
			--bow-flip: 1;
			--bow-type-scale: 1;
			--bow-sz: calc(var(--phone-bow-scale, 1) * var(--bow-type-scale));
			transform: translate(var(--phone-bow-x, 0), var(--phone-bow-y, 0))
				scale(calc(var(--bow-sz) * var(--bow-flip)), var(--bow-sz));
			transform-origin: center top;
			opacity: 0.18; // slightly transparent (applies to ALL phone bows)
			z-index: 1; // above the box bg, the photo (z2) sits in front
			pointer-events: none;
		}
		// Klasični luk (recurve) + Goli luk (barebow): mirror the bow horizontally.
		.rc-bowimg-phone.flip-bow {
			--bow-flip: -1;
		}
		// Specific archers opt OUT of the mirror (face the other way). Higher specificity
		// than .flip-bow so it wins.
		.rc-bowimg-phone.flip-bow.no-flip,
		.rc-bowimg-phone.no-flip {
			--bow-flip: 1;
		}
		// Recurve (klasični luk) bows read small — enlarge them on phone + pull up a bit.
		.rc-bowimg-phone.recurve-bow {
			--bow-type-scale: 1.7;
			--phone-bow-y: -16%;
		}
		// Barebow (goli luk): same enlargement AND upward pull as recurve.
		.rc-bowimg-phone.barebow-bow {
			--bow-type-scale: 1.7;
			--phone-bow-y: -16%;
		}
		// Compound (složeni luk): match Amanda's bow size (2.1). Pulled UP more than Amanda
		// (-16% vs her -8%) — Amanda keeps her own -8% via the inline per-archer value on her
		// <li>, which overrides this rule; the OTHER compound bows take this -16%.
		.rc-bowimg-phone.compound-bow {
			--phone-bow-scale: 2.1;
			--phone-bow-y: -16%;
		}

		// Text block BELOW the box, on the white page bg, left-aligned (PSG layout).
		.rc-meta {
			position: static; // out of the absolute overlay → sits under the box
			padding: 0.6rem 0.1rem 0;
			gap: 0.18rem; // small breathing room between first name / surname / bow
			pointer-events: auto;
		}
		.rc-firstname {
			order: 0;
			display: block; // shown on phone (hidden on desktop)
			font-size: 0.66rem; // smaller, sits tight above the surname
			font-weight: 800; // bolder
			text-transform: uppercase;
			letter-spacing: 0.02em;
			line-height: 1;
			color: $ink-meta;
		}
		.rc-last {
			order: 1;
			font-size: 1.35rem;
			line-height: 1.05;
			color: $ink-meta; // dark ink on the white page bg (was white-on-photo)
			text-shadow: none;
		}
		.rc-bow {
			order: 2;
			margin-bottom: 0;
			margin-top: 0; // sit tight under the surname
			font-size: 0.66rem; // smaller, matches the first name
			// Always visible on phone (no hover): reset the hover-reveal transform/opacity.
			opacity: 1;
			transform: none;
			color: $gold-meta;
			text-shadow: none;
		}

		// NOTHING happens on tap. Touch devices fire :hover on tap/focus, which on the
		// desktop card grows the box, slides+scales the photo, and animates the bow. Pin
		// every hover state back to the phone resting state so a tap does nothing visual.
		.rc:hover,
		.rc.tall:hover {
			z-index: auto;
		}
		.rc:hover .rc-photo,
		.rc.tall:hover .rc-photo {
			transform: none;
		}
		.rc:hover .rc-photo :global(.img-loader img),
		.rc.tall:hover .rc-photo :global(.img-loader img) {
			transform: scale(var(--phone-scale, 1)); // hold the resting (per-archer) scale
		}
		.rc:hover .rc-card,
		.rc.tall:hover .rc-card {
			transform: none;
		}
		.rc:hover .rc-bowimg,
		.rc.bow-left:hover .rc-bowimg {
			// keep the faint resting bow exactly where it is (no slide / opacity bump)
			opacity: 0.18;
			transform: none;
		}
		.rc:hover .rc-bow {
			transform: none;
		}
	}
</style>
