<script lang="ts">
	// Single news article. The body is plain text with "\n\n" paragraph breaks
	// (FB-sourced) — split into <p> blocks, same as the chapter page. Extra images
	// are interleaved after the paragraphs; mentioned archers link to /momcad/:slug;
	// an external-link post surfaces its source, and FB posts a "view on Facebook".

	import { page } from '$app/state';
	import { formatDateHr } from '$lib/date';
	import { splitParagraphs } from '$lib/text';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import Flourish from '$lib/components/Flourish.svelte';
	import FacebookIcon from '$lib/components/icons/FacebookIcon.svelte';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import YouTubeIcon from '$lib/components/icons/YouTubeIcon.svelte';
	import ClockIcon from '$lib/components/icons/ClockIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import { bowLabel } from '$lib/archer';

	let { data } = $props();
	const article = $derived(data.article);
	const mentionedCards = $derived(data.mentionedCards ?? []);

	// Club socials (site-wide layout data) shown as small icons in the meta row.
	const socials = $derived(page.data.clubInfo?.socials ?? []);
	const SOCIAL_ICON: Record<string, typeof FacebookIcon> = {
		facebook: FacebookIcon,
		instagram: InstagramIcon,
		youtube: YouTubeIcon
	};

	// Split the body on blank lines into readable paragraphs (FB text stores breaks
	// as "\n\n"). Extra `images` (beyond the poster) render below the prose.
	const paragraphs = $derived(splitParagraphs(article.body));
	// Gallery images, ordered, with duplicate URLs removed (some posts repeat the
	// same photo — show each only once).
	const extraImages = $derived.by(() => {
		const sorted = [...(article.images ?? [])].sort((a, b) => a.order - b.order);
		const seen = new Set<string>();
		return sorted.filter((img) => {
			if (seen.has(img.url)) return false;
			seen.add(img.url);
			return true;
		});
	});

	// Escape HTML, then: (1) turn markdown links [text](url) into gold <a> tags, and
	// (2) colour any #hashtag word (supermarket blue). Rendered via {@html}. We escape
	// first (the body is plain text) so only our own markup is ever injected; the URL
	// is restricted to http(s) so the {@html} can't inject a javascript: link.
	function renderPara(text: string): string {
		let html = text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');

		// [label](https://…) → <a class="post-link" href="…">label</a>
		html = html.replace(
			/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
			(_m, label, url) =>
				`<a class="post-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
		);

		// #hashtags (skip ones already inside an injected tag is unnecessary — the
		// markdown-link labels above don't contain raw # words here).
		html = html.replace(/(^|\s)(#[\p{L}\p{N}_]+)/gu, '$1<span class="hashtag">$2</span>');
		return html;
	}

	// Reveal each gallery image as it scrolls into view — it "flies" up into place
	// (as if it had fallen off and the action were reverted). Triggers when 10% of
	// the figure is visible (IntersectionObserver threshold 0.1), one-shot.
	function flyIn(node: HTMLElement) {
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					node.classList.add('flew-in');
					io.disconnect();
				}
			},
			{ threshold: 0.1 }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}

</script>

<article class="post">
	<!-- Cover -->
	<header class="post-hero">
		<!-- Chapter-page style: a blurred enlarged copy of the poster always fills the
		     band behind a sharp photo. The sharp photo sits in a fixed central frame and
		     is shown COVER (zoomed/cropped to fill that frame) so EVERY poster, whatever
		     its shape, reads like the wide Leda Crnčec cover. -->
		<div class="post-hero-blur" style="background-image:url({article.posterImage.url})"></div>
		<div class="post-hero-frame">
			<ImageWithLoader
				src={article.posterImage.url}
				alt={article.posterImage.alt}
				fit="cover"
				loading="eager"
				class="post-hero-media"
			/>
		</div>
		<div class="post-hero-overlay"></div>
		<div class="post-hero-inner">
			<h1 class="post-title">{article.title}</h1>
		</div>
	</header>

	<div class="post-body">
		<!-- Meta row in the body (the dark band below the cover photo): date + time on
		     the left, the club tag on the right. The seed carries only a date, so a
		     representative time is shown. -->
		{#if article.publishedAt}
			<div class="post-meta">
				<div class="post-meta-left">
					<time class="post-date" datetime={article.publishedAt}>
						{formatDateHr(article.publishedAt)}
					</time>
					<span class="post-time"><ClockIcon size={16} /> 09:45 AM</span>
				</div>
				<span class="post-club">VSK <span class="post-club-square" aria-hidden="true"></span></span>
			</div>
		{/if}

		<!-- Thin divider spanning both columns, below the meta row. -->
		<hr class="post-divider" />

		<!-- Social icons below the divider, with a gap before the columns. -->
		{#if socials.length}
			<div class="post-socials">
				{#each socials as soc (soc.platform)}
					{#if SOCIAL_ICON[soc.platform]}
						{@const Icon = SOCIAL_ICON[soc.platform]}
						<a
							class="post-social"
							href={soc.url}
							target="_blank"
							rel="noopener"
							aria-label={soc.platform}
						>
							<Icon size={34} />
						</a>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Two columns: prose (+ FB) on the left; the gallery images stacked in a
		     column on the right, with the "U ovom članku" archer cards beneath them. -->
		<div class="post-columns" class:has-aside={extraImages.length > 0 || mentionedCards.length > 0}>
			<div class="post-main">
				<!-- Prose: markdown links → gold <a>, #hashtags coloured (via renderPara → {@html}). -->
				{#each paragraphs as para}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<p class="post-para">{@html renderPara(para)}</p>
				{/each}

				<!-- View on Facebook (FB-sourced posts only) -->
				{#if article.fbPermalinkUrl}
					<p class="post-fb">
						<a href={article.fbPermalinkUrl} target="_blank" rel="noopener noreferrer">
							<FacebookIcon size={18} />
							<span>Pogledaj na Facebooku</span>
						</a>
					</p>
				{/if}
			</div>

			<!-- Right column: gallery photos, then the mentioned-archer cards. -->
			<aside class="post-aside">
				{#if extraImages.length > 0}
					<div class="post-gallery">
						<!-- Key by index, not url: some posts repeat the same image url, and a
						     duplicate key crashes the keyed each block (each_key_duplicate). -->
						{#each extraImages as img, i (i)}
							<figure class="post-figure" use:flyIn>
								<ImageWithLoader src={img.url} alt={img.alt} fit="cover" />
							</figure>
						{/each}
					</div>
				{/if}

				<!-- "U ovom članku": cards for the mentioned archers, separated from the
				     gallery by a thin divider line. -->
				{#if mentionedCards.length > 0}
					<section class="post-archers">
						<h2 class="post-archers-title">U ovom članku</h2>
						<ul class="archer-cards">
							{#each mentionedCards as a (a.slug)}
								<li>
									<a class="archer-card" href="/momcad/{a.slug}">
										<span class="archer-card-photo">
											{#if a.cardPhoto}
												<ImageWithLoader src={a.cardPhoto.url} alt={a.cardPhoto.alt} fit="cover" />
											{/if}
										</span>
										<span class="archer-card-text">
											<span class="archer-card-name">{a.firstName} {a.lastName}</span>
											<span class="archer-card-bow">{bowLabel(a.bowType)}</span>
										</span>
										<span class="archer-card-arrow"><ChevronIcon size={20} direction="right" /></span>
									</a>
								</li>
							{/each}
						</ul>
					</section>
				{/if}
			</aside>
		</div>

		<div class="post-end"><Flourish /></div>
	</div>
</article>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');
	$blue: map.get(lib.$colors, 'blue-dress');
	$sp: lib.$base-padding;
	$page-bg: var(--color-footer);

	.post {
		width: 100%;
		background-color: $page-bg;
	}

	// ── Cover hero ──────────────────────────────────────────────────────────────
	.post-hero {
		position: relative;
		min-height: 70vh;
		display: flex;
		align-items: flex-end;
		overflow: hidden;
		background: $navy; // shows until the photo loads
	}
	// Blurred copy of the poster fills the whole band behind the sharp photo.
	.post-hero-blur {
		position: absolute;
		inset: -40px; // bleed so the blur has no hard edges
		background-size: cover;
		background-position: center;
		filter: blur(28px) brightness(0.7);
		transform: scale(1.1);
	}
	// Fixed central frame at the Leda Crnčec landscape ratio (3:2). The sharp photo
	// fills this frame (cover, cropped) so EVERY poster reads at the same size/shape,
	// whatever its native aspect. The blur shows on either side of it.
	.post-hero-frame {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		aspect-ratio: 3 / 2;
		max-width: 100%;
		overflow: hidden;
	}
	// The sharp photo fills its frame (cover, cropped), centred.
	.post-hero :global(.post-hero-media) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: transparent; // ImageWithLoader paints white by default
	}
	// Hide the component's white loading fallback here — the blurred poster already
	// fills the band while the sharp photo loads.
	.post-hero :global(.post-hero-media .img-loader-fallback) {
		display: none;
	}
	.post-hero-overlay {
		position: absolute;
		inset: 0;
		background-image: linear-gradient(
			to bottom,
			color.change($navy, $alpha: 0.1) 0%,
			color.change($navy, $alpha: 0.55) 55%,
			color.change($navy, $alpha: 0.92) 100%
		);
	}
	.post-hero-inner {
		position: relative;
		width: 100%;
		max-width: 1240px; // wider title block, pushed a bit further left
		margin: 0 auto;
		padding: ($sp * 3) ($sp * 2);
	}
	// Meta row at the top of the body (the dark band below the cover photo): date +
	// time on the left, the club tag on the right.
	.post-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: ($sp);
		margin: 0 0 ($sp * 1.5);
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.post-meta-left {
		display: flex;
		align-items: center;
		gap: ($sp);
	}
	.post-date {
		color: $gold;
	}
	.post-time {
		display: inline-flex;
		align-items: center;
		gap: ($sp * 0.35);
		color: #ccc;
		:global(svg) {
			display: block;
		}
	}
	// Club tag on the right end + a small golden square.
	// Social icons sit below the divider line, centred, with a gap before the columns.
	.post-socials {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: ($sp * 1.5);
		margin-bottom: ($sp * 4); // larger gap before the prose / gallery columns
	}
	.post-social {
		display: inline-flex;
		color: #ccc;
		transition: color 0.2s ease;
		&:hover {
			color: $white;
		}
		// Force every social glyph into the same box so FB/IG/YT all read at one size
		// (their source viewBoxes differ).
		:global(svg) {
			width: 28px;
			height: 28px;
			display: block;
		}
	}
	.post-club {
		display: inline-flex;
		align-items: center;
		gap: ($sp * 0.5);
		color: $white;
	}
	.post-club-square {
		width: 0.7rem;
		height: 0.7rem;
		background: $gold; // solid gold, square corners
	}
	// Thin divider below the meta row, spanning the full body (both columns).
	.post-divider {
		height: 0;
		width: 25%; // a quarter of the body width, centred
		margin: ($sp * 1.25) auto ($sp * 1.5);
		border: 0;
		border-top: 1px solid rgb(204, 217, 226);
	}
	.post-title {
		margin: 0;
		color: $white;
		font-size: 3.2rem;
		font-style: italic;
		font-weight: 900;
		line-height: 1.15;
	}

	// ── Body ────────────────────────────────────────────────────────────────────
	// Matches the title block width (1240px) so the text column lines up with the
	// title and the prose + aside sit side by side.
	.post-body {
		max-width: 1440px;
		margin: 0 auto;
		padding: ($sp * 3) ($sp * 2) ($sp * 5);
		color: var(--color-ink);
	}
	.post-para {
		margin: 0 0 ($sp * 1.3);
		font-size: 1.15rem;
		font-weight: 300;
		line-height: 1.8;
	}
	// Drop cap: enlarge the first letter of the opening paragraph.
	.post-para:first-of-type::first-letter {
		float: left;
		margin: 0.05em ($sp * 0.7) 0 0;
		font-size: 5.6em;
		font-weight: 800;
		line-height: 0.8;
		color: $gold;
	}
	// #hashtags in the prose — supermarket blue. :global because the {@html} content
	// gets no scope class.
	.post-para :global(.hashtag) {
		color: map.get(lib.$colors, 'supermarket-blue');
		font-weight: 500;
	}
	// Inline markdown links in the prose — gold. :global for the {@html} content.
	.post-para :global(.post-link) {
		color: $gold;
		font-weight: 600;
		text-decoration: none;
		&:hover {
			text-decoration: underline;
		}
	}

	// ── Two-column body: prose left, aside (gallery + archer cards) right ───────
	.post-columns {
		display: grid;
		grid-template-columns: 1fr; // single column when there's no aside
		gap: ($sp * 4);
		align-items: start;
		&.has-aside {
			grid-template-columns: minmax(0, 1fr) minmax(0, 620px); // text | aside (wider images)
		}
	}
	.post-main {
		min-width: 0;
	}
	.post-aside {
		min-width: 0;
	}

	// ── Gallery (right column, images stacked vertically) ───────────────────────
	.post-gallery {
		display: flex;
		flex-direction: column;
		gap: ($sp * 1.25);
		perspective: 1200px; // 3D depth so the fly-in recedes from the viewer
	}
	.post-figure {
		$cut: 52px; // diagonal corner-cut size
		margin: 0;
		aspect-ratio: 4 / 3; // larger / taller than the old 3:2
		overflow: hidden;
		border-radius: 0; // square corners; diagonal cuts come from clip-path
		// Alternating diagonal corner cuts. Odd-position images (1st, 3rd, 5th —
		// :nth-child(odd)) cut the TOP-LEFT + BOTTOM-RIGHT corners; even-position ones
		// cut TOP-RIGHT + BOTTOM-LEFT.
		&:nth-child(odd) {
			clip-path: polygon(
				#{$cut} 0,
				100% 0,
				100% calc(100% - #{$cut}),
				calc(100% - #{$cut}) 100%,
				0 100%,
				0 #{$cut}
			);
		}
		&:nth-child(even) {
			clip-path: polygon(
				0 0,
				calc(100% - #{$cut}) 0,
				100% #{$cut},
				100% 100%,
				#{$cut} 100%,
				0 calc(100% - #{$cut})
			);
		}

		// Fly-in reveal on the Z-axis: each image starts having "fallen TOWARD the
		// viewer" (popped out of the screen — large/close on translateZ, slightly
		// tilted) and, when 10% scrolls into view (the flyIn action adds .flew-in),
		// recedes back into its resting plane. Odd images tilt one way, even the other.
		opacity: 0;
		transform-origin: center;
		transform: perspective(1200px) translateZ(280px) rotateX(8deg) rotateZ(-3deg);
		transition:
			transform 1s cubic-bezier(0.22, 1, 0.36, 1),
			opacity 0.7s ease;
		&:nth-child(even) {
			transform: perspective(1200px) translateZ(280px) rotateX(8deg) rotateZ(3deg);
		}
		// .flew-in is added at runtime by the flyIn action → :global so Svelte keeps it.
		&:global(.flew-in) {
			opacity: 1;
			transform: perspective(1200px) translateZ(0) rotateX(0) rotateZ(0);
		}
	}
	// Respect reduced-motion: no fly-in, just show.
	@media (prefers-reduced-motion: reduce) {
		.post-figure {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}

	// ── "U ovom članku": mentioned-archer cards ─────────────────────────────────
	// Separated from the gallery above by a thin line with a gap on both sides.
	.post-archers {
		margin-top: ($sp * 2.5);
		padding-top: ($sp * 2.5);
		border-top: 1px solid rgb(204, 217, 226);
	}
	.post-archers-title {
		margin: 0 0 ($sp * 2.5); // mirror the distance from the line above
		font-size: 1.8rem;
		font-style: italic;
		font-weight: 800;
		text-transform: uppercase;
		color: $white;
	}
	.archer-cards {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: ($sp * 0.75);
	}
	// Each archer card: photo (flush to top/bottom/left, slanted right edge) · name +
	// bow · chevron (far right). Card background = the divider line colour.
	.archer-card {
		position: relative;
		display: flex;
		align-items: center;
		gap: ($sp);
		height: 64px; // FIXED so every card is the same height regardless of photo ratio
		background: rgb(204, 217, 226);
		border-radius: 8px;
		overflow: hidden;
		text-decoration: none;
		transition: filter 0.2s ease;
		&:hover {
			filter: brightness(0.97);
		}
	}
	// Photo touches the top, bottom and left edges; its right edge is cut at an
	// angle (the top-right corner sits further right than the bottom-right one).
	.archer-card-photo {
		flex: 0 0 auto;
		align-self: stretch;
		width: 76px;
		background: $navy;
		clip-path: polygon(0 0, 100% 0, 78% 100%, 0 100%);
		:global(.img-loader) {
			width: 100%;
			height: 100%;
		}
	}
	.archer-card-text {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
		line-height: 1.2;
		padding: ($sp * 0.35) 0;
	}
	.archer-card-name {
		font-weight: 800;
		font-size: 1rem;
		color: #000;
	}
	.archer-card-bow {
		font-size: 0.85rem;
		color: map.get(lib.$colors, 'jet-grey');
	}
	.archer-card-arrow {
		flex: 0 0 auto;
		display: inline-flex;
		padding-right: ($sp * 1.25); // the card has no padding; keep the chevron off the edge
		color: map.get(lib.$colors, 'jet-grey');
	}

	// ── Facebook link ───────────────────────────────────────────────────────────
	.post-fb {
		margin: ($sp * 2) 0 0;
		text-align: center; // centre the "Pogledaj na Facebooku" link in its column
		a {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: ($sp * 0.5);
			font-size: 0.95rem;
			font-weight: 600;
			color: #ccc;
			text-decoration: none;
			transition: color 0.2s ease;
			&:hover {
				color: $white;
			}
		}
	}

	.post-end {
		margin: ($sp * 11) 0 ($sp * 4); // big gap above + lower the flourish down the page
	}

	// Below this width the two columns stack: prose, then the aside underneath.
	@media (max-width: 820px) {
		.post-columns.has-aside {
			grid-template-columns: 1fr;
		}
		.post-gallery {
			flex-direction: row;
			flex-wrap: wrap;
			.post-figure {
				flex: 1 1 45%;
			}
		}
	}
	@media (max-width: 600px) {
		.post-title {
			font-size: 1.9rem;
		}
		.post-gallery .post-figure {
			flex-basis: 100%;
		}
	}
</style>
