<script lang="ts">
	// Single archer profile (/momcad/{slug}). Hero (profile photo + name + bow /
	// category badges + age), bio, career-stats table, performance results table,
	// coaches/students links and a World Archery link. The backend strips hidden
	// sections + minor ages, so each block simply renders if it has data.
	import type { ArcherProfile } from 'archery-contracts';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import SectionExplore from '$lib/components/SectionExplore.svelte';
	import Flourish from '$lib/components/Flourish.svelte';
	import { BOW_LABEL } from '$lib/archer';
	import { splitParagraphs } from '$lib/text';

	let { data } = $props();
	const a = $derived(data.archer as ArcherProfile);

	const bows = $derived(a.bowType.map((b) => BOW_LABEL[b]));
	const bioParas = $derived(a.bio ? splitParagraphs(a.bio) : []);
	const waUrl = $derived(
		a.worldArcheryId ? `https://worldarchery.sport/athletes/${a.worldArcheryId}` : null
	);

	// Performance scope/type → Croatian labels for the results table.
	const SCOPE_LABEL: Record<string, string> = { domestic: 'Domaće', global: 'Međunarodno' };
	const TYPE_LABEL: Record<string, string> = {
		outdoor: 'Vanjsko',
		indoor: 'Dvoransko',
		field: 'Terensko',
		'3d': '3D'
	};
</script>

<svelte:head>
	<title>{a.firstName} {a.lastName} | Momčad — VSK</title>
</svelte:head>

