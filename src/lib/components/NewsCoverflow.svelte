<script lang="ts">
	// 3D coverflow news carousel (NVIDIA-style). 8 article cards arranged on a CIRCLE
	// (a ring) — not a flat line — so it loops continuously with no start/finish: the
	// centre card faces forward and shows the full ArticleCard (image + title overlaid at
	// the bottom of the photo, the photo's foot blurred/darkened so the white title reads);
	// cards curving away to each side show their BACK = the poster image only, no white
	// panel, angles mirrored left vs right. Two chevron arrows rotate the ring one step
	// (wrapping past either end). Rotating cards pass OVER the arrows. Each card has a
	// faded reflection beneath it. Black band, navy fading in at the top and bottom edges.

	import type { ArticleCard as ArticleCardData } from 'archery-contracts';
	import CoverflowArrowIcon from '$lib/components/icons/CoverflowArrowIcon.svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';

	let { slides }: { slides: ArticleCardData[] } = $props();

	const locale = $derived(page.data.locale);

	let active = $state(0);

	// How many cards stay visible on each side of the front one (rest fade out).
	const SIDE = 3;
	// Spacing + tilt knobs. The ±1 cards sit a wide FIRST_GAP from the front card (so they
	// clear it); the outer side cards then step out by a smaller STEP_GAP (packed closer).
	// Each side card also recedes in depth (rotateY) and dips its OUTER edge down (rotateZ)
	// — its INNER edge stays level with the front card's top line (rotation hinges there).
	const FIRST_GAP = 420; // px from the front card to its ±1 neighbours
	const STEP_GAP = 270; // px between each further side card (±1→±2→±3)
	const PUSH = 130; // px each card sinks back per step
	const TILT_Y = 46; // deg recede per step (turned so the back/poster faces in)
	const TILT_Z = 7; // deg the outer edge dips per step

	// Circular = no dead ends: arrows always work and wrap around the ring.
	const n = $derived(slides.length);

	function go(dir: -1 | 1) {
		if (n === 0) return;
		active = (active + dir + n) % n;
	}

	// Shortest signed distance from card i to the active card, around the ring (so card 0
	// can sit just LEFT of card n-1 when wrapping). Range roughly [-n/2, n/2].
	function ringOffset(i: number) {
		let d = i - active;
		if (d > n / 2) d -= n;
		if (d < -n / 2) d += n;
		return d;
	}

	// Per-card placement from its (wrapped) offset.
	//   offset 0  → front: flat, forward, full size.
	//   offset ≠0 → stepped out by GAP, pushed back, turned (rotateY) so its poster-back
	//               faces in, and tilted (rotateZ) so the OUTER edge dips lower while the
	//               INNER edge stays at the front card's top line. Mirrored by sign(offset).
	function placement(offset: number) {
		const abs = Math.abs(offset);
		const dir = Math.sign(offset); // -1 left, +1 right
		const hidden = abs > SIDE;

		// Wide first gap to clear the front card, then tighter steps for the outer cards.
		const x = dir * (abs === 0 ? 0 : FIRST_GAP + (abs - 1) * STEP_GAP); // horizontal position
		const z = offset === 0 ? 0 : -PUSH * abs; // depth (sink back)
		const rotateY = -dir * (offset === 0 ? 0 : TILT_Y); // recede; mirrored
		const rotateZ = dir * (offset === 0 ? 0 : TILT_Z); // outer edge dips; mirrored
		const scale = offset === 0 ? 1 : Math.max(0.5, 0.82 - (abs - 1) * 0.1);
		const zIndex = 100 - abs;
		const opacity = hidden ? 0 : 1;
		// Hinge from the INNER vertical edge so the near edge holds the front card's height:
		// right-side cards pivot on their LEFT edge, left-side cards on their RIGHT edge.
		const origin = offset === 0 ? 'center' : dir > 0 ? 'left center' : 'right center';

		return { x, z, rotateY, rotateZ, scale, zIndex, opacity, hidden, origin };
	}
</script>

