<script lang="ts">
	// Single archer profile (/momcad/{slug}). Sections, top → bottom:
	//   1. COVER hero  — (currently the original side-by-side hero; being rebuilt).
	//   2. DETAILS + BIO — Real-Madrid style: personal details (left) | scrollable bio.
	//   3. ACHIEVEMENTS — RM honours grid: one count card per distinct title/record.
	//   4. STATS / RESULTS — a Momčad-tab switch toggling a fixed-height (scrollable) table.
	//   5. BOW DATA — interactive 3D bow model (left) + description (right), by bow type.
	//   6. COACHES / "TRENIRA" — coach cards + this coach's students (paged).
	//   7. RELATED ARTICLES — news mentioning this archer (topped up with newest).
	//
	// NOTE: the bow-description copy is still placeholder-ish (fact-based but generic);
	// everything else (achievements, coaches/students, news) is real backend data.
	import type { ArcherProfile, ArcherCard, ArticleCard } from 'archery-contracts';
	import ImageWithLoader from '$lib/components/ImageWithLoader.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import GlobeRecordIcon from '$lib/components/icons/GlobeRecordIcon.svelte';
	import EuropeRecordIcon from '$lib/components/icons/EuropeRecordIcon.svelte';
	import CroatiaRecordIcon from '$lib/components/icons/CroatiaRecordIcon.svelte';
	import VzRecordIcon from '$lib/components/icons/VzRecordIcon.svelte';
	import RosterCard from '$lib/components/RosterCard.svelte';
	import BowViewer from '$lib/components/bow/BowViewer.svelte';
	import NewsRoster from '$lib/components/NewsRoster.svelte';
	import { BOW_LABEL, ARCHER_CARD_SCALE, BOW_LEFT } from '$lib/archer';
	import { BOW_INFO, BOW_MODEL, BOW_CATEGORY_GENITIVE, type BowType } from '$lib/bow';
	import { splitParagraphs } from '$lib/text';
	import { reveal } from '$lib/actions/reveal';
	import { onMount } from 'svelte';

	let { data } = $props();

	// Gates the cover's echo slide-in. The page is now revealed by the global #1e1f1c
	// wipe panel (the universal loader), not a per-page loader — so we flip `revealed`
	// on mount (next tick) and the echo plays as the wipe slides off to show the page.
	let revealed = $state(false);
	onMount(() => {
		requestAnimationFrame(() => (revealed = true));
	});

	const a = $derived(data.archer as ArcherProfile);
	const roster = $derived((data.roster ?? []) as ArcherCard[]);
	const articles = $derived((data.articles ?? []) as ArticleCard[]);

	// ── Name split (Barça surname-behind). Surname = LAST word of lastName; earlier
	//    words are middle names shown on the row above (e.g. Nikola "Portner" / "Pavićević").
	const lastWords = $derived(a.lastName.trim().split(/\s+/));
	const surname = $derived(lastWords[lastWords.length - 1]);
	const middleWords = $derived(lastWords.slice(0, -1));
	// Bottom marquee scrolls the WHOLE surname (every last-name word, e.g. both
	// "Portner Pavićević"), not just the final word. One run of the words is the
	// repeating unit; we duplicate it enough times that the -50% loop always
	// overflows the viewport and never reveals a gap.
	const surnameMarquee = $derived(Array.from({ length: 4 }, () => lastWords).flat());
	// Per-archer cover-photo override (higher-res hero shots not yet in the backend). Keyed by
	// slug; falls back to the backend profile/card photo. Remove once seeded server-side.
	const COVER_PHOTO_OVERRIDE: Record<string, string> = {
		'amanda-mlinaric':
			'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/amanda-profile.png',
		'leo-sulik':
			'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/leo-profile.png'
	};
	const coverPhoto = $derived.by(() => {
		const override = COVER_PHOTO_OVERRIDE[a.slug];
		if (override) return { url: override, alt: `${a.firstName} ${a.lastName}` };
		return a.profilePhoto ?? a.cardPhoto;
	});

	// Marquee speed is normalised to a constant pixels-per-second so EVERY archer's name
	// drifts at the same visual pace regardless of how long the name is (a fixed duration
	// would make longer names — wider tracks — scroll faster). The action measures the
	// track's half-width (the -50% loop distance) and sets `--marq-secs` = halfWidth / speed.
	// First name drifts SLOWER than the surname (kept from the earlier tuning); each pace is a
	// constant px/sec so both archers match. `speed` = pixels travelled per second.
	function marqueeSpeed(node: HTMLElement, speed: number) {
		const apply = () => {
			const half = node.scrollWidth / 2;
			node.style.setProperty('--marq-secs', `${half / speed}s`);
		};
		apply();
		const ro = new ResizeObserver(apply);
		ro.observe(node);
		return {
			update(next: number) {
				speed = next;
				apply();
			},
			destroy: () => ro.disconnect()
		};
	}

	// ── Cover design per archer ─────────────────────────────────────────────────
	// Default = the navy→blue two-tone Barça cover. A few archers use the FILTER cover
	// (a tinted triptych: a green-ish region fades to B&W, split by a cut-out strip
	// where the un-filtered photo "breaks through" over a teal bg).
	//   orient A = wider LEFT band; orient B = wider RIGHT band.
	//   gap = width of the un-filtered cut-out strip (tuned per photo).
	//   imgShift = horizontal nudge of the photo (translateX); positive moves the figure
	//   right and may bleed off-screen. Defaults to 0 when omitted.
	//   imgRise = vertical nudge of the photo (translateY); negative raises the figure up.
	//   winVeil = opacity of the light veil over the cut-out window (0 = fully clear).
	//   imgFit = 'contain' shows the WHOLE photo (no crop), bottom-anchored; 'cover' fills + crops.
	//   imgScale = uniform zoom of the photo (1 = none); scaled from the bottom edge.
	//   cutLeft = left edge of the cut-out window (overrides the orient default).
	//   PHONE cover knobs (the photo stays `object-fit: cover`, full-bleed):
	//   phoneX = horizontal object-position % (lower = archer further RIGHT). Default 30%.
	//   phoneZoom = uniform zoom of the cover photo (1 = none; > 1 = bigger). Default 1.
	//   phoneTall = EXTRA vertical stretch on top of phoneZoom (1 = none; > 1 = taller).
	type Cover = { design: 'filter'; orient: 'A' | 'B'; gap: string; imgShift?: string; imgRise?: string; imgScale?: number; imgFit?: 'cover' | 'contain'; imgAnchor?: string; cutLeft?: string; winVeil?: number; bowLeft?: string; bowClip?: string; bowPng?: string; phoneX?: string; phoneZoom?: number; phoneTall?: number };
	// EVERY archer uses the filter cover now. This map holds only the PER-ARCHER overrides
	// (photo framing / orient / cut-out tuning); anyone not listed falls back to the generic
	// defaults below — whole photo shown (contain), bottom-anchored, orient A.
	const COVER_OVERRIDE: Record<string, Partial<Cover>> = {
		'amanda-mlinaric': { orient: 'A', gap: '10rem', imgAnchor: 'center bottom', imgShift: '2%', imgScale: 1.3, imgRise: '5%', cutLeft: '28%', winVeil: 0.28, bowLeft: '52%', phoneX: '9%', phoneZoom: 1.45 },
		'alen-remar': { orient: 'B', gap: '20rem', imgFit: 'cover', imgAnchor: 'center top', bowLeft: '60%' },
		'leo-sulik': { imgShift: '10%', imgScale: 1.55, imgRise: '26%', bowLeft: '44%' },
		'mia-medimurec': {
			imgShift: '-6%',
			imgScale: 1.6,
			imgRise: '48%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/mia-bow-help.png'
		},
		'zoran-velagic': { imgShift: '-12%' },
		'mila-vrbesic': { imgShift: '-20%', imgScale: 1.6, imgRise: '62%' },
		'mija-mance': { imgShift: '-22%', imgScale: 1.6, imgRise: '60%' },
		'aurelia-mlinaric': {
			imgShift: '-18%',
			imgScale: 2.15,
			imgRise: '86%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/aurelia-bow-help.png'
		},
		'ela-drozdek': {
			imgShift: '-12%',
			imgScale: 1.42,
			imgRise: '12%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/ela-bow-help.png'
		},
		'filip-bistricic': {
			imgShift: '-18%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/filip-bow-help.png'
		},
		'nicole-bratonja': { imgShift: '-18%', imgScale: 1.0 },
		'jakov-crnicki': {
			imgShift: '-18%',
			imgScale: 1.55,
			imgRise: '18%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/crnicki-bow-help.png'
		},
		'bojan-rodik': {
			imgShift: '-15%',
			imgScale: 1.6,
			imgRise: '30%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/bojan-bow-help.png'
		},
		'tomislav-mlinaric': { imgShift: '0%', imgRise: '6%' },
		'luka-ciglaric': {
			imgShift: '-12%',
			imgRise: '11%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/luka-bow-type.png'
		},
		'tena-mikolaj': { imgShift: '-13%' },
		'leda-crncec': {
			imgShift: '-14%',
			imgScale: 1.5,
			imgRise: '54%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/leda-bow-type.png'
		},
		'karmen-ahmetovic': { imgShift: '-12%' },
		'nikola-portner-pavicevic': {
			imgShift: '-4%',
			imgScale: 1.25,
			imgRise: '0%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/nikola-bow-help.png'
		},
		'rafael-barulek': {
			imgShift: '-18%',
			imgScale: 1.25,
			imgRise: '12%',
			bowPng:
				'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/roster-bigger-photos/rafael-bow-type.png'
		},
		'cvijetoslav-zorman': { imgShift: '-1.5%' }
	};
	// Generic defaults: the whole photo shows (contain), sitting flush to the cover's base.
	const COVER_DEFAULT: Cover = {
		design: 'filter',
		orient: 'A',
		gap: '14rem',
		imgFit: 'contain',
		imgAnchor: 'center bottom'
	};
	const cover = $derived<Cover>({ ...COVER_DEFAULT, ...(COVER_OVERRIDE[a.slug] ?? {}) });

	const bows = $derived(a.bowType.map((b) => BOW_LABEL[b]));
	const bioParas = $derived(a.bio ? splitParagraphs(a.bio) : []);
	const waUrl = $derived(
		a.worldArcheryId ? `https://worldarchery.sport/athletes/${a.worldArcheryId}` : null
	);

	// NOTE: birthDate/birthplace are admin/privacy-only (used server-side to derive age
	// and to hide sections / withhold photos for minors) — they are intentionally NOT
	// shown on the public profile, so there's no birthplace row here.

	// ── Stats / Results switch (styled like the Momčad "Svi / Klasični luk" tabs) ──
	type Tab = 'stats' | 'results';
	let activeTab = $state<Tab>('stats');

	// Sliding tab underline: measure the active button and drive the indicator's
	// left/width (so it GLIDES between tabs instead of each tab fading its own line).
	let tabsEl = $state<HTMLElement>();
	let ulLeft = $state(0);
	let ulWidth = $state(0);
	$effect(() => {
		void activeTab; // re-measure when the active tab changes
		const el = tabsEl?.querySelector<HTMLElement>('.pf-tab.active');
		if (!el || !tabsEl) return;
		ulLeft = el.offsetLeft;
		ulWidth = el.offsetWidth;
	});

	const SCOPE_LABEL: Record<string, string> = { domestic: 'Domaće', global: 'Međunarodno' };
	const TYPE_LABEL: Record<string, string> = {
		outdoor: 'Vanjsko', indoor: 'Dvoransko', field: 'Terensko', '3d': '3D'
	};

	// Sparkle layer for the achievement cards: a handful of gold 4-point stars that
	// pop in, twinkle, and fade at varied spots/sizes/timings (staggered delays) so
	// each card glitters continuously. Positions/sizes are fixed (no randomness API).
	const SPARKLES = [
		{ top: '14%', left: '20%', size: 16, delay: 0, dur: 2.6 },
		{ top: '60%', left: '74%', size: 22, delay: 0.7, dur: 3.1 },
		{ top: '32%', left: '88%', size: 13, delay: 1.4, dur: 2.4 },
		{ top: '78%', left: '14%', size: 18, delay: 2.0, dur: 2.9 },
		{ top: '46%', left: '46%', size: 12, delay: 1.1, dur: 2.7 },
		{ top: '22%', left: '62%', size: 15, delay: 2.6, dur: 3.0 }
	];

	// ── Achievements (honour cards) ───────────────────────────────────────────────
	// Real per-archer honours from the profile API, grouped by title+level+medal with
	// a count. Empty for archers (e.g. coaches) with none → the section is hidden.
	const honours = $derived(a.achievements ?? []);

	// ── Bow data (5th div) — the bow renders as a live 3D model via BowViewer; the model
	//    description body lives in $lib/bow.ts (shared with the homepage). Only the INTRO
	//    sentence is per-archer here.
	const primaryBow = $derived((a.bowType[0] ?? 'recurve') as BowType);
	const secondBow = $derived((a.bowType[1] ?? null) as BowType | null);
	const bowInfo = $derived(BOW_INFO[primaryBow] ?? BOW_INFO.recurve);
	const bowModel = $derived(BOW_MODEL[primaryBow] ?? BOW_MODEL.recurve);

	// Per-archer intro sentence prepended to the shared model description.
	//  - 1 bow type:  "<Ime Prezime> puca sa <model> lukom."
	//  - 2 bow types: "<Ime Prezime> primarno puca sa <model> modelom <primary type, gen.>,
	//                   te također puca u kategoriji <other type, gen.>."
	//  - a coach with no current bow (e.g. Zorman) shot in the PAST → past tense.
	const fullName = $derived(`${a.firstName} ${a.lastName}`);
	const bowIntro = $derived(
		a.roles.includes('coach') && a.bowType.length === 0
			? `${a.lastName} je tijekom svoje streličarske karijere pucao iz ${BOW_CATEGORY_GENITIVE[primaryBow]}.`
			: secondBow
				? `${fullName} primarno puca sa ${bowInfo.model} modelom ${BOW_CATEGORY_GENITIVE[primaryBow]}, te također puca u kategoriji ${BOW_CATEGORY_GENITIVE[secondBow]}.`
				: `${fullName} puca sa ${bowInfo.model} lukom.`
	);

	// ── Coaches / students (from the profile contract) ────────────────────────────
	// `a.coaches` / `a.students` are lightweight refs (slug + name); resolve each to
	// its full roster ArcherCard so they render in the SAME card component as Suigrači
	// (photo + name + categories). Refs with no roster match are dropped.
	const rosterBySlug = $derived(new Map(roster.map((r) => [r.slug, r])));
	const coachCards = $derived(
		(a.coaches ?? []).map((c) => rosterBySlug.get(c.slug)).filter((c): c is ArcherCard => !!c)
	);
	const studentCards = $derived(
		(a.students ?? []).map((s) => rosterBySlug.get(s.slug)).filter((s): s is ArcherCard => !!s)
	);
	const isCoach = $derived(a.roles.includes('coach'));

	// Role rows in "Osobni podaci". roles[0] = PRIMARY (coach-first ordering in the
	// seed means a coach-primary person lists 'coach' first). We show the PRIMARY role
	// as "Primarna uloga" and any SECOND role as "Dodatne uloge". For an archer-primary
	// person who also coaches, the only extra role is Trener (no "primarna" row, since
	// being an archer is implicit from the rest of the profile).
	const ROLE_LABEL: Record<string, string> = { coach: 'Trener', archer: 'Streličar' };
	const primaryRole = $derived(a.roles[0] ?? 'archer');
	const secondaryRoles = $derived(a.roles.slice(1));
	// Show a "Primarna uloga" row only when the primary role is coach (archer-primary
	// is implicit). Show "Dodatne uloge" for every non-primary role.
	const showPrimaryRole = $derived(primaryRole === 'coach');
	const extraRoles = $derived(
		showPrimaryRole ? secondaryRoles : a.roles.filter((r) => r !== 'archer')
	);

	// Croatian: gendered participle (female → "Trenirana", else "Treniran") + one
	// coach → "trenerom", more than one → "trenerima".
	const coachesTitle = $derived(
		`${a.gender === 'female' ? 'Trenirana' : 'Treniran'} pod ovim ${
			coachCards.length === 1 ? 'trenerom' : 'trenerima'
		}`
	);

	// "Trenira" row pages 4 cards at a time; an arrow scrolls to the next page.
	let traineePage = $state(0);
	const TRAINEES_PER_PAGE = 4;
	const traineePageCount = $derived(Math.ceil(studentCards.length / TRAINEES_PER_PAGE));
	const hasMoreTrainees = $derived(studentCards.length > TRAINEES_PER_PAGE);
