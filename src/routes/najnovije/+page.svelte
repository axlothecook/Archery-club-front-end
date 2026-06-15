<script lang="ts">
	// News feed ("Najnovije / Vijesti"). Mirrors the reference news.html, in bands:
	//   1. a featured CAROUSEL of the 5 newest articles (NewsCarousel),
	//   2. a row of 4 compact ArticleCards (next-newest highlights),
	//   3. a newsletter signup band (VISUAL-ONLY placeholder; see PLAN "If adopted"),
	//   4. a "Više vijesti" ArticleCard grid (same compact card layout as the
	//      highlights row) that grows via a "Više" BUTTON — one click loads the next
	//      cursor page (9 articles on desktop, 6 on phone); the button hides when the
	//      feed is exhausted.
	// Both card bands reuse the shared ArticleCard component (image + title).

	import { apiFetch } from '$lib/api';
	import { DEFAULT_LOCALE } from '$lib/locale';
	import { onMount } from 'svelte';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import NewsCarousel from '$lib/components/NewsCarousel.svelte';
	import Flourish from '$lib/components/Flourish.svelte';
	import MailIcon from '$lib/components/icons/MailIcon.svelte';
	import type { ArticleCard as ArticleCardData } from 'archery-contracts';
	import type { ArticleFeedPage } from './+page.ts';

	let { data } = $props();

	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// The newest articles split into three bands (mirrors the reference news.html):
	//   • FEATURED        — headline the carousel
	//   • HIGHLIGHTS       — a row of compact thumbnail cards under the carousel
	//   • the rest         — the "Više vijesti" grid (infinite scroll)
	const FEATURED = 5;
	const HIGHLIGHTS = 4;

	// Live feed state — seeded ONCE from the SSR page, then grown by infinite scroll.
	// svelte-ignore state_referenced_locally
	let items = $state<ArticleCardData[]>(data.items ?? []);
	// svelte-ignore state_referenced_locally
	let cursor = $state<string | null>(data.nextCursor ?? null);
	let loading = $state(false);
	let loadError = $state(false);

	// Articles to hide from the "Više vijesti" grid ON PHONE ONLY (by slug). They still
	// show on desktop; this just trims the phone grid per the editor's request.
	const PHONE_HIDE = new Set([
		'velike-najave-amande-mlinaric-u-prilogu-hrt-sporta',
		'sest-nastupa-sest-medalja-strelicari-vsk-a-uspjesni-u-sisku',
		'zlato-za-tenu-mikolaj-i-zorana-velagica-na-sisackoj-zimi'
	]);
	// Reactive phone flag (<=720px) so the grid filter updates if the viewport changes.
	let isPhone = $state(
		typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches
	);
	$effect(() => {
		const mq = window.matchMedia('(max-width: 720px)');
		const sync = () => (isPhone = mq.matches);
		mq.addEventListener('change', sync);
		return () => mq.removeEventListener('change', sync);
	});

	const featured = $derived(items.slice(0, FEATURED));
	const highlights = $derived(items.slice(FEATURED, FEATURED + HIGHLIGHTS));
	const rest = $derived(
		items
			.slice(FEATURED + HIGHLIGHTS)
			.filter((a) => !(isPhone && PHONE_HIDE.has(a.slug)))
	);
	const hasMore = $derived(cursor !== null);

	// "Više vijesti" loads the next page of older articles into the grid (one click =
	// one page). The page size is RESPONSIVE: 9 on desktop, 6 on phone (<=720px),
	// resolved at click time so it adapts if the viewport changes. nextCursor goes
	// null when there are no more, hiding the button.
	const PAGE_DESKTOP = 9;
	const PAGE_PHONE = 6;
	function pageSize(): number {
		if (typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches)
			return PAGE_PHONE;
		return PAGE_DESKTOP;
	}
	async function loadOlder() {
		if (loading || !cursor) return;
		loading = true;
		loadError = false;
		try {
			const next = await apiFetch<ArticleFeedPage>('/articles', {
				locale: DEFAULT_LOCALE,
				query: { before: cursor, limit: pageSize() }
			});
			items = [...items, ...next.items];
			cursor = next.nextCursor;
		} catch {
			loadError = true;
		} finally {
			loading = false;
		}
	}

	// Ensure the "Više vijesti" grid starts FILLED: the desktop grid is 4 columns, so
	// we want at least 12 cards (a full 4×3) in `rest` on first paint. If the seeded
	// page (or a restored snapshot) has fewer, top up from the cursor on mount. Guards:
	// only runs client-side, only when short AND more pages exist.
	const GRID_TARGET = 12; // 4 columns × 3 rows
	onMount(async () => {
		while (rest.length < GRID_TARGET && cursor && !loading) {
			const before = items.length;
			await loadOlder();
			if (items.length === before) break; // no progress (e.g. error) → stop
		}
	});

	// ── Feed-state restore ───────────────────────────────────────────────────────
	// Snapshot the loaded items + cursor when leaving the feed (e.g. opening an
	// article) so that on BACK-navigation the same set of cards re-renders — which
	// lets SvelteKit's native scroll restoration land the user exactly where they
	// were (the page is tall enough again). Without this the feed would reset to the
	// first SSR page and the saved scroll offset would point past the content.
	export const snapshot = {
		capture: () => ({ items, cursor }),
		restore: (snap: { items: ArticleCardData[]; cursor: string | null }) => {
			items = snap.items;
			cursor = snap.cursor;
		}
	};
