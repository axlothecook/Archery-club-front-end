<script lang="ts">
	import { page } from '$app/state';
	import { error } from '@sveltejs/kit';
	import { apiSlugFor, sectionByApiSlug } from '$lib/identity';
	import type { ClubIdentitySectionResolved } from 'archery-contracts';

	const sections = $derived((page.data.sections ?? []) as ClubIdentitySectionResolved[]);

	// Map the Croatian URL slug (grb/dres) to the backend slug (crest/jersey),
	// then find the loaded section. Unknown slug → 404.
	const section = $derived.by(() => {
		const slug = page.params.slug;
		const apiSlug = slug ? apiSlugFor(slug) : null;
		const found = apiSlug ? sectionByApiSlug(sections, apiSlug) : undefined;
		if (!found) error(404, 'Stranica nije pronađena');
		return found;
	});

	const content = $derived(section.content);

	// Period header = year only (strip any month from the date, e.g. "ožujak 2015." → "2015.").
	const yearOf = (date: string) => date.match(/\d{4}\.?/)?.[0] ?? date;
</script>

<article class="identity-section">
	<h1 class="section-title">{section.title}</h1>

	{#if content.kind === 'single'}
		<!-- Grb: one image + body text (Values-like). -->
		{#if content.image}
			<img class="single-image" src={content.image.url} alt={content.image.alt} />
		{/if}
		<p class="single-body">{content.body}</p>
	{:else if content.kind === 'gallery'}
		<!-- Dres: vertical timeline of jersey versions (image + date + description). -->
		<div class="timeline">
			{#each content.items as item (item.date + item.image.url)}
				<div class="timeline-item">
					<img class="timeline-image" src={item.image.url} alt={item.image.alt} />
					<div class="timeline-text">
						<span class="timeline-date">{yearOf(item.date)}</span>
						<p class="timeline-desc">{item.description}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</article>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$shark: map.get(lib.$colors, 'shark'); // #232323 — body ink (≈ Barça #222)
	$blue: map.get(lib.$colors, 'blue-dress'); // #187ff5 — gradient light end
	$sp: lib.$base-padding;

	.identity-section {
		max-width: 668px;
		margin: 0 auto;
		padding-bottom: $sp * 4;
	}

	// Section title: same blue→navy gradient as the Vrijednosti page.
	.section-title {
		margin: 0 0 ($sp * 1.5);
		font-size: 2.25rem; // smaller content-card heading
		font-weight: 700;
		line-height: 1.25;
		padding-bottom: 0.1em;
		text-align: center;
		background-image: linear-gradient(90deg, $blue, var(--color-footer));
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		color: transparent;
	}

	// ── kind: single (Grb) ────────────────────────────────────────────────────
	.single-image {
		display: block;
		width: 90vw;
		max-width: 1110px;
		aspect-ratio: 1110 / 693.75;
		margin-left: 50%;
		transform: translateX(-50%);
		margin-top: $sp * 3; // more gap below the "Grb kluba" title
		margin-bottom: $sp * 3;
		object-fit: contain;
	}
	.single-body {
		margin: 0;
		font-size: 18px;
		line-height: 28px;
		color: $shark;
	}

	// ── kind: gallery (Dres) — vertical timeline ──────────────────────────────
	.timeline {
		display: flex;
		flex-direction: column;
		// no gap here — the divider provides equal spacing between items itself.
	}
	.timeline-item {
		display: flex;
		flex-direction: column;
		gap: $sp * 1.25;

		// short, centred #eee divider above each item except the first, with equal
		// space above and below so it sits midway between the two periods.
		& + .timeline-item::before {
			content: '';
			align-self: center;
			width: 7rem; // 2rem base + 5rem
			height: 2px; // a bit thicker
			background-color: #eee;
			margin: ($sp * 2.5) 0; // equal gap top + bottom
		}
	}
	.timeline-image {
		display: block;
		// break out a little wider than the 668px text column; centred.
		width: 760px;
		max-width: 90vw;
		margin-left: 50%;
		transform: translateX(-50%);
		object-fit: contain;
		border-radius: 8px;
	}
	.timeline-date {
		display: block;
		font-size: 1.5rem; // bigger period header
		font-weight: 700;
		color: $navy;
	}
	.timeline-desc {
		margin: ($sp * 0.4) 0 0;
		font-size: 18px;
		line-height: 28px;
		color: $shark;
	}

	// ── Phone ───────────────────────────────────────────────────────────────────
	@media (max-width: 720px) {
		// Smaller paragraph BODY text (Grb body + Dres descriptions), matching the
		// Vrijednosti page's .value-body. Titles + period headers unchanged.
		.single-body,
		.timeline-desc {
			font-size: 15px;
			line-height: 24px;
		}
	}
</style>
