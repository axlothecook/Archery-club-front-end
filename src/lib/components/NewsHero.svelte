<script lang="ts">
	// PSG-style big "hero" news card — PHONE ONLY (the homepage renders the 3D coverflow
	// on desktop instead). A full-width near-square poster with the category, title and
	// date overlaid at the bottom over a dark gradient scrim. Links to the article.
	import type { ArticleCard as ArticleCardData, ArticleMediaType } from 'archery-contracts';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import { formatDate } from '$lib/date';
	import { t } from '$lib/i18n';
	import { page } from '$app/state';

	let { article }: { article: ArticleCardData } = $props();

	const locale = $derived(page.data.locale);

	const MEDIA_KEY: Record<ArticleMediaType, string> = {
		event: 'media.event',
		gallery: 'media.gallery',
		'video-only': 'media.video',
		'external-link': 'media.externalLink'
	};
	const category = $derived(t(locale, MEDIA_KEY[article.mediaType] ?? 'media.event'));
	const dateLabel = $derived(formatDate(article.publishedAt, locale));
</script>

<a class="news-hero" href="/najnovije/{article.slug}">
	<div class="news-hero-img">
		<ImageWithLoader src={article.posterImage.url} alt={article.posterImage.alt} fit="cover" />
	</div>
	<div class="news-hero-scrim" aria-hidden="true"></div>
	<div class="news-hero-text">
		<span class="news-hero-cat">{category}</span>
		<h3 class="news-hero-title">{article.title}</h3>
		{#if dateLabel}<span class="news-hero-date">{dateLabel}</span>{/if}
	</div>
</a>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');

	.news-hero {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 1 / 1; // big square (PSG hero)
		overflow: hidden;
		border-radius: 0; // square corners (no curved image corners)
		text-decoration: none;
		-webkit-tap-highlight-color: transparent; // no blue tap-flash on phone
	}
	.news-hero-img {
		position: absolute;
		inset: 0;
	}
	// Dark gradient from the bottom so the overlaid text is always legible.
	.news-hero-scrim {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(8, 21, 48, 0.92) 0%, rgba(8, 21, 48, 0.35) 38%, rgba(8, 21, 48, 0) 62%);
	}
	.news-hero-text {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 1.25rem 1.1rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.news-hero-cat {
		color: $gold;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		line-height: 1;
	}
	.news-hero-title {
		margin: 0;
		color: $white;
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1.15;
		text-transform: uppercase;
		letter-spacing: 0.01em;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.news-hero-date {
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.82rem;
		font-weight: 500;
	}
</style>