</script>

<div class="news">
	<header class="news-hero">
		<h1 class="news-hero-title">Najnovije</h1>
		<p class="news-hero-sub">Vijesti, rezultati i događanja iz kluba.</p>
	</header>

	{#if items.length === 0}
		<p class="news-empty">Trenutno nema objava.</p>
	{:else}
		<!-- Featured carousel -->
		<section class="news-featured">
			<NewsCarousel slides={featured} />
		</section>

		<!-- Highlights: a row of compact article cards (image + title only). -->
		{#if highlights.length > 0}
			<section class="news-highlights">
				<ul class="card-row">
					{#each highlights as article (article.slug)}
						<li><ArticleCard {article} /></li>
					{/each}
				</ul>
			</section>
		{/if}

		<!-- Newsletter signup (VISUAL-ONLY placeholder — the SUBSCRIBE button is inert.
		     Wiring it needs a mailing-list backend; tracked in PLAN.md "If website gets
		     adopted"). Mirrors the reference news.html subscribe band. -->
		<section class="news-signup" aria-label="Pretplata na vijesti">
			<div class="signup-inner">
				<div class="signup-envelope" aria-hidden="true">
					<MailIcon size={104} />
					<img class="signup-crest" src={LOGO_URL} alt="" />
				</div>
				<form
					class="signup-form"
					onsubmit={(e) => e.preventDefault()}
					aria-describedby="signup-disclaimer"
				>
					<div class="signup-fields">
						<input type="email" placeholder="Unesite e-mail" aria-label="E-mail" />
						<input type="tel" placeholder="Telefon (neobavezno)" aria-label="Telefon" />
						<input type="text" placeholder="Poštanski broj" aria-label="Poštanski broj" />
						<button type="submit" class="signup-btn">
							<MailIcon size={16} /><span>Pretplati se</span>
						</button>
					</div>
					<p id="signup-disclaimer" class="signup-disclaimer">
						Davanjem svog broja telefona pristajem da mi Varaždinski streličarski klub putem
						Community usluge šalje vijesti i ponude na navedeni broj te prihvaćam
						<a href="/kontakt">Pravila privatnosti</a> Varaždinskog streličarskog kluba.
						Odgovorite HELP za pomoć. U svakom trenutku možete se odjaviti slanjem poruke
						STOP. Napomena: ovo nije stvarni newsletter, služi isključivo za potrebe osobnog
						projekta.
					</p>
				</form>
			</div>
		</section>

		<!-- Card grid (infinite scroll) -->
		<section class="news-body">
			<h2 class="news-more-heading">Više vijesti</h2>

			<ul class="news-grid">
				{#each rest as article (article.slug)}
					<li><ArticleCard {article} /></li>
				{/each}
			</ul>

			<!-- "Više" button (loads 9 more older articles per click) above the
			     always-present club-crest flourish. The button hides once the feed
			     is exhausted; the flourish stays. -->
			<div class="news-foot">
				{#if hasMore}
					{#if loadError}
						<p class="news-load-error" role="alert">Učitavanje nije uspjelo.</p>
					{/if}
					<button class="load-more" onclick={loadOlder} disabled={loading}>
						{loading ? 'Učitavam…' : 'Više'}
					</button>
				{/if}
				<div class="news-end"><Flourish /></div>
			</div>
		</section>
	{/if}
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;
	$page-bg: #fff; // white news page

	.news {
		width: 100%;
		background-color: $page-bg;
	}

	// ── Hero ────────────────────────────────────────────────────────────────────
	// Left-aligned, lined up with the carousel's left edge (same 1610px container).
	.news-hero {
		max-width: 1610px;
		margin: 0 auto;
		padding: ($sp * 2.5) ($sp * 2) ($sp * 1);
		text-align: left;
		background-color: $page-bg;
	}
	.news-hero-title {
		margin: 0;
		color: $navy;
		font-size: 2.8rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}
	.news-hero-sub {
		margin: ($sp * 0.25) 0 0;
		color: map.get(lib.$colors, 'jet-grey');
		font-weight: 300;
		font-size: 1.05rem;
	}
	.news-empty {
		text-align: center;
		color: map.get(lib.$colors, 'jet-grey');
		font-weight: 300;
		padding: ($sp * 4) ($sp * 2);
	}

	// ── Featured carousel ───────────────────────────────────────────────────────
	// The whole page shares this 1610px width — every band lines up with the
	// carousel's left/right edges, so nothing sticks out wider than it.
	.news-featured {
		max-width: 1610px;
		margin: 0 auto;
		padding: ($sp * 1) ($sp * 2) 0;
	}

	// ── Highlights row (4 ArticleCards under the carousel) ──────────────────────
	.news-highlights {
		max-width: 1610px;
		margin: 0 auto;
		padding: ($sp * 2.5) ($sp * 2) 0;
	}
	// Cards capped narrower than their 1/4 share; the leftover space spreads
	// between them so the highlight cards are smaller with more room around them.
	.card-row {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 340px));
		justify-content: space-between;
		gap: ($sp * 1.5);
		li {
			display: flex;
		}
	}

	// ── Newsletter signup band (visual placeholder) ─────────────────────────────
	// Constrained to the carousel width (the grey box no longer bleeds edge-to-edge);
	// side padding matches the other bands so it lines up with the carousel.
	.news-signup {
		max-width: 1610px;
		margin: ($sp * 7) auto ($sp * 3); // more clearance above + below the grey box
		padding: 0 ($sp * 2);
	}
	.signup-inner {
		// Content is pulled toward the middle: generous side padding so the envelope
		// + form don't span the full grey box edge-to-edge; tight vertical padding.
		padding: ($sp * 1.5) ($sp * 5);
		display: flex;
		justify-content: center;
		align-items: center;
		gap: ($sp * 2);
		background: var(--color-bg-light); // #eee light surface
		border-radius: 12px;
	}
	// Envelope is now just the navy SVG (no box), with the club crest overlapping
	// its top-right corner (mirrors the reference design).
	.signup-envelope {
		position: relative;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: $navy;
	}
	.signup-crest {
		position: absolute;
		top: -8px;
		right: -10px;
		width: 36px;
		height: auto;
	}
	.signup-form {
		// Width matches the 851px bar so the disclaimer below lines up under it.
		flex: 0 1 851px;
		width: 851px;
		min-width: 0;
		max-width: 100%;
	}
	// The entire input bar (3 fields + SUBSCRIBE button) is a fixed 851 × 46.
	.signup-fields {
		width: 851px;
		max-width: 100%;
		height: 46px;
		box-sizing: border-box;
		display: flex;
		align-items: stretch;
		border-radius: 8px;
		overflow: hidden;
		border: 2px solid $gold; // gold border around the whole input group
		input {
			border: none;
			border-right: 1px solid map.get(lib.$colors, 'heather');
			padding: 0 ($sp); // height fixed by the bar; horizontal padding only
			font: inherit;
			font-weight: 400;
			color: $navy;
			background: $white;
			// email (1st) widest; phone (2nd) and zip (3rd) close in width, phone a
			// touch wider than zip.
			&:nth-child(1) {
				flex: 4;
				min-width: 0;
			}
			&:nth-child(2) {
				flex: 3;
				min-width: 0;
			}
			&:nth-child(3) {
				flex: 2.5;
				min-width: 0;
				border-right: none; // no grey divider between the last input and the button
			}
			&:focus {
				outline: none;
				background: map.get(lib.$colors, 'white-smoke');
			}
		}
	}
	.signup-btn {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: ($sp * 0.4);
		padding: 0 ($sp * 1.5); // height fixed by the 46px bar
		white-space: nowrap;
		font: inherit;
		font-size: 15px;
		font-weight: 300;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		color: #000; // black text + svg (MailIcon uses currentColor)
		background: $gold;
		border: none;
		cursor: pointer;
		transition: background-color 0.2s ease;
		&:hover {
			background: color.adjust($gold, $lightness: 6%);
		}
	}
	.signup-disclaimer {
		margin: ($sp * 0.3) 0 0; // tighter gap to the input fields above
		font-size: 0.72rem;
		font-weight: 300;
		line-height: 1.5;
		color: #000; // black, except the link below
		a {
			color: map.get(lib.$colors, 'blue-dress');
		}
	}

	// ── Feed body ───────────────────────────────────────────────────────────────
	// Same 1650px container + side padding as the hero, so "Više vijesti" lines up
	// with "Najnovije".
	.news-body {
		max-width: 1610px;
		margin: 0 auto;
		padding: ($sp * 3) ($sp * 2) ($sp * 1.5); // small bottom pad → flourish sits
		// near the white section's bottom edge (its own top gap is kept by .news-foot)
	}
	.news-more-heading {
		margin: 0 0 ($sp * 2);
		color: $navy;
		font-size: 2rem;
		font-weight: 800;
		letter-spacing: 0.02em;
	}

	// Grid of ArticleCards (same card shape as the highlights row, 3 across).
	// Each column is capped narrower than its 1/3 share, and the leftover space is
	// distributed BETWEEN the columns — so cards are smaller with more breathing
	// room horizontally; a generous row gap separates the rows vertically.
	// "Više vijesti" uses the SAME layout as the highlights row below the carousel
	// (the .card-row above): 4 capped-width columns, space-between, compact cards —
	// instead of the old wider 3-column grid. The responsive media queries below
	// collapse both to 2 columns (<=900px) then 1 (<=600px) identically.
	.news-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 340px));
		justify-content: space-between;
		row-gap: ($sp * 3);
		column-gap: ($sp * 1.5);
		li {
			display: flex;
		}
	}

	// ── "Više vijesti" foot ─────────────────────────────────────────────────────
	// Generous space above (from the last grid row) and below (to the footer / the
	// end flourish) so the button isn't cramped against its neighbours.
	.news-foot {
		margin: ($sp * 8) 0 ($sp * 3);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: ($sp * 5); // more space between the Više button and the flourish below
		min-height: 2rem;
	}
	.load-more {
		padding: ($sp * 0.85) ($sp * 3);
		font: inherit;
		font-size: 1rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: $navy;
		background: $gold;
		border: none;
		border-radius: 7px;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			transform 0.1s ease;
		&:hover:not(:disabled) {
			background: color.adjust($gold, $lightness: 6%);
		}
		&:active:not(:disabled) {
			transform: translateY(1px);
		}
		&:disabled {
			opacity: 0.65;
			cursor: default;
		}
	}
	.news-load-error {
		margin: 0;
		color: #c0392b;
		font-size: 0.9rem;
	}
	.news-end {
		width: 100%; // let the Flourish reach its full width (else align-items:center
		// in .news-foot shrink-wraps it and the two gold lines collapse to 0)
		margin-top: ($sp * 2);
	}

	// ── Responsive ──────────────────────────────────────────────────────────────
	@media (max-width: 900px) {
		.news-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.card-row {
			grid-template-columns: repeat(2, 1fr);
		}
		// PHONE: keep the envelope BESIDE the form (row) but small, and tighten padding
		// so the box height fits the content instead of running tall.
		.signup-inner {
			flex-direction: row;
			align-items: center;
			gap: ($sp * 1.25);
			padding: ($sp * 1.25) ($sp * 1.5); // less side padding than desktop's 5rem
		}
		// Shrink the big envelope SVG so the inputs fit next to it.
		.signup-envelope :global(svg) {
			width: 56px;
			height: 56px;
		}
		.signup-crest {
			width: 26px;
			top: -6px;
			right: -8px;
		}
		.signup-form {
			flex: 1 1 auto;
			width: auto;
		}
	}
	@media (max-width: 600px) {
		// (Više vijesti stays 2 columns here, matching the highlights .card-row — the
		// old 1-column override was removed so the two layouts match on phones.)
		.news-hero-title {
			font-size: 2.6rem;
		}
		// Slightly tighter side gap between the carousel and the screen edges on phone.
		.news-featured {
			padding-left: $sp;
			padding-right: $sp;
		}
		// Inputs stack in the bar; the SUBSCRIBE button drops BELOW the input group.
		.signup-fields {
			flex-direction: column;
			height: auto; // fit the stacked inputs (the 46px fixed bar would clip them)
			input,
			.signup-btn {
				border-right: none;
				width: 100%;
				justify-content: center;
			}
			input {
				height: 42px;
			}
			input:not(:last-of-type) {
				border-bottom: 1px solid map.get(lib.$colors, 'heather');
			}
			// Button below the inputs, separated from the input group.
			.signup-btn {
				height: 44px;
				border-top: 1px solid map.get(lib.$colors, 'heather');
			}
		}
	}
</style>