</script>

<svelte:head>
	<title>{a.firstName} {a.lastName} | Momčad — VSK</title>
</svelte:head>


<div class="profile">
	{#if cover?.design === 'filter'}
		<!-- ── 1b. FILTER cover (Amanda / Alen): triptych. The photo fills the band three
		     times; a cut-out strip shows it un-filtered over teal, flanked by the left
		     and right bands. (Filters added in later sub-steps.) ───────────────────── -->
		<header
			class="pf-fcover"
			data-orient={cover.orient}
			data-revealed={revealed}
			style="--gap:{cover.gap}; --img-shift:{cover.imgShift ?? '0'}; --img-rise:{cover.imgRise ?? '0'}; --img-scale:{cover.imgScale ?? 1}; --img-fit:{cover.imgFit ?? 'cover'}; --img-anchor:{cover.imgAnchor ?? 'center top'}; {cover.cutLeft ? `--cut-left:${cover.cutLeft};` : ''} --win-veil:{cover.winVeil ?? 0.28}; --phone-cover-x:{cover.phoneX ?? '30%'}; --phone-cover-zoom:{cover.phoneZoom ?? 1}; --phone-cover-tall:{cover.phoneTall ?? 1}"
		>
			{#if coverPhoto}
				<!-- Photo behind everything; a grey veil dims it; then a clear copy of the
				     photo clipped to the cut-out strip shows un-veiled (the window). -->
				<div class="pf-fstage">
				<!-- TEST: red "shadow" echo — a fully-red copy of the photo offset behind the
				     main one, so a red ghost bleeds out from one side. -->
				<img class="pf-fphoto pf-fphoto--echo" src={coverPhoto.url} alt="" aria-hidden="true" />
				<img class="pf-fphoto" src={coverPhoto.url} alt={coverPhoto.alt} />
				<div class="pf-fveil"></div>
				<!-- CUT-OUT (window): a clear copy of the photo clipped to the strip, over its
				     own light veil — shows the photo un-dimmed inside the window. -->
				<img class="pf-fphoto pf-fphoto--window" src={coverPhoto.url} alt="" aria-hidden="true" />
				<div class="pf-fwindow-veil"></div>
				</div>
			{:else}
				<div class="pf-fallback" aria-hidden="true"><PersonIcon size={160} /></div>
			{/if}

			<!-- First name = giant navy watermark that MARQUEES leftward forever; surname
			     marquees the opposite way. Each track holds the text twice so the loop is
			     seamless (one copy scrolls in as the other scrolls out). -->
			<div class="pf-firstname pf-marquee" aria-hidden="true">
				<div class="pf-marquee-track pf-marquee-track--left" use:marqueeSpeed={50}>
					<span class="pf-marquee-item">{a.firstName}</span>
					<span class="pf-marquee-item">{a.firstName}</span>
					<span class="pf-marquee-item">{a.firstName}</span>
					<span class="pf-marquee-item">{a.firstName}</span>
				</div>
			</div>
			<!-- Bottom fade: a tall gradient strip (transparent → the sheet bg below) layered over
			     the photo + bands so the cover blends SEAMLESSLY into the next section with no hard
			     edge. Sits above the photo but below the surname so the name stays crisp. -->
			<div class="pf-fbottom-fade" aria-hidden="true"></div>

			<div class="pf-surname pf-marquee" aria-hidden="true">
				<!-- Scrolls every surname word (4 runs of the name so the -50% loop always
				     overflows the viewport and never reveals a gap). -->
				<div class="pf-marquee-track pf-marquee-track--right" use:marqueeSpeed={110}>
					{#each surnameMarquee as w, i (i)}
						<span class="pf-marquee-item pf-surname-last">{w}</span>
					{/each}
				</div>
			</div>

			<!-- BOW OVERLAY: a duplicate of the photo painted ON TOP of the surname, clipped to the
			     right-side strip where the bow is (left edge = --bow-left). This makes the surname
			     text pass BEHIND the bow while still running above the person. Carries the same
			     transform vars as the stage so the bow lines up exactly with the photo beneath. Only
			     rendered for archers with a tuned `bowLeft`. -->
			{#if cover.bowPng}
				<!-- Cleanest path: a transparent-background cut-out of JUST the bow. No clip (none) —
				     it's already bow-only. Shares the stage transform so it overlays the photo exactly. -->
				<div class="pf-fbow" style="--bow-clip:none;">
					<img class="pf-fphoto pf-fbow-img" src={cover.bowPng} alt="" aria-hidden="true" />
				</div>
			{:else if coverPhoto && (cover.bowClip || cover.bowLeft)}
				<div
					class="pf-fbow"
					style="--bow-clip:{cover.bowClip ?? `inset(0 0 0 ${cover.bowLeft})`};"
				>
					<img class="pf-fphoto pf-fbow-img" src={coverPhoto.url} alt="" aria-hidden="true" />
				</div>
			{/if}
		</header>
	{:else}
		<!-- ── 1a. COVER hero (Barça-style): two-tone band + photo + surname behind ─── -->
		<header class="pf-cover" data-bow={primaryBow}>
			<div class="pf-surname" aria-hidden="true">
				{#each middleWords as w (w)}
					<span class="pf-surname-mid">{w}</span>
				{/each}
				<span class="pf-surname-last">{surname}</span>
			</div>

			<div class="pf-cover-photo">
				{#if coverPhoto}
					<ImageWithLoader src={coverPhoto.url} alt={coverPhoto.alt} fit="contain" loading="eager" />
				{:else}
					<div class="pf-fallback" aria-hidden="true"><PersonIcon size={160} /></div>
				{/if}
			</div>

			<p class="pf-firstname">{a.firstName}</p>
		</header>
	{/if}

	<!-- Everything below the cover sits on the page bg. -->
	<div class="pf-sheet">
		<!-- ── 2. DETAILS (left) + BIO (right) ──────────────────────────────────── -->
		<section class="pf-block pf-intro">
			<div class="pf-details" use:reveal>
				<h2 class="pf-block-title">Osobni podaci</h2>
				<dl class="pf-detail-list">
					<div class="pf-detail">
						<dt>Ime</dt>
						<dd>{a.firstName} {a.lastName}</dd>
					</div>
					{#if a.age !== null}
						<div class="pf-detail">
							<dt>Dob</dt>
							<dd>{a.age} godina</dd>
						</div>
					{/if}
					{#if a.gender}
						<div class="pf-detail">
							<dt>Spol</dt>
							<dd>{a.gender === 'male' ? 'Muški' : 'Ženski'}</dd>
						</div>
					{/if}
					{#if a.competitionCategories.length}
						<div class="pf-detail">
							<dt>Kategorija</dt>
							<dd>{a.competitionCategories.join(' · ')}</dd>
						</div>
					{/if}
					{#if bows.length}
						<div class="pf-detail">
							<dt>Vrsta luka</dt>
							<dd>{bows.join(', ')}</dd>
						</div>
					{/if}
					{#if showPrimaryRole}
						<div class="pf-detail">
							<dt>Primarna uloga</dt>
							<dd>{ROLE_LABEL[primaryRole]}</dd>
						</div>
					{/if}
					{#if extraRoles.length}
						<div class="pf-detail">
							<dt>Dodatne uloge</dt>
							<dd>{extraRoles.map((r) => ROLE_LABEL[r]).join(' · ')}</dd>
						</div>
					{/if}
				</dl>

				{#if waUrl}
					<a class="pf-wa" href={waUrl} target="_blank" rel="noopener">
						World Archery profil ↗
					</a>
				{/if}
			</div>

			{#if bioParas.length}
				<div class="pf-bio" use:reveal={{ delay: 100 }}>
					<h2 class="pf-block-title">Biografija</h2>
					<div class="pf-bio-scroll">
						{#each bioParas as p, i (i)}
							<p>{p}</p>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<!-- ── 3. ACHIEVEMENTS (honour cards) ───────────────────────────────────── -->
		{#if honours.length}
			<section class="pf-block" use:reveal>
				<h2 class="pf-block-title">Postignuća</h2>
				<div class="pf-honours-block">
					<ul class="pf-honours">
					{#each honours as h, hi (h.title + '|' + h.level + '|' + h.medal)}
						<li class="pf-honour" data-level={h.level} use:reveal={{ delay: hi * 80 }}>
							<!-- Gold glitter: stars that pop/twinkle/fade across the card. -->
							<div class="pf-sparkles" aria-hidden="true">
								{#each SPARKLES as s, si (si)}
									<span
										class="pf-sparkle"
										style="top:{s.top}; left:{s.left}; --sz:{s.size}px; --delay:{s.delay}s; --dur:{s.dur}s;"
									></span>
								{/each}
							</div>
							<div class="pf-honour-top">
								<span class="pf-honour-count">{h.count}</span>
								<span class="pf-honour-icon" data-medal={h.medal} data-level={h.level}>
									{#if h.level === 'world' || h.level === 'other'}
										<!-- 'other' = international events not tied to a continent (e.g. The
										     Vegas Shoot, Conquest Cup in Istanbul) → globe, NOT the Croatian
										     icon. They're kept out of the EU/world title COUNTS (level !==
										     'world'), but visually they're global, so the globe represents them. -->
										<GlobeRecordIcon size={108} />
									{:else if h.level === 'european'}
										<EuropeRecordIcon size={90} />
									{:else if h.level === 'varazdin'}
										<VzRecordIcon size={90} />
									{:else}
										<CroatiaRecordIcon size={90} />
									{/if}
								</span>
							</div>
							<p class="pf-honour-name">{h.title}</p>
						</li>
					{/each}
					</ul>
				</div>
			</section>
		{/if}

		<!-- ── 4. STATS / RESULTS (tabbed, fixed-height scrollable table) ────────── -->
		{#if a.careerStats.length || a.performance.length}
			<section class="pf-block" use:reveal>
				<nav
					class="pf-tabs"
					data-active={activeTab}
					bind:this={tabsEl}
					aria-label="Statistika ili rezultati"
				>
					<button
						class="pf-tab"
						class:active={activeTab === 'stats'}
						type="button"
						onclick={() => (activeTab = 'stats')}
					>
						Statistika po godinama
					</button>
					<button
						class="pf-tab"
						class:active={activeTab === 'results'}
						type="button"
						onclick={() => (activeTab = 'results')}
					>
						Rezultati
					</button>
					<!-- Single underline that SLIDES between the two tabs (instead of each
					     tab growing/fading its own). Its left/width track the active tab. -->
					<span
						class="pf-tab-underline"
						style="--ul-left:{ulLeft}px; --ul-width:{ulWidth}px;"
						aria-hidden="true"
					></span>
				</nav>

				<div class="pf-table-scroll">
					{#if activeTab === 'stats'}
						<table class="pf-table">
							<thead>
								<tr>
									<th>Godina</th><th>Disciplina</th><th>Prosjek</th>
									<th>Pobjede</th><th>Porazi</th><th>Najbolji</th>
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
					{:else}
						<table class="pf-table">
							<thead>
								<tr>
									<th>Datum</th><th>Natjecanje</th><th>Vrsta</th>
									<th>Kategorije</th><th>Plasman</th><th>Bodovi</th>
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
					{/if}
				</div>
			</section>
		{/if}

		<!-- ── 5. BOW DATA (title above; interactive 3D model left, text right) ── -->
		<section class="pf-block" use:reveal>
			<h2 class="pf-block-title">Luk ovog streličara</h2>
			<div class="pf-bow">
				<div class="pf-bow-media">
					<BowViewer
						url={bowModel.url}
						alt={bowInfo.title}
						fixRotation={bowModel.fixRotation}
						yOffset={bowModel.yOffset}
						spinDir={bowModel.spinDir}
					/>
				</div>
				<div class="pf-bow-text">
					<p>{bowIntro} {bowInfo.body}</p>
					<!-- Required model-licence attribution (CC). -->
					<p class="pf-bow-credit">
						3D model: <a href={bowModel.credit.url} target="_blank" rel="noopener"
							>{bowInfo.title} by {bowModel.credit.author}</a
						>
						({bowModel.credit.license})
					</p>
				</div>
			</div>
		</section>

		<!-- ── 6a. COACHES (who trains this archer) ─────────────────────────────── -->
		{#if coachCards.length}
			<section class="pf-block" use:reveal>
				<h2 class="pf-block-title">{coachesTitle}</h2>
				<ul class="pf-related-grid pf-roster-grid">
					{#each coachCards as c, i (c.slug)}
						<li
							class:alt={i % 2 === 1}
							style="--fig-scale:{ARCHER_CARD_SCALE[c.slug] ?? 1.4};"
						>
							<RosterCard archer={c} tall={true} bowLeft={BOW_LEFT.has(c.slug)} />
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<!-- ── 6b. STUDENTS (only for coaches) — "Trenira", paged 4-across ───────── -->
		{#if isCoach && studentCards.length}
			<section class="pf-block" use:reveal>
				<div class="pf-row-head">
					<h2 class="pf-block-title">Trenira</h2>
					{#if hasMoreTrainees}
						<div class="pf-row-pager">
							<button
								class="pf-pager-btn"
								type="button"
								aria-label="Prethodni"
								disabled={traineePage === 0}
								onclick={() => (traineePage = Math.max(0, traineePage - 1))}
							>
								<ChevronIcon direction="left" size={28} />
							</button>
							<button
								class="pf-pager-btn"
								type="button"
								aria-label="Sljedeći"
								disabled={traineePage >= traineePageCount - 1}
								onclick={() => (traineePage = Math.min(traineePageCount - 1, traineePage + 1))}
							>
								<ChevronIcon direction="right" size={28} />
							</button>
						</div>
					{/if}
				</div>
				<div class="pf-row-viewport">
					<ul class="pf-row-track pf-roster-grid" style="--page:{traineePage}">
						{#each studentCards as s, i (s.slug)}
							<li
								class="pf-row-cell"
								class:alt={i % 2 === 1}
								style="--fig-scale:{ARCHER_CARD_SCALE[s.slug] ?? 1.4};"
							>
								<RosterCard archer={s} tall={true} bowLeft={BOW_LEFT.has(s.slug)} />
							</li>
						{/each}
					</ul>
				</div>
			</section>
		{/if}

	</div>

	<!-- ── 7. RELATED ARTICLES ──────────────────────────────────────────────────── -->
	{#if articles.length}
		<div class="pf-news" use:reveal>
			<NewsRoster {articles} />
		</div>
	{/if}
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire'); // #102E66
	$blue: map.get(lib.$colors, 'blue-dress'); // #187ff5
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');
	$grey: map.get(lib.$colors, 'heather');
	$sp: lib.$base-padding;
	$sheet-bg: var(--color-footer);

	.profile {
		width: 100%;
		background-color: $sheet-bg;
		color: $white;
	}

	// Extra white space above the "Najnovije vijesti" title (padding inside the white
	// news block, via :global since NewsRoster is a child component).
	.pf-news :global(.news-roster) {
		padding-top: ($sp * 5);
	}

	// ══ 1. COVER hero (Barça-style) ═════════════════════════════════════════════
	// Full-height two-tone band (navy left → lighter blue right, mixing just left of
	// centre), the surname set large behind the photo, photo anchored bottom-right.
	.pf-cover {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		background: linear-gradient(100deg, $navy 0%, $navy 38%, $blue 78%, $blue 100%);
		// Fade the bottom edge into the sheet bg so the sections below blend in.
		&::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 22%;
			background: linear-gradient(to bottom, transparent 0%, $sheet-bg 100%);
			pointer-events: none;
		}
	}
	// Surname behind the photo — very large, hugs the bottom, with a soft top→bottom FADE
	// (brighter at the top of the letters, fading toward the baseline) so it reads as a
	// faint embossed word emerging from the dark, matching the cover's mood.
	.pf-surname {
		position: absolute;
		left: clamp(1rem, 5vw, 6rem);
		right: clamp(1rem, 5vw, 6rem);
		bottom: clamp(1rem, 4vh, 4rem);
		z-index: 1;
		display: flex;
		flex-direction: column;
		text-transform: uppercase;
		font-weight: 800;
		line-height: 0.9;
		letter-spacing: -0.02em;
		pointer-events: none;
		// Gradient text fill: brighter near the top, fading downward.
		background: linear-gradient(
			to bottom,
			rgba(255, 255, 255, 0.22) 0%,
			rgba(255, 255, 255, 0.08) 100%
		);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.pf-surname-mid {
		font-size: clamp(2.5rem, 9vw, 8rem);
	}
	.pf-surname-last {
		font-size: clamp(4rem, 18vw, 17rem);
	}
	// Archer cut-out photo on the right half, anchored to the bottom (full-bleed tall).
	.pf-cover-photo {
		position: absolute;
		right: clamp(0rem, 4vw, 6rem);
		bottom: 0;
		top: 8%;
		width: min(55%, 760px);
		z-index: 2;
		:global(.img-loader),
		:global(.img-loader-fallback) {
			background: transparent;
		}
		:global(.img-loader) {
			position: absolute;
			inset: 0;
		}
		:global(.img-loader img) {
			object-position: center bottom;
		}
	}
	.pf-fallback {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		color: rgba(255, 255, 255, 0.5);
	}
	// First name — small, above the big surname, bottom-left.
	.pf-firstname {
		position: absolute;
		left: clamp(1rem, 5vw, 6rem);
		bottom: calc(clamp(1rem, 4vh, 4rem) + clamp(4rem, 18vw, 17rem) * 0.9);
		z-index: 3;
		margin: 0 0 0.5rem;
		font-size: clamp(1.5rem, 3.5vw, 3rem);
		font-weight: 600;
		color: rgba(255, 255, 255, 0.92);
	}

	// ══ 1b. FILTER cover (Amanda / Alen) ════════════════════════════════════════
	// The PHOTO sits behind everything (full colour). A grey/teal VEIL overlays the
	// whole cover EXCEPT a vertical cut-out strip — so the photo is dimmed/greyed under
	// the veil on the sides and shows clear through the cut-out window. Orient A puts the
	// (wider) veil area on the left; B mirrors it. --gap = cut-out width.
	$teal: #2596be;
	// Cover backdrop fade: blue A (top) → blue B (bottom of the cover). Locked colour
	// scheme — fun-blue easing down into deep-sapphire.
	$blue-a: map.get(lib.$colors, 'fun-blue'); // #2352A7
	$blue-b: map.get(lib.$colors, 'deep-sapphire'); // #102E66
	$backdrop: $blue-a; // base behind the name-fade (its lower stop) — kept = blue A
	$veil: #131919; // cover color multiplied OVER the photo (currently off)
	.pf-fcover {
		position: relative;
		min-height: 100vh;
		overflow: hidden;
		// Vertical fade from blue A (top) → blue B (bottom), spread across the FULL height with a
		// brief hold at each end so the transition is gradual rather than a tight band.
		background: linear-gradient(to bottom, $blue-a 0%, $blue-a 18%, $blue-b 92%, $blue-b 100%);
		// Cut-out window sits at this left edge; width = --gap.
		--cut-left: 38%; // A
		&[data-orient='B'] {
			--cut-left: calc(37% - var(--gap)); // B — window shifted further left
		}
	}
	// Bottom fade — a tall strip pinned to the cover's base that ramps from fully transparent
	// up top to the sheet bg (#081530) at the bottom, so the photo + bands dissolve into the
	// section below with NO hard seam. Multiple eased rgba stops (not a single linear) avoid a
	// visible band at the fade's top edge; 42vh gives it room for a soft, gradual blend.
	.pf-fbottom-fade {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 42vh;
		z-index: 1; // above the photo stage (z 1) at its base; below the surname (z 2)
		pointer-events: none;
		background: linear-gradient(
			to bottom,
			rgba(8, 21, 48, 0) 0%,
			rgba(8, 21, 48, 0.12) 28%,
			rgba(8, 21, 48, 0.4) 55%,
			rgba(8, 21, 48, 0.72) 76%,
			rgba(8, 21, 48, 0.92) 90%,
			#081530 100%
		);
	}
	// STAGE: holds the photo + every overlay and carries the per-archer transform (shift /
	// rise / scale). Because the transform is on the WRAPPER, all children share ONE coordinate
	// space, so the window clip, veil, band filters and markers stay pixel-aligned — at every
	// screen size (the % geometry resolves against this one box, then moves as a unit).
	.pf-fstage {
		position: absolute;
		inset: 0;
		z-index: 1; // ABOVE the giant first-name watermark (which sits behind the photo)
		transform: translate(var(--img-shift, 0), var(--img-rise, 0)) scale(var(--img-scale, 1));
		transform-origin: center bottom;
	}
	// BOW OVERLAY wrapper: a SECOND copy of the photo painted above the surname (z 3), clipped to
	// the right strip (from --bow-left to the right edge) where the bow lives — so the surname
	// text ducks BEHIND the bow but still runs over the person. It mirrors the stage's transform
	// exactly (same vars + origin) so the duplicated photo lands pixel-on-pixel over the original.
	.pf-fbow {
		position: absolute;
		inset: 0;
		z-index: 3; // above the surname (z 2)
		pointer-events: none;
		transform: translate(var(--img-shift, 0), var(--img-rise, 0)) scale(var(--img-scale, 1));
		transform-origin: center bottom;
		// Reveal only the bow. --bow-clip is set per-archer in the markup: `none` for a bow-only
		// cut-out PNG, a polygon to trace the bow, or an inset() strip as the simple fallback.
		clip-path: var(--bow-clip, none);
	}
	.pf-fbow-img {
		// Inherits .pf-fphoto (absolute inset 0, object-fit/position from the shared vars), so this
		// copy frames identically to the main photo beneath it.
		filter: none;
	}
	// ── Filter cover name treatment (Barça-style, animated) ────────────────────────
	// First name = a GIANT italic navy watermark that marquees leftward forever BEHIND the
	// photo; the surname marquees the OPPOSITE way along the bottom. Each `.pf-marquee` is a
	// full-width clipping window; its `.pf-marquee-track` holds the text TWICE and slides by
	// exactly one copy width, so the loop is seamless.
	.pf-marquee {
		position: absolute;
		left: 0;
		right: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.pf-marquee-track {
		display: flex;
		width: max-content;
		white-space: nowrap;
		font-style: italic; // tilted
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1;
		text-transform: uppercase;
		will-change: transform;
	}
	.pf-marquee-item {
		display: block;
		padding-right: 0.25em; // gap between the looping copies
	}
	@media (prefers-reduced-motion: reduce) {
		.pf-marquee-track {
			animation: none !important;
		}
	}

	// First-name marquee: giant navy watermark at the TOP, behind the photo, drifting LEFT.
	.pf-fcover .pf-firstname.pf-marquee {
		// -1rem gap relative to the fixed topbar (~64px) — the name tucks UP behind the bar.
		// The giant font (28vw) has huge internal leading above the cap-height, so the box
		// top sits ~6vw above the visible caps; subtract that.
		top: calc(64px - 1rem - 6vw);
		height: 60vh; // tall enough to hold the towering glyphs (overflow clips the bleed)
		z-index: 0; // BEHIND the stage/photo
		.pf-marquee-track {
			font-size: 28vw; // huge — letters tower across the cover
			// Duration is set per-track by the marqueeSpeed action (--marq-secs) so the px/sec is
			// constant for every archer; fallback 60s before the action measures.
			animation: pf-marquee-left var(--marq-secs, 60s) linear infinite;
		}
		.pf-marquee-item {
			// Stretch the glyphs TALLER so they reach lower without getting wider.
			transform: scaleY(1.35);
			transform-origin: top center;
			// Spotlight fade lives on the ITEM (it holds the actual glyphs): a bright navy crest
			// at the top fading to FULLY TRANSPARENT lower down, so the bottoms of the letters
			// genuinely dissolve into the backdrop (clip-to-text reveals the bg through them).
			background: linear-gradient(
				to bottom,
				#{color.adjust($navy, $lightness: 18%)} 0%,
				#{$navy} 35%,
				rgba(16, 46, 102, 0) 75%
			);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
		}
	}
	// Surname marquee: along the BOTTOM, above the photo, drifting RIGHT (opposite direction).
	.pf-fcover .pf-surname.pf-marquee {
		left: 0;
		right: 0;
		bottom: clamp(1rem, 4vh, 4rem);
		height: clamp(4rem, 18vw, 17rem); // matches the glyph size so overflow doesn't clip them
		z-index: 2; // above the photo
		.pf-marquee-track {
			font-size: clamp(4rem, 18vw, 17rem);
			// Per-track duration from the marqueeSpeed action (constant px/sec across archers);
			// fallback 26s before measurement.
			animation: pf-marquee-right var(--marq-secs, 26s) linear infinite;
		}
		.pf-marquee-item {
			// Wider gap between the repeating surname copies (overrides the global 0.25em). The
			// marqueeSpeed action re-measures scrollWidth, so the seamless loop + pace stay correct.
			padding-right: 0.6em;
			background: linear-gradient(
				to bottom,
				rgba(255, 255, 255, 0.22) 0%,
				rgba(255, 255, 255, 0.08) 100%
			);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
		}
	}
	// Leftward loop: start at 0, slide left by exactly one copy (-50% of the doubled track).
	@keyframes pf-marquee-left {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}
	// Rightward loop: start shifted left by one copy, slide back to 0 (so it drifts rightward).
	@keyframes pf-marquee-right {
		from {
			transform: translateX(-50%);
		}
		to {
			transform: translateX(0);
		}
	}
	// Photo behind everything, full cover. The BACK copy is BLACK & WHITE (the veil dims
	// it further); the window copy (below) restores full colour inside the cut-out.
	.pf-fphoto {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: var(--img-fit, cover); // `contain` shows the WHOLE photo (no crop); `cover` fills + crops
		object-position: var(--img-anchor, center top); // bottom-anchor so a contained photo sits flush to the cover's base
		// Cover grade toward #131919 (very dark desaturated cool-teal): grayscale + dim, then a
		// faint sepia→hue-rotate→saturate pushes the grey to that cool tone. Lives in the photo's
		// OWN filter (not a veil) so it's the cover on the PHOTO, not a backdrop tint.
		filter: none; // TEST: cover grade off — show the original photo untouched
		// filter: grayscale(1) brightness(0.18) contrast(1.08) sepia(0.4) hue-rotate(150deg)
		// 	saturate(0.6);
	}
	// Veil overlay tinting the B&W photo.
	//   Option A (active): a HEAVIER veil for the darker, moodier near-black bands.
	//   Option B (kept): a LIGHT veil (opacity 0.5) so grayscale detail stays clearly visible.
	.pf-fveil {
		position: absolute;
		inset: 0;
		background: $veil;
		opacity: 0; // off — the cover grade lives in the photo's own filter, not a veil
	}
	// CUT-OUT (window): a clear (un-graded) copy of the photo clipped to a vertical strip —
	// the strip starts at --cut-left and is --gap wide — so the photo shows in full inside the
	// window while the rest stays under the dark cover grade. A light veil sits over the strip.
	// TEST: red "shadow" echo — the photo tinted solid red, offset behind the main photo so a
	// red ghost spills out from one side. sepia→saturate→hue-rotate pushes the grayscale toward
	// a vivid red; the translate offsets it; it sits behind the main photo (DOM order + no veil).
	.pf-fphoto--echo {
		filter: grayscale(1) brightness(0.9) sepia(1) saturate(8) hue-rotate(-18deg) blur(14px);
		z-index: 0;
		// Hold at the START of the slide-in (directly behind the photo, no offset) until
		// the loader has finished and the page is VISIBLE — so the user actually sees the
		// shade emerge. The animation only runs once [data-revealed='true'] is set.
		transform: translate(0, 0);
	}
	// Play the echo slide-in only after the loader reveals the page.
	[data-revealed='true'] .pf-fphoto--echo {
		// Slides OUT to its resting offset over 0.7s (ease-out) — the red ghost emerges
		// from directly behind the image rather than flying in from off-frame.
		animation: pf-echo-in 0.7s ease-out both;
	}
	@keyframes pf-echo-in {
		from {
			transform: translate(0, 0);
		}
		to {
			transform: translate(3rem, 1.5rem);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		// No slide-in for reduced motion — show the echo at its resting offset directly.
		.pf-fphoto--echo,
		[data-revealed='true'] .pf-fphoto--echo {
			animation: none;
			transform: translate(3rem, 1.5rem);
		}
	}
	.pf-fphoto--window {
		display: none; // TEST: cut-out bar off
		filter: none;
		clip-path: inset(0 calc(100% - var(--cut-left) - var(--gap)) 0 var(--cut-left));
	}
	.pf-fwindow-veil {
		display: none; // TEST: cut-out bar veil off
		position: absolute;
		inset: 0;
		background: #1f1e1c;
		opacity: var(--win-veil, 0.28);
		clip-path: inset(0 calc(100% - var(--cut-left) - var(--gap)) 0 var(--cut-left));
		pointer-events: none;
	}

	// ══ Sheet (everything below the cover) ══════════════════════════════════════
	.pf-sheet {
		position: relative;
		z-index: 3;
		width: min(92%, 1480px);
		margin: 0 auto;
		padding-top: 10rem; // gap between the cover and the first info block
		// Generous gap between the last block (Trenira) and the bottom of the sheet.
		padding-bottom: ($sp * 12);
	}
	.pf-block {
		// Bigger breathing room between every block in the blue sheet.
		margin-bottom: ($sp * 9);
		&:last-child {
			margin-bottom: 0;
		}
	}
	.pf-block-title {
		margin: 0 0 ($sp * 1.5);
		padding-bottom: ($sp * 0.5);
		font-size: 1.4rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		border-bottom: 2px solid color.change($gold, $alpha: 0.5);
	}

	// ══ 2. DETAILS + BIO ════════════════════════════════════════════════════════
	.pf-intro {
		display: grid;
		grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
		gap: ($sp * 8);
		align-items: start;
	}
	.pf-detail-list {
		margin: 0 0 ($sp * 2);
	}
	.pf-detail {
		display: flex;
		align-items: center; // left (dt) + right (dd) text vertically aligned
		justify-content: space-between;
		gap: ($sp);
		padding: ($sp * 0.75) 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		dt {
			color: #9fb0c8;
			font-size: 0.78rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}
		dd {
			margin: 0;
			text-align: right;
			font-weight: 600;
		}
	}
	.pf-wa {
		display: inline-block;
		color: $gold;
		font-weight: 700;
		text-decoration: none;
		&:hover {
			text-decoration: underline;
		}
	}
	.pf-bio-scroll {
		max-height: 320px;
		overflow-y: auto;
		padding-right: ($sp);
		p {
			margin: 0 0 ($sp);
			color: #d7e0ee;
			font-weight: 300;
			line-height: 1.75;
			&:last-child {
				margin-bottom: 0;
			}
		}
		scrollbar-width: thin;
		scrollbar-color: color.change($gold, $alpha: 0.5) transparent;
		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-thumb {
			background: color.change($gold, $alpha: 0.5);
			border-radius: 3px;
		}
	}

	// ══ 3. ACHIEVEMENTS (honour cards) ══════════════════════════════════════════
	// No box around the cards — they sit free on the sheet. Each card glitters with
	// a few gold 4-point sparkles (per-card sparkle layer below).
	.pf-honours-block {
		position: relative;
	}
	// ── Gold sparkle / glitter layer (per card) ──────────────────────────────────
	// A few 4-point gold stars that pop in (scale + spin up from 0), hold a twinkle,
	// then fade out — looping forever with staggered per-star delays so the card
	// glitters continuously. Clipped to the card via .pf-honour overflow.
	.pf-sparkles {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0; // behind the card text/number, over the card background
	}
	.pf-sparkle {
		position: absolute;
		width: var(--sz, 16px);
		height: var(--sz, 16px);
		background: $gold;
		// Classic 4-point "twinkle" sparkle: a gold fill masked by an SVG whose four
		// spikes have concave bezier sides (so they're sharp needles, not an ×).
		$star: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 0 C54 38 62 46 100 50 C62 54 54 62 50 100 C46 62 38 54 0 50 C38 46 46 38 50 0 Z" fill="black"/></svg>';
		-webkit-mask: url("#{$star}") center / contain no-repeat;
		mask: url("#{$star}") center / contain no-repeat;
		transform: translate(-50%, -50%) scale(0) rotate(0deg);
		opacity: 0;
		filter: drop-shadow(0 0 3px color.change($gold, $alpha: 0.8));
		animation: pf-sparkle var(--dur, 2.8s) ease-in-out var(--delay, 0s) infinite;
	}
	@keyframes pf-sparkle {
		0%,
		100% {
			transform: translate(-50%, -50%) scale(0) rotate(0deg);
			opacity: 0;
		}
		35% {
			transform: translate(-50%, -50%) scale(1) rotate(45deg);
			opacity: 1;
		}
		55% {
			// brief twinkle: shrink a touch then hold before fading
			transform: translate(-50%, -50%) scale(0.7) rotate(70deg);
			opacity: 0.85;
		}
		75% {
			transform: translate(-50%, -50%) scale(1.05) rotate(90deg);
			opacity: 0.6;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pf-sparkle {
			display: none;
		}
	}

	.pf-honours {
		position: relative;
		z-index: 1;
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		// Wider cards so the longest title ("Svjetsko juniorsko prvenstvo") fits on a
		// single line; the grid wraps to more rows as needed.
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: ($sp * 1.75);
		// Don't let a tall card in a row stretch its row-mates — each card keeps its
		// own (fixed) height regardless of neighbours' title length.
		align-items: start;
	}
	// Bigger card: NO side border, the count + level icon up top, and the title
	// pushed to the BOTTOM (margin-top: auto) so every card's title sits on one line.
	.pf-honour {
		position: relative;
		display: flex;
		flex-direction: column;
		// FIXED height (room for the big icon row + a 2-line title) so EVERY card is the
		// same size on its own, independent of neighbours. With the grid's
		// align-items:start, no card stretches another, and the bottom-pinned title
		// lands at the same spot on all.
		height: 250px;
		padding: ($sp * 1.75);
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		overflow: hidden; // clip the sparkles to the card
		cursor: pointer;
		// Kill the blue flash mobile browsers paint on tap (default tap-highlight).
		-webkit-tap-highlight-color: transparent;
		transition:
			transform 0.2s ease,
			border-color 0.2s ease;
		&:hover {
			transform: translateY(-4px);
			border-color: color.change($gold, $alpha: 0.5);
		}
	}
	.pf-honour-top {
		position: relative;
		z-index: 1; // above the sparkle layer
		display: flex;
		// Vertically CENTRE both children so the level icon and the number sit on
		// the same line (the SVG never floats higher than the digit). Applies on
		// both desktop and phone.
		align-items: center;
		justify-content: space-between;
		gap: ($sp);
		min-height: 120px; // matches the level-icon box height
	}
	// Gold number (light-gold sheen across the glyphs).
	.pf-honour-count {
		display: inline-flex;
		align-items: center; // vertically centre the digit in the row box
		font-size: 6.6rem; // big number — sized to match the 120px level icon beside it
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.02em;
		// Solid gold with a soft light-gold sheen across the glyphs.
		background: linear-gradient(
			115deg,
			$gold 40%,
			#{color.adjust($gold, $lightness: 22%)} 50%,
			$gold 60%
		);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	.pf-honour-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		// FIXED icon box so the top row is the same height for every card regardless
		// of the level SVG's own aspect ratio. Every level SVG is forced to the SAME
		// rendered HEIGHT (matching the globe), so globe / EU / Croatia all read at the
		// same size; width is auto so each keeps its own proportions.
		width: 120px;
		height: 120px;
		line-height: 0;
		color: $gold; // currentColor → tints the inline record SVG gold
		:global(svg) {
			width: auto;
			height: 92px; // all three icons render at this height (globe-sized)
			max-width: 120px;
		}
		&[data-level='european'] {
			color: color.adjust($blue, $lightness: 22%);
		}
		&[data-level='state'] {
			color: #e8584f;
		}
	}
	// Title is large and pinned to the bottom of the card.
	.pf-honour-name {
		position: relative;
		z-index: 1; // above the sparkle layer
		margin: auto 0 0;
		padding-top: ($sp * 1.5);
		font-size: 1.18rem;
		font-weight: 700;
		color: $white;
		line-height: 1.25;
	}

	// ══ 4. STATS / RESULTS tabs + table ═════════════════════════════════════════
	.pf-tabs {
		position: relative; // anchor for the sliding underline
		display: flex;
		gap: ($sp * 1.5);
		margin-bottom: ($sp * 1.5);
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: none;
	}
	.pf-tab {
		position: relative;
		padding: 0 0 ($sp * 0.5);
		font: inherit;
		// Match the Postignuća block title (1.4rem / 800 / uppercase).
		font-weight: 800;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		font-size: 1.4rem;
		color: $grey;
		background: none;
		border: none;
		cursor: pointer;
		transition: color 0.18s ease;
		&:hover {
			color: $white;
		}
		&.active {
			color: $white;
		}
	}
	// ONE underline that SLIDES between tabs. Its left/width are set inline by a JS
	// effect (measured from the active button), so it glides across instead of each
	// tab growing its own line.
	.pf-tab-underline {
		position: absolute;
		bottom: -1px;
		height: 2px;
		background: $gold;
		left: var(--ul-left, 0);
		width: var(--ul-width, 0);
		transition:
			left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.pf-table-scroll {
		max-height: 460px;
		overflow: auto;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.03);
		// Fully define EVERY scrollbar part so Chrome uses the custom scrollbar and does
		// NOT fall back to the OS scrollbar (whose stepper arrows can't be removed). We
		// deliberately DON'T set the standard `scrollbar-width`/`scrollbar-color` here —
		// mixing them with ::-webkit rules makes Chrome ignore the webkit scrollbar and
		// render the OS one (with arrows).
		&::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		}
		&::-webkit-scrollbar-track {
			background: transparent;
		}
		&::-webkit-scrollbar-thumb {
			background: color.change($gold, $alpha: 0.5);
			border-radius: 4px;
		}
		&::-webkit-scrollbar-thumb:hover {
			background: color.change($gold, $alpha: 0.7);
		}
		&::-webkit-scrollbar-corner {
			background: transparent;
		}
		// No stepper arrows at the ends of the scrollbar (all directions/positions).
		&::-webkit-scrollbar-button {
			display: none;
			width: 0;
			height: 0;
		}
	}
	.pf-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 1.05rem;
		th,
		td {
			padding: ($sp) ($sp * 1.25);
			text-align: left;
			white-space: nowrap;
		}
		thead th {
			position: sticky;
			top: 0;
			background: #0d2147;
			color: $gold;
			font-weight: 700;
			text-transform: uppercase;
			font-size: 0.9rem;
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

	// ══ 5. BOW DATA ═════════════════════════════════════════════════════════════
	.pf-bow {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: ($sp * 3);
		align-items: center;
		padding: ($sp * 2);
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.03);
	}
	.pf-bow-media {
		position: relative;
		aspect-ratio: 4 / 3;
		min-height: 340px; // gives the 3D canvas a real height
		:global(.img-loader),
		:global(.img-loader-fallback) {
			background: transparent;
		}
	}
	.pf-bow-text {
		p {
			margin: 0 0 ($sp);
			color: #d7e0ee;
			font-weight: 300;
			line-height: 1.75;
			&:last-child {
				margin-bottom: 0;
			}
		}
	}
	// Small, dim model-licence credit under the description.
	.pf-bow-credit {
		font-size: 0.78rem;
		color: map.get(lib.$colors, 'jet-grey');
		a {
			color: $gold;
			text-decoration: none;
			&:hover {
				text-decoration: underline;
			}
		}
	}

	// ══ 6. RELATED ARCHERS ══════════════════════════════════════════════════════
	.pf-related-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: ($sp * 1.5);
	}

	// New "call-ups" RosterCard style for the coach + Trenira rows: cards butt together
	// (no gap) in a cornflower / primary checkerboard, matching the Momčad roster grid.
	$rc-cornflower: map.get(lib.$colors, 'cornflower');
	$rc-primary: map.get(lib.$colors, 'primary');
	.pf-roster-grid {
		// Space between cards so the coach / student cards don't touch.
		gap: ($sp * 1.5);
		// Tight top gap under the title. (These rows use the TALL card variant, which
		// does NOT grow on hover, so no extra headroom is needed.)
		padding-top: 0.25rem;
		> li {
			position: relative;
			--card-bg: #{$rc-cornflower};
			&.alt {
				--card-bg: #{$rc-primary};
			}
		}
	}

	// ══ "Trenira" paged row (4-across, arrow scrolls to the next page) ══════════
	// The pager sits ABOVE the title's full-width underline (its own row, right-
	// aligned); the title underline then spans the whole block like every other
	// section title.
	.pf-row-head {
		position: relative;
		.pf-block-title {
			// Full-width underline (the title's own border-bottom already spans 100%
			// since it's a block-level h2 here, not shrunk inside a flex row).
			margin-bottom: ($sp * 1.5);
		}
	}
	.pf-row-pager {
		position: absolute;
		// Sit just above the title's underline with a 0.7rem gap. The underline is the
		// title's border-bottom, which sits $sp*1.5 (the title's margin-bottom) up from
		// the bottom of .pf-row-head; add 0.7rem clearance above it.
		bottom: calc(#{$sp * 1.5} - 0.8rem);
		right: 0;
		display: flex;
		gap: ($sp * 0.5);
	}
	.pf-pager-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3.1rem;
		height: 3.1rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid color.change($gold, $alpha: 0.4);
		color: $gold;
		cursor: pointer;
		transition:
			background 0.18s ease,
			opacity 0.18s ease;
		&:hover:not(:disabled) {
			background: color.change($gold, $alpha: 0.18);
		}
		&:disabled {
			opacity: 0.3;
			cursor: default;
		}
		:global(svg) {
			display: block;
		}
	}
	// Viewport clips to exactly 4 cards wide; the track slides a full page per click.
	$row-gap: ($sp * 1.5);
	.pf-row-viewport {
		// Padding gives the outermost cards room for their box-shadow + rounded corners
		// so the clip edge doesn't slice them flat; the negative margin pulls that
		// padding back out so the visible row still spans the full block width. The
		// track is 100% of the padded content box, so a page is still exactly 4 cards.
		// Tight top gap (cards close to the title line); keep the horizontal padding so
		// the outermost cards' box-shadow/rounded corners aren't clipped flat.
		padding: 0.25rem ($sp * 1.25) ($sp * 0.75);
		margin: 0 (-$sp * 1.25);
		overflow: hidden;
	}
	.pf-row-track {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		// One column PER CELL, each a quarter of the viewport (minus the 3 inter-card
		// gaps) → exactly 4 visible, the rest clipped.
		grid-auto-flow: column;
		grid-auto-columns: calc((100% - #{$row-gap} * 3) / 4);
		gap: $row-gap;
		// Slide one PAGE per step. A page = the full viewport width PLUS one gap (the
		// gap that sits between the last card of this page and the first of the next),
		// so page 2's first card lands flush at the left edge — no left gap, no card
		// cut off on the right.
		transform: translateX(calc(var(--page, 0) * (-100% - #{$row-gap})));
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	// ══ Responsive ══════════════════════════════════════════════════════════════
	@media (max-width: 900px) {
		.pf-intro {
			grid-template-columns: 1fr;
			gap: ($sp * 5); // more space above Biografija (between it and the details)
		}
		.pf-bow {
			grid-template-columns: 1fr;
		}
		.pf-related-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 760px) {
		.pf-cover {
			min-height: 88vh;
		}
		.pf-cover-photo {
			width: 80%;
			right: 0;
		}
	}
	@media (max-width: 560px) {
		.pf-related-grid {
			grid-template-columns: 1fr;
		}
	}

	// ══ PHONE (≤720px): make the archer page fit a narrow screen ════════════════════
	@media (max-width: 720px) {
		// ── Cover ─────────────────────────────────────────────────────────────────
		// Shorter hero so the WHOLE photo fits (contain), with both name marquees big
		// and readable. Reset the per-archer transform tuning (desktop-aimed shift/rise/
		// scale) so the contained photo sits cleanly, bottom-anchored.
		.pf-fcover {
			// Fill the visible screen and END at the screen edge on load — like the front-page
			// hero. 100svh = the SMALL viewport height (URL bar showing), so the cover doesn't
			// run BELOW the fold the way 100vh does on mobile.
			min-height: 100svh;
		}
		.pf-fstage,
		.pf-fbow {
			transform: none !important; // drop the desktop shift/rise/scale on phone
		}
		.pf-fphoto {
			// Bigger, centred archer (cover = fills + crops). Per-archer phone knobs:
			//  --phone-cover-x    : object-position X (lower % = archer further RIGHT)
			//  --phone-cover-zoom : uniform zoom (1 = none, > 1 = bigger)
			//  --phone-cover-tall : EXTRA vertical stretch on top of zoom (1 = none)
			object-fit: cover !important;
			object-position: var(--phone-cover-x, 30%) center !important;
			transform: scale(
				var(--phone-cover-zoom, 1),
				calc(var(--phone-cover-zoom, 1) * var(--phone-cover-tall, 1))
			) !important;
		}
		// Hide the band-filter / bow-overlay complexity on phone — keep it a clean photo.
		.pf-fbow {
			display: none;
		}
		.pf-fbottom-fade {
			height: 30vh; // shorter fade for the shorter hero
		}
		// First name (phone): a big SCROLLING marquee tucked just under the topbar.
		.pf-fcover .pf-firstname.pf-marquee {
			// Pull UP so the visible caps tuck right under the topbar. The font has big
			// internal leading above the cap-height, so a negative top lifts the caps to
			// the bar; overflow hidden clips the empty leading above.
			top: -3rem;
			height: 36rem; // holds the full 30rem glyph (no clipping)
			overflow: hidden;
			display: flex;
			align-items: flex-start;
			.pf-marquee-track {
				font-size: 30rem; // BIG
				line-height: 1;
				// keep the desktop marquee scroll running (do NOT freeze)
			}
			// Keep TWO copies of the first name on phone (desktop renders 4×). Two is the
			// minimum for a SEAMLESS loop: as the first copy scrolls off the left, the
			// second is already entering, so the wrap-around has no visible glitch/reset.
			.pf-marquee-item:nth-child(n + 3) {
				display: none;
			}
			.pf-marquee-item {
				transform: none; // drop the desktop scaleY(1.35) stretch
				// SAME fade as desktop: darker navy crest at the top fading to fully
				// transparent lower down (text reads DARKER than the bright blue bg, like
				// desktop — not lighter).
				background: linear-gradient(
					to bottom,
					#{color.adjust($navy, $lightness: 18%)} 0%,
					#{$navy} 35%,
					rgba(16, 46, 102, 0) 75%
				);
				-webkit-background-clip: text;
				background-clip: text;
				color: transparent;
			}
		}
		// Surname: BIGGER (20rem), tucked against the bottom of the screen.
		// NOTE: keep the container a plain block (NOT flex) — the marqueeSpeed action
		// translates the track and a flex container destabilises the loop (the copies
		// drift fully off-screen). Bottom-anchor + glyph headroom come from height +
		// line-height, not flex.
		.pf-fcover .pf-surname.pf-marquee {
			top: auto;
			bottom: 0;
			// Tall enough to hold the full glyph PLUS the Ć diacritic above the caps; the
			// extra line-height leading pushes the glyph down so its baseline hugs the base.
			height: 24rem;
			.pf-marquee-track {
				font-size: 20rem;
				line-height: 1.15; // leading above the caps → room for the Ć accent
			}
			// The item carries an 18vw font-size on desktop that wins over the track —
			// force 20rem here too. Brighter watermark so the big surname reads clearly.
			.pf-marquee-item {
				font-size: 20rem;
				background: linear-gradient(
					to bottom,
					rgba(255, 255, 255, 0.4) 0%,
					rgba(255, 255, 255, 0.18) 100%
				);
				-webkit-background-clip: text;
				background-clip: text;
			}
		}

		// ── Sheet rhythm (tighter on phone) ─────────────────────────────────────────
		.pf-sheet {
			padding-top: 4rem;
			padding-bottom: ($sp * 6);
		}
		.pf-block {
			margin-bottom: ($sp * 5);
		}
		.pf-block-title {
			font-size: 1.15rem;
		}

		// ── Achievements (RM-style horizontal swipe row) ────────────────────────────
		// Smaller cards laid out in ONE horizontal track the user swipes sideways
		// through (scroll-snap), instead of stacking down the page.
		.pf-honours-block {
			// No edge-bleed: the row's first and last cards line up with the page
			// gutter (16px) like every other block (biography, table, etc.).
			margin-inline: 0;
		}
		.pf-honours {
			display: flex;
			flex-wrap: nowrap;
			grid-template-columns: none;
			gap: ($sp * 1.25);
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			-webkit-overflow-scrolling: touch;
			// Only respond to horizontal swipes; vertical (page) scroll passes straight
			// through so the card row doesn't drift / re-snap while scrolling the page.
			touch-action: pan-x;
			scrollbar-width: none; // Firefox — hide the scrollbar
			// No side padding: cards sit flush with the block's own 16px gutter so
			// the first/last card align with biography/table on both sides.
			padding: ($sp * 0.5) 0;
			&::-webkit-scrollbar {
				display: none; // WebKit — hide the scrollbar
			}
		}
		.pf-honour {
			flex: 0 0 auto;
			// Wider + a bit shorter so there's room for a clear gap between the
			// number and the level icon.
			width: 240px;
			height: 165px;
			padding: ($sp * 1.25);
			scroll-snap-align: start;
			&:hover {
				transform: none; // no hover lift on touch
			}
		}
		.pf-honour-top {
			min-height: 72px;
			gap: ($sp * 1.75); // more space between number and svg on phone
			align-items: center; // number + svg on the same centred line (svg not higher)
		}
		.pf-honour-count {
			font-size: 5rem;
			line-height: 0.8;
		}
		.pf-honour-icon {
			width: 64px;
			height: 64px;
			:global(svg) {
				height: 56px;
				max-width: 64px;
			}
		}
		.pf-honour-name {
			padding-top: ($sp);
			font-size: 0.9rem;
		}

		// ── Bow (3D model + text) ───────────────────────────────────────────────────
		// Stack the model over the text; smaller canvas + tighter padding.
		.pf-bow {
			grid-template-columns: 1fr;
			gap: ($sp * 3); // more breathing room between the model and the text
			padding: ($sp);
		}
		.pf-bow-media {
			min-height: 260px;
		}

		// ── Coaches (Trener) + roster grids ─────────────────────────────────────────
		// 2-up on phone so the cards aren't a single full-width column.
		.pf-related-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		// Pull the cards closer to the title's underline, and separate the cards
		// from each other (they butt together on desktop). Names go white since the
		// cards sit on the blue cornflower/primary checkerboard, not the white page.
		.pf-roster-grid {
			// Tighter gap between the title's underline and the cards (applies to both
			// the coach grid and the Trenira student row, which share this class).
			padding-top: 0.25rem;
			gap: ($sp * 1.5);
			:global(.rc-firstname),
			:global(.rc-last) {
				color: #fff;
			}
		}

		// ── Students ("Trenira") row — SWIPE instead of paged buttons ───────────────
		// On phone the row is a native horizontal scroller the user swipes through;
		// the desktop transform-paging + arrow buttons are dropped.
		.pf-row-pager {
			display: none; // no left/right buttons on phone — swipe instead
		}
		.pf-row-viewport {
			overflow-x: auto;
			overflow-y: visible;
			scroll-snap-type: x mandatory;
			-webkit-overflow-scrolling: touch;
			touch-action: pan-x; // vertical page scroll passes through; only swipe pages
			scrollbar-width: none;
			// Drop the desktop edge-bleed so the first/last card rest at the page
			// gutter (no card flush against / cut off at the screen edge). Zero the top
			// padding so the student gap matches the coach grid (track handles spacing).
			margin: 0;
			padding-left: 0;
			padding-right: 0;
			padding-top: 0;
			&::-webkit-scrollbar {
				display: none;
			}
		}
		.pf-row-track {
			// Drop the transform-paging; lay the cells out in a swipeable row, ~2 in
			// view at a time (each cell snaps to the left edge).
			transform: none;
			grid-auto-columns: calc((100% - #{$row-gap}) / 2);
		}
		.pf-row-cell {
			scroll-snap-align: start;
		}

		// ── Stats tabs + table ──────────────────────────────────────────────────────
		// Centre the two selectors instead of flushing them left.
		.pf-tabs {
			justify-content: center;
		}
		.pf-tab {
			font-size: 1rem;
		}
		// Allow the table to scroll horizontally (touch) rather than overflow the page.
		.pf-event {
			min-width: 140px;
		}
		.pf-table {
			font-size: 0.9rem;
			th,
			td {
				padding: ($sp * 0.75) ($sp);
			}
		}
	}
</style>