<div class="profile">
	<!-- ── Hero ──────────────────────────────────────────────────────────── -->
	<header class="pf-hero">
		<div class="pf-hero-media">
			{#if a.profilePhoto ?? a.cardPhoto}
				{@const photo = a.profilePhoto ?? a.cardPhoto}
				<ImageWithLoader src={photo!.url} alt={photo!.alt} fit="cover" loading="eager" />
			{:else}
				<div class="pf-fallback" aria-hidden="true"><PersonIcon size={120} /></div>
			{/if}
		</div>
		<div class="pf-hero-info">
			<a class="pf-back" href="/momcad">
				<ChevronIcon direction="left" size={16} /> Momčad
			</a>
			<h1 class="pf-name">{a.firstName} {a.lastName}</h1>
			<div class="pf-badges">
				{#each bows as b (b)}
					<span class="pf-badge pf-badge--bow">{b}</span>
				{/each}
				{#if a.roles.includes('coach')}
					<span class="pf-badge pf-badge--coach">Trener</span>
				{/if}
			</div>
			{#if a.competitionCategories.length}
				<p class="pf-cats">{a.competitionCategories.join(' · ')}</p>
			{/if}
			<ul class="pf-facts">
				{#if a.age !== null}
					<li><span class="pf-fact-label">Dob</span><span>{a.age}</span></li>
				{/if}
				{#if a.gender}
					<li>
						<span class="pf-fact-label">Spol</span>
						<span>{a.gender === 'male' ? 'M' : 'Ž'}</span>
					</li>
				{/if}
				{#if waUrl}
					<li>
						<span class="pf-fact-label">World Archery</span>
						<a href={waUrl} target="_blank" rel="noopener">Profil ↗</a>
					</li>
				{/if}
			</ul>
		</div>
	</header>

	<div class="pf-body">
		<!-- ── Bio ──────────────────────────────────────────────────────────── -->
		{#if bioParas.length}
			<section class="pf-section pf-bio">
				<h2 class="pf-section-title">Biografija</h2>
				{#each bioParas as p, i (i)}
					<p>{p}</p>
				{/each}
			</section>
		{/if}

		<!-- ── Career stats ─────────────────────────────────────────────────── -->
		{#if a.careerStats.length}
			<section class="pf-section">
				<h2 class="pf-section-title">Statistika po godinama</h2>
				<div class="pf-table-wrap">
					<table class="pf-table">
						<thead>
							<tr>
								<th>Godina</th>
								<th>Disciplina</th>
								<th>Prosjek</th>
								<th>Pobjede</th>
								<th>Porazi</th>
								<th>Najbolji</th>
							</tr>
						</thead>
						<tbody>
							{#each a.careerStats as s (s.year + s.discipline)}
								<tr>
									<td>{s.year}</td>
									<td>{TYPE_LABEL[s.discipline] ?? s.discipline}</td>
									<td>{s.averageScore ?? '—'}</td>
									<td>{s.wins}</td>
									<td>{s.losses}</td>
									<td>{s.highestScore ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}

		<!-- ── Performance / results ────────────────────────────────────────── -->
		{#if a.performance.length}
			<section class="pf-section">
				<h2 class="pf-section-title">Rezultati</h2>
				<div class="pf-table-wrap">
					<table class="pf-table">
						<thead>
							<tr>
								<th>Datum</th>
								<th>Natjecanje</th>
								<th>Vrsta</th>
								<th>Kategorije</th>
								<th>Plasman</th>
								<th>Bodovi</th>
							</tr>
						</thead>
						<tbody>
							{#each a.performance as p, i (i)}
								<tr>
									<td>{p.date}</td>
									<td class="pf-event">
										{p.name}
										<span class="pf-scope">{SCOPE_LABEL[p.scope] ?? p.scope}</span>
									</td>
									<td>{TYPE_LABEL[p.type] ?? p.type}{p.meters ? ` · ${p.meters}` : ''}</td>
									<td>{p.categories.join(', ')}</td>
									<td>{p.placing ?? '—'}</td>
									<td>{p.points ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}

		<!-- ── Coaches / students ───────────────────────────────────────────── -->
		{#if a.coaches.length || a.students.length}
			<section class="pf-section pf-people">
				{#if a.coaches.length}
					<div class="pf-people-group">
						<h2 class="pf-section-title">{a.coaches.length > 1 ? 'Treneri' : 'Trener'}</h2>
						<ul class="pf-people-list">
							{#each a.coaches as c (c.slug)}
								<li>
									<a href="/momcad/{c.slug}">{c.firstName} {c.lastName}</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
				{#if a.students.length}
					<div class="pf-people-group">
						<h2 class="pf-section-title">Štićenici</h2>
						<ul class="pf-people-list">
							{#each a.students as s (s.slug)}
								<li>
									<a href="/momcad/{s.slug}">{s.firstName} {s.lastName}</a>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</section>
		{/if}

		<div class="pf-flourish"><Flourish /></div>
	</div>

	<SectionExplore />
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire'); // #102E66
	$blue: map.get(lib.$colors, 'blue-dress'); // #187ff5
	$gold: map.get(lib.$colors, 'macaroni-and-cheese'); // #efb52f
	$white: map.get(lib.$colors, 'white');
	$grey: map.get(lib.$colors, 'heather');
	$sp: lib.$base-padding;
	$page-bg: var(--color-footer);

	.profile {
		width: 100%;
		background-color: $page-bg;
		color: $white;
	}

	// ── Hero: photo + info side by side ─────────────────────────────────────────
	.pf-hero {
		display: grid;
		grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
		gap: ($sp * 3);
		align-items: center;
		max-width: 1180px;
		margin: 0 auto;
		padding: ($sp * 4) ($sp * 2) ($sp * 3);
	}
	.pf-hero-media {
		position: relative;
		aspect-ratio: 4 / 5;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
	}
	.pf-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(160deg, $blue 0%, color.adjust($blue, $lightness: -16%) 100%);
		color: rgba(255, 255, 255, 0.85);
	}

	.pf-back {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-bottom: ($sp * 1);
		color: $grey;
		font-size: 0.85rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-decoration: none;
		&:hover {
			color: $gold;
		}
	}
	.pf-name {
		margin: 0 0 ($sp * 0.85);
		font-size: 2.8rem;
		font-weight: 800;
		line-height: 1.05;
	}
	.pf-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: ($sp * 0.85);
	}
	.pf-badge {
		padding: 0.3rem 0.85rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.02em;
	}
	.pf-badge--bow {
		background: color.change($gold, $alpha: 0.16);
		color: $gold;
		border: 1px solid color.change($gold, $alpha: 0.5);
	}
	.pf-badge--coach {
		background: color.change($blue, $alpha: 0.18);
		color: color.adjust($blue, $lightness: 18%);
		border: 1px solid color.change($blue, $alpha: 0.5);
	}
	.pf-cats {
		margin: 0 0 ($sp * 1.25);
		color: $grey;
		font-weight: 600;
		letter-spacing: 0.03em;
	}
	.pf-facts {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: ($sp * 2);
		li {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
		}
		a {
			color: $gold;
			text-decoration: none;
			font-weight: 600;
			&:hover {
				text-decoration: underline;
			}
		}
	}
	.pf-fact-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9fb0c8;
	}

	// ── Body ────────────────────────────────────────────────────────────────────
	.pf-body {
		width: 85%;
		max-width: 1180px;
		margin: 0 auto;
		padding: ($sp * 1) 0 ($sp * 3);
	}
	.pf-section {
		margin-bottom: ($sp * 3.5);
	}
	.pf-section-title {
		margin: 0 0 ($sp * 1.25);
		padding-bottom: ($sp * 0.5);
		font-size: 1.4rem;
		font-weight: 800;
		border-bottom: 2px solid color.change($gold, $alpha: 0.5);
	}
	.pf-bio p {
		margin: 0 0 ($sp);
		color: #d7e0ee;
		font-weight: 300;
		line-height: 1.75;
		&:last-child {
			margin-bottom: 0;
		}
	}

	// ── Tables ────────────────────────────────────────────────────────────────
	.pf-table-wrap {
		overflow-x: auto;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.03);
	}
	.pf-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
		th,
		td {
			padding: ($sp * 0.75) ($sp);
			text-align: left;
			white-space: nowrap;
		}
		thead th {
			color: $gold;
			font-weight: 700;
			text-transform: uppercase;
			font-size: 0.72rem;
			letter-spacing: 0.05em;
			border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		}
		tbody tr {
			border-bottom: 1px solid rgba(255, 255, 255, 0.06);
			&:last-child {
				border-bottom: none;
			}
			&:hover {
				background: rgba(255, 255, 255, 0.04);
			}
		}
		td {
			color: #d7e0ee;
			font-weight: 400;
		}
	}
	.pf-event {
		white-space: normal;
		min-width: 220px;
		font-weight: 500;
		color: $white;
	}
	.pf-scope {
		display: inline-block;
		margin-left: 0.5rem;
		padding: 0.1rem 0.5rem;
		border-radius: 6px;
		background: rgba(255, 255, 255, 0.07);
		color: $grey;
		font-size: 0.7rem;
		font-weight: 600;
	}

	// ── People (coaches / students) ─────────────────────────────────────────────
	.pf-people {
		display: flex;
		flex-wrap: wrap;
		gap: ($sp * 4);
	}
	.pf-people-group {
		min-width: 200px;
	}
	.pf-people-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		a {
			color: $white;
			text-decoration: none;
			font-weight: 600;
			&:hover {
				color: $gold;
			}
		}
	}

	.pf-flourish {
		margin: ($sp * 2) 0 ($sp * 1.5);
	}
	:global(.profile .explore) {
		width: 100%;
		margin: 0;
	}

	// ── Responsive ──────────────────────────────────────────────────────────────
	@media (max-width: 760px) {
		.pf-hero {
			grid-template-columns: 1fr;
			gap: ($sp * 1.5);
		}
		.pf-hero-media {
			max-width: 320px;
			margin: 0 auto;
		}
		.pf-name {
			font-size: 2.1rem;
		}
		.pf-body {
			width: 92%;
		}
	}
</style>
