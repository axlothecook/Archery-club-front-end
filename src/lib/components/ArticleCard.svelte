<script lang="ts">
	// Reusable news card: a 16:9 poster (with the loading fallback) above the
	// article title — image + title only, no excerpt. Used both in the highlights
	// row under the carousel and in the "Više vijesti" grid, so the news feed reads
	// consistently. Links to the article detail.
	//
	// PHONE (≤720px) ONLY: a PSG-style variant — the poster on top, then a text block
	// BELOW it (category label · title · date). The category/date elements are
	// display:none on desktop, so desktop stays image + title exactly as before.

	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import type { ArticleCard as ArticleCardData, ArticleMediaType } from 'archery-contracts';
	import { formatDate } from '$lib/date';
	import { t } from '$lib/i18n';
	import { page } from '$app/state';

	let { article }: { article: ArticleCardData } = $props();

	const locale = $derived(page.data.locale);

	// Phone-only category label, derived from the article's media type.
	const MEDIA_KEY: Record<ArticleMediaType, string> = {
		event: 'media.event',
		gallery: 'media.gallery',
		'video-only': 'media.video',
		'external-link': 'media.externalLink'
	};
	const category = $derived(t(locale, MEDIA_KEY[article.mediaType] ?? 'media.event'));
	const dateLabel = $derived(formatDate(article.publishedAt, locale));
</script>

<a class="article-card" href="/najnovije/{article.slug}">
	<div class="article-card-media">
		<ImageWithLoader src={article.posterImage.url} alt={article.posterImage.alt} fit="cover" rounded />
	</div>
	<!-- Phone-only: category above the title (gold, uppercase). -->
	<span class="article-card-cat">{category}</span>
	<h3 class="article-card-title">{article.title}</h3>
	<!-- Phone-only: date below the title. -->
	{#if dateLabel}<span class="article-card-date">{dateLabel}</span>{/if}
</a>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$grey: map.get(lib.$colors, 'jet-grey');
	$sp: lib.$base-padding;

	.article-card {
		display: flex;
		flex-direction: column;
		gap: ($sp * 0.75);
		width: 100%;
		height: 100%;
		text-decoration: none;
		-webkit-tap-highlight-color: transparent; // no blue tap-flash on phone
		&:hover .article-card-media :global(img) {
			transform: scale(1.05);
		}
		&:hover .article-card-title {
			color: map.get(lib.$colors, 'blue-dress');
		}
	}
	.article-card-media {
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: 10px;
		:global(img) {
			transition: transform 0.4s ease;
		}
	}
	.article-card-title {
		margin: 0;
		color: $navy;
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1.3;
		transition: color 0.2s ease;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	// Category + date are PHONE-ONLY (hidden on desktop, where the card is image+title).
	.article-card-cat,
	.article-card-date {
		display: none;
	}

	// ── Phone (PSG style): poster on top, text block below ──────────────────────────
	@media (max-width: 720px) {
		.article-card {
			gap: 0.4rem;
		}
		// Square corners on the poster (no rounding) for the PSG card look. The image is
		// wrapped by ImageWithLoader's `.img-loader.rounded` (12px) — flatten that here too.
		.article-card-media {
			border-radius: 0;
			:global(.img-loader) {
				border-radius: 0;
			}
		}
		.article-card-cat {
			display: block;
			margin-top: 0.15rem;
			color: $gold;
			font-size: 0.72rem;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			line-height: 1;
		}
		.article-card-title {
			font-size: 0.98rem;
			line-height: 1.2;
		}
		.article-card-date {
			display: block;
			color: $grey;
			font-size: 0.74rem;
			font-weight: 500;
		}
	}
</style>
