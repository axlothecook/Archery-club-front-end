<script lang="ts">
	// Reusable news card: a 16:9 poster (with the loading fallback) above the
	// article title — image + title only, no excerpt. Used both in the highlights
	// row under the carousel and in the "Više vijesti" grid, so the news feed reads
	// consistently. Links to the article detail.

	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import type { ArticleCard as ArticleCardData } from 'archery-contracts';

	let { article }: { article: ArticleCardData } = $props();
</script>

<a class="article-card" href="/najnovije/{article.slug}">
	<div class="article-card-media">
		<ImageWithLoader src={article.posterImage.url} alt={article.posterImage.alt} fit="cover" rounded />
	</div>
	<h3 class="article-card-title">{article.title}</h3>
</a>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$sp: lib.$base-padding;

	.article-card {
		display: flex;
		flex-direction: column;
		gap: ($sp * 0.75);
		width: 100%;
		height: 100%;
		text-decoration: none;
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
</style>