<div class="cf" style="--side:{SIDE}">
	<!-- Left arrow -->
	<button class="cf-arrow cf-arrow-left" type="button" onclick={() => go(-1)} aria-label={t(locale, 'cf.prev')}>
		<CoverflowArrowIcon direction="left" size={34} />
	</button>

	<div class="cf-stage">
		{#each slides as article, i (article.slug)}
			{@const p = placement(ringOffset(i))}
			<div
				class="cf-card"
				class:is-front={i === active}
				style="
					transform: translateX({p.x}px) translateZ({p.z}px) rotateY({p.rotateY}deg) rotateZ({p.rotateZ}deg) scale({p.scale});
					transform-origin: {p.origin};
					z-index: {p.zIndex};
					opacity: {p.opacity};
					pointer-events: {p.hidden ? 'none' : 'auto'};
				"
			>
				{#if i === active}
					<!-- FRONT: the poster fills the card; the title overlays the bottom of the
					     photo on a blurred/darkened strip so the white text stays legible.
					     The reflection is a CSS box-reflect (renders in the card's own plane,
					     so it follows the 3D transform cleanly). -->
					<a class="cf-face cf-card-front" href="/najnovije/{article.slug}">
						<img src={article.posterImage.url} alt={article.posterImage.alt} />
						<div class="cf-front-foot">
							<h3 class="cf-front-title">{article.title}</h3>
						</div>
					</a>
				{:else}
					<!-- SIDE: back of the card = poster image only, no panel. Click → bring to front. -->
					<button class="cf-face cf-card-back" type="button" onclick={() => (active = i)} aria-label={article.title}>
						<img src={article.posterImage.url} alt={article.posterImage.alt} />
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Right arrow -->
	<button class="cf-arrow cf-arrow-right" type="button" onclick={() => go(1)} aria-label={t(locale, 'cf.next')}>
		<CoverflowArrowIcon direction="right" size={34} />
	</button>
</div>

<style lang="scss">
	// Card dimensions — the ArticleCard's 16:9 media + a title line. Keep an aspect close
	// to the front-card look in the reference.
	$cardW: 340px;
	$cardH: 360px;
	$ease: cubic-bezier(0.22, 0.61, 0.36, 1);

	.cf {
		position: relative;
		width: 100%;
		// The black band + navy edge-fade now live on the enclosing .home-news section (so
		// the "VIJESTI" header sits on the same black). This stage is transparent. Generous
		// bottom padding leaves room for the reflection to sit inside the black, never over
		// the navy bottom-fade.
		// Bottom padding tuned so the black below the cards mirrors the black above them
		// (section top → header/gap → cards is balanced by cards → this padding → section
		// bottom), giving the band vertical symmetry.
		padding: clamp(1rem, 3vh, 2.5rem) 0 clamp(38rem, 64vh, 54rem);
		overflow: hidden;
	}

	// The 3D scene. perspective gives the depth; cards are positioned absolutely and
	// centred, then transformed out from the middle.
	.cf-stage {
		position: relative;
		height: $cardH;
		perspective: 1600px;
		transform-style: preserve-3d;
	}

	.cf-card {
		position: absolute;
		top: 0;
		left: 50%;
		width: $cardW;
		height: $cardH;
		margin-left: -($cardW * 0.5);
		transform-style: preserve-3d;
		// The animation: every position change eases the transform → cards slide + rotate
		// into their new slots.
		transition:
			transform 0.6s $ease,
			opacity 0.5s ease,
			z-index 0s;
		will-change: transform;
	}
	// While moving, cards must ride OVER the arrows (arrows sit at a low z-index below).
	.cf-card.is-front {
		z-index: 120 !important;
	}

	// The visible face fills the card.
	.cf-face {
		position: absolute;
		inset: 0;
	}

	// Shared card-photo shell: poster fills the card, rounded, clipped. A CSS box-reflect
	// gives each card a faded mirror beneath it — it renders in the card's own 2D plane so
	// it follows the 3D ring transform correctly (a flipped DOM copy does not).
	.cf-card-front,
	.cf-card-back {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		border-radius: 10px;
		overflow: hidden;
		background: #000;
		cursor: pointer;
		-webkit-box-reflect: below 6px
			linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(0, 0, 0, 0.35) 100%);
		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			display: block;
			transition: transform 0.4s ease;
		}
	}

	// FRONT card: poster fills it, title overlaid at the bottom on a blurred + darkened
	// strip (so the white title reads over any photo). Keeps a subtle hover zoom.
	.cf-card-front {
		position: relative;
		text-decoration: none;
		&:hover img {
			transform: scale(1.05);
		}
	}
	.cf-front-foot {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 2.4rem 1.5rem 1.4rem;
		// Blur the photo behind the text + darken it bottom-up so white stays legible.
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.35) 55%, transparent 100%);
		// Confine the blur to the foot strip (round only its job, not the whole image).
		-webkit-mask-image: linear-gradient(to top, #000 60%, transparent 100%);
		mask-image: linear-gradient(to top, #000 60%, transparent 100%);
	}
	.cf-front-title {
		margin: 0;
		color: var(--color-ink, #f3f5f8);
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1.3;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
		// Full title — no clamp/ellipsis.
	}

	// ── Arrows ──────────────────────────────────────────────────────────────────
	// Bare arrow icons only — no background, no border, no hover/active change. Sit at the
	// vertical middle, low z-index so rotating cards pass over them.
	.cf-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 2;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-ink, #f3f5f8);
		cursor: pointer;
	}
	.cf-arrow-left {
		left: clamp(1rem, 4vw, 3.5rem);
	}
	.cf-arrow-right {
		right: clamp(1rem, 4vw, 3.5rem);
	}
</style>
