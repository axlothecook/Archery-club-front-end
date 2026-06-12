<script lang="ts">
	import type { ClubEventResolved, EventLevelResolved } from 'archery-contracts';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';
	import GlobeRecordIcon from '$lib/components/icons/GlobeRecordIcon.svelte';
	import EuropeRecordIcon from '$lib/components/icons/EuropeRecordIcon.svelte';
	import CroatiaRecordIcon from '$lib/components/icons/CroatiaRecordIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import LocationIcon from '$lib/components/icons/LocationIcon.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import CloseIcon from '$lib/components/icons/CloseIcon.svelte';
	import MonthViewIcon from '$lib/components/icons/MonthViewIcon.svelte';
	import YearViewIcon from '$lib/components/icons/YearViewIcon.svelte';
	import NewsRoster from '$lib/components/NewsRoster.svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { Component } from 'svelte';
	import { fade, scale, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { data } = $props();
	// data.events  — ClubEventResolved[] (ordered by start date)
	// data.levels  — EventLevelResolved[] legend (color + name)

	// ⚠️ PLACEHOLDER hero video — PSG's public CDN clip, a stand-in until we
	// produce our own intro. NOT our asset: replace before launch, and note it is
	// NOT covered by the Supabase→R2 migration sweep (different origin).
	const PLACEHOLDER_HERO_VIDEO =
		'https://media.psg.fr/video/upload/PSG_HEADER_01_compressed_yvpwlq';

	// Club crest — same source NavBar/Footer use (a Supabase URL already on the
	// Day-6 R2 migration sweep list, so no new debt).
	const CLUB_LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// Scroll arrow → reveal the calendar below the full-screen hero.
	function scrollToCalendar() {
		document.getElementById('raspored-kalendar')?.scrollIntoView({ behavior: 'smooth' });
	}

	// ── Calendar setup ───────────────────────────────────────────────────────────
	// Events store calendar DATES as UTC-midnight ISO ('…T00:00:00.000Z'). We bucket
	// and lay out the grid entirely in UTC so an event always lands on exactly the
	// date stored (using local time could shift it a day in negative-offset zones).
	const NEUTRAL_COLOR = '#888888'; // level-less events ("Ostalo")
	const MAX_VISIBLE = 3; // events shown in a cell before the "+N više" chip

	// "YYYY-MM-DD" key in UTC — the join between an event's day(s) and a grid cell.
	function dayKey(d: Date): string {
		return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
			d.getUTCDate()
		).padStart(2, '0')}`;
	}

	// Legend colour for an event: its resolved level colour, else neutral.
	function eventColor(ev: ClubEventResolved): string {
		return ev.level?.color ?? NEUTRAL_COLOR;
	}

	// Month vs year view.
	let viewMode = $state<'month' | 'year'>('month');

	// Year-view day dot: a CSS background for a day with events. One event = a solid
	// colour; multiple = a CONIC gradient split into EQUAL slices, one per event's
	// colour (2 events → half/half, 3 → thirds, …). Order = the events' order.
	function dayDotStyle(events: ClubEventResolved[]): string {
		const colors = events.map(eventColor);
		if (colors.length === 1) return `background:${colors[0]}`;
		const step = 100 / colors.length;
		const stops = colors
			.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
			.join(', ');
		return `background:conic-gradient(${stops})`;
	}

	// Scope icon for a level (shown in the event card, RM-logo position): the level
	// name maps to a geographic SCOPE — world / Europe / Croatia — and the icon is
	// tinted with the level's own colour (yellow / blue / red / purple). Level-less
	// events get no scope icon (null).
	function scopeIcon(level: EventLevelResolved | null): Component | null {
		if (!level) return null;
		switch (level.name) {
			case 'Svjetski kup':
				return GlobeRecordIcon;
			case 'Europsko prvenstvo':
				return EuropeRecordIcon;
			case 'Državno':
			case 'Domaće':
				return CroatiaRecordIcon;
			default:
				return null;
		}
	}

	// Bucket every event under EACH day it spans (dateFrom..dateTo inclusive), so a
	// multi-day competition shows on all of its days. Built once from the data.
	const eventsByDay: Map<string, ClubEventResolved[]> = (() => {
		const map = new Map<string, ClubEventResolved[]>();
		for (const ev of data.events) {
			const from = new Date(ev.dateFrom);
			const to = ev.dateTo ? new Date(ev.dateTo) : from;
			if (Number.isNaN(from.getTime())) continue;
			// Walk day-by-day in UTC from `from` to `to` (inclusive).
			const cursor = new Date(
				Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
			);
			const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
			while (cursor <= end) {
				const key = dayKey(cursor);
				(map.get(key) ?? map.set(key, []).get(key)!).push(ev);
				cursor.setUTCDate(cursor.getUTCDate() + 1);
			}
		}
		return map;
	})();

	// Month navigation. The data is the 2026 calendar, so we open on the current
	// real month if it's within 2026, else January 2026, and clamp nav to 2026.
	const DATA_YEAR = 2026;
	const now = new Date();
	let viewYear = $state(DATA_YEAR);
	let viewMonth = $state(now.getUTCFullYear() === DATA_YEAR ? now.getUTCMonth() : 5); // 0-based; default June (where data is dense)

	const canPrev = $derived(viewMonth > 0);
	const canNext = $derived(viewMonth < 11);
	// Direction of the last month change (+1 next, -1 prev) → drives the slide anim.
	let slideDir = $state(1);
	function prevMonth() {
		if (canPrev) {
			slideDir = -1;
			viewMonth -= 1;
		}
	}
	function nextMonth() {
		if (canNext) {
			slideDir = 1;
			viewMonth += 1;
		}
	}

	// Croatian month + weekday names from the platform (never hardcoded).
	const MONTH_TITLE_FMT = new Intl.DateTimeFormat('hr-HR', { month: 'long', year: 'numeric' });
	const monthTitle = $derived(MONTH_TITLE_FMT.format(new Date(Date.UTC(viewYear, viewMonth, 1))));
	// Su–Sa short weekday labels (grid starts on Sunday, mirroring the reference).
	const WEEKDAY_FMT = new Intl.DateTimeFormat('hr-HR', { weekday: 'short' });
	const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
		// 2024-01-07 was a Sunday → +i walks Su..Sa.
		WEEKDAY_FMT.format(new Date(Date.UTC(2024, 0, 7 + i)))
	);

	// One grid cell.
	type DayCell = {
		date: Date; // UTC midnight
		key: string;
		dayNum: number;
		inMonth: boolean; // false = leading/trailing day from an adjacent month (greyed)
		isToday: boolean;
		events: ClubEventResolved[];
	};

	const todayKey = dayKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));

	// Build the 6-week (42-cell) grid for a given month: leading days from the prev
	// month back to Sunday, the month itself, trailing days to fill the last week —
	// the greyed 31/01 spill the reference shows. Reused by the month + year views.
	function buildWeeks(year: number, month: number): DayCell[][] {
		const first = new Date(Date.UTC(year, month, 1));
		const startOffset = first.getUTCDay(); // 0=Sun
		const cells: DayCell[] = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(Date.UTC(year, month, 1 - startOffset + i));
			const key = dayKey(d);
			cells.push({
				date: d,
				key,
				dayNum: d.getUTCDate(),
				inMonth: d.getUTCMonth() === month,
				isToday: key === todayKey,
				events: eventsByDay.get(key) ?? []
			});
		}
		return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
	}

	const weeks = $derived.by<DayCell[][]>(() => {
		return buildWeeks(viewYear, viewMonth);
	});

	// Year view: all 12 months as mini-grids (name + 6×7 weeks), for the data year.
	const MONTH_NAME_FMT = new Intl.DateTimeFormat('hr-HR', { month: 'long' });
	const monthsOfYear = $derived(
		Array.from({ length: 12 }, (_, m) => ({
			month: m,
			name: MONTH_NAME_FMT.format(new Date(Date.UTC(viewYear, m, 1))),
			weeks: buildWeeks(viewYear, m)
		}))
	);

	// View toggle + jump-from-year-to-month.
	function toggleView() {
		viewMode = viewMode === 'month' ? 'year' : 'month';
	}
	function openMonth(m: number) {
		viewMonth = m;
		viewMode = 'month';
	}

	// ── "Upcoming (this week)" + "This month" event lists ────────────────────────
	// An event's day keys (every day it spans) — to test membership in a range.
	function eventDayKeys(ev: ClubEventResolved): string[] {
		const from = new Date(ev.dateFrom);
		const to = ev.dateTo ? new Date(ev.dateTo) : from;
		const keys: string[] = [];
		const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
		const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
		while (cur <= end) {
			keys.push(dayKey(cur));
			cur.setUTCDate(cur.getUTCDate() + 1);
		}
		return keys;
	}

	// This week = the current Mon–Sun week (UTC). Build the 7 day keys.
	const weekKeys = (() => {
		const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
		const dow = t.getUTCDay(); // 0=Sun..6=Sat
		const backToMon = (dow + 6) % 7; // days since Monday
		const mon = new Date(t);
		mon.setUTCDate(t.getUTCDate() - backToMon);
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(mon);
			d.setUTCDate(mon.getUTCDate() + i);
			return dayKey(d);
		});
	})();
	const weekKeySet = new Set(weekKeys);

	// "8.6. - 14.6." — the Mon–Sun week range (D.M. with trailing dots) from the
	// first/last day keys ("YYYY-MM-DD").
	function dmFromKey(key: string): string {
		const [, m, d] = key.split('-');
		return `${Number(d)}.${Number(m)}.`;
	}
	const weekRangeLabel = `${dmFromKey(weekKeys[0])} - ${dmFromKey(weekKeys[6])}`;

	// Events happening THIS WEEK (any spanned day falls in the Mon–Sun set).
	const weekEvents = $derived(
		data.events.filter((ev) => eventDayKeys(ev).some((k) => weekKeySet.has(k)))
	);

	// Events in the CURRENT calendar month (any spanned day in this month/year).
	const thisMonthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
	const monthEvents = $derived(
		data.events.filter((ev) => eventDayKeys(ev).some((k) => k.startsWith(thisMonthPrefix)))
	);

	// "This month" carousel: arrows page by ~one viewport (the 4 visible cards).
	// `canScrollLeft/Right` track whether more cards exist in each direction, so the
	// arrows hide at the start/end.
	let monthCarousel: HTMLElement | undefined = $state();
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);
	function updateCarouselArrows() {
		const el = monthCarousel;
		if (!el) return;
		canScrollLeft = el.scrollLeft > 1;
		canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
	}
	function scrollCarousel(dir: -1 | 1) {
		const by = monthCarousel ? monthCarousel.clientWidth * 0.9 : 360;
		monthCarousel?.scrollBy({ left: dir * by, behavior: 'smooth' });
	}
	// Initialise the arrow visibility once the track is mounted + on resize.
	$effect(() => {
		const el = monthCarousel;
		if (!el) return;
		updateCarouselArrows();
		const ro = new ResizeObserver(updateCarouselArrows);
		ro.observe(el);
		return () => ro.disconnect();
	});

	// Legend rows = the backend levels, plus a neutral "Ostalo" entry IF any event
	// currently has no level (true for all events until the importer assigns them).
	const legend = $derived([
		...data.levels.map((l) => ({ name: l.name, color: l.color })),
		...(data.events.some((e) => !e.level) ? [{ name: 'Ostalo', color: NEUTRAL_COLOR }] : [])
	]);

	// ── Day modal ────────────────────────────────────────────────────────────────
	// Clicking any day with events opens a centered modal listing that day's events
	// as RM-style cards. `selectedDay` holds the open cell (null = closed).
	//
	// DEFAULT-SELECT today on load (if today has events): build today's cell directly
	// so it's selected from the FIRST render (SSR included → no hint flash), showing
	// today in its selected state (stronger red) + its cards in the side panel.
	function todayCell(): DayCell | null {
		const d = new Date(`${todayKey}T00:00:00.000Z`);
		const events = eventsByDay.get(todayKey) ?? [];
		if (events.length === 0) return null;
		return { date: d, key: todayKey, dayNum: d.getUTCDate(), inMonth: true, isToday: true, events };
	}
	let selectedDay = $state<DayCell | null>(todayCell());
	// The key of the currently-selected (clicked) day → drives the `.selected` cell
	// highlight (distinct from today's `.today` marker).
	const selectedKey = $derived(selectedDay?.key ?? null);

	// Long Croatian date for the modal heading + card date rows.
	const HR_LONG = new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' });
	const HR_SHORT = new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'long' });

	// Event date label: "7. ožujka 2026." or, for a range, "7. – 8. ožujka 2026."
	function eventDateLabel(ev: ClubEventResolved): string {
		const from = new Date(ev.dateFrom);
		if (!ev.dateTo) return HR_LONG.format(from);
		const to = new Date(ev.dateTo);
		return `${HR_SHORT.format(from)} – ${HR_LONG.format(to)}`;
	}

	function openDay(cell: DayCell) {
		selectedDay = cell;
	}
	function closeModal() {
		selectedDay = null;
	}
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeModal();
	}
</script>

<section class="schedule-hero">
	<video
		class="schedule-hero-video"
		autoplay
		muted
		loop
		playsinline
		preload="auto"
		aria-hidden="true"
	>
		<source src="{PLACEHOLDER_HERO_VIDEO}.mp4" type="video/mp4" />
		<source src="{PLACEHOLDER_HERO_VIDEO}.webm" type="video/webm" />
	</video>
	<div class="schedule-hero-overlay"></div>

	<div class="schedule-hero-inner">
		<img class="schedule-hero-logo" src={CLUB_LOGO_URL} alt="Varaždinski streličarski klub" />
		<h1 class="schedule-hero-title">
			<span class="thin">Raspored</span>
			<span class="bold">2026</span>
		</h1>
		<p class="schedule-hero-sub">Natjecanja na kojima nastupaju streličari kluba</p>
	</div>

	<button class="schedule-hero-scroll" onclick={scrollToCalendar} aria-label="Pomakni na raspored">
		<ChevronIcon direction="down" size={22} strokeWidth={1.5} />
	</button>
</section>

<section id="raspored-kalendar" class="kalendar">
	<div class="kalendar-inner" use:reveal={{ threshold: 0.02 }}>
	<div class="kalendar-layout">
	<!-- LEFT: month nav + calendar grid -->
	<div class="kalendar-main">

	<!-- View toggle — pinned to the LEFT EDGE of the calendar. Switches month↔year.
	     (Icon SVGs to be supplied by the user; placeholder labels for now.) -->
	<button
		class="view-toggle"
		onclick={toggleView}
		aria-label={viewMode === 'month' ? 'Godišnji prikaz' : 'Mjesečni prikaz'}
		title={viewMode === 'month' ? 'Godišnji prikaz' : 'Mjesečni prikaz'}
	>
		<!-- Show the icon for the view you'll switch TO. -->
		{#if viewMode === 'month'}
			<YearViewIcon size={22} />
		{:else}
			<MonthViewIcon size={22} />
		{/if}
	</button>

	{#if viewMode === 'month'}
	<div
		class="view-pane"
		in:scale={{ duration: 260, start: 0.96, opacity: 0, easing: cubicOut }}
		out:scale={{ duration: 200, start: 0.96, opacity: 0, easing: cubicOut }}
	>
	<!-- Month navigation: ‹  lipanj 2026  › (clamped to 2026) -->
	<div class="month-nav">
		<button
			class="month-arrow br-full"
			onclick={prevMonth}
			disabled={!canPrev}
			aria-label="Prethodni mjesec"
		>
			<ChevronIcon direction="left" size={20} />
		</button>
		<h2 class="month-title">{monthTitle}</h2>
		<button class="month-arrow br-full" onclick={nextMonth} disabled={!canNext} aria-label="Sljedeći mjesec">
			<ChevronIcon direction="right" size={20} />
		</button>
	</div>

	<!-- Calendar grid: 7-column Su–Sa month view -->
	<div class="grid" role="grid">
		<!-- Weekday header row -->
		<div class="weekday-row" role="row">
			{#each weekdayLabels as wd (wd)}
				<div class="weekday" role="columnheader">{wd}</div>
			{/each}
		</div>

		<!-- Week rows — keyed on the viewed month so changing months re-creates the
		     block and the directional slide (next ← / prev →) plays. -->
		<div class="weeks-viewport">
		{#key viewMonth}
			<div
				class="weeks"
				in:fly={{ x: slideDir * 60, duration: 280, easing: cubicOut }}
				out:fly={{ x: slideDir * -60, duration: 280, easing: cubicOut }}
			>
				{#each weeks as week, w (w)}
					<div class="week" role="row">
						{#each week as cell (cell.key)}
					{@const visible = cell.events.slice(0, MAX_VISIBLE)}
					{@const overflow = cell.events.length - visible.length}
					{@const hasEvents = cell.events.length > 0}
					<div
						class="cell"
						class:out-month={!cell.inMonth}
						class:today={cell.isToday}
						class:selected={cell.key === selectedKey}
						class:clickable={hasEvents}
						role="gridcell"
						onclick={() => hasEvents && openDay(cell)}
						onkeydown={(e) => hasEvents && (e.key === 'Enter' || e.key === ' ') && openDay(cell)}
						tabindex={hasEvents ? 0 : -1}
					>
						<span class="cell-day">{String(cell.dayNum).padStart(2, '0')}</span>

						<div class="cell-events">
							{#each visible as ev (ev.id)}
								<div class="event" class:cancelled={ev.isCancelled} title={ev.name}>
									<span class="event-dot br-full" style="background-color: {eventColor(ev)}"></span>
									<span class="event-name">{ev.name}</span>
								</div>
							{/each}

							{#if overflow > 0}
								<span class="event-more">+ {overflow} više</span>
							{/if}
						</div>
					</div>
						{/each}
					</div>
				{/each}
			</div>
		{/key}
		</div><!-- /.weeks-viewport -->
	</div>
	</div><!-- /.view-pane (month) -->
	{:else}
		<!-- YEAR VIEW — 12 mini-month grids. Day with events = a dot (conic-gradient
		     split equally per event colour). Click a day → its events; click a month
		     header → jump to that month's full view. -->
		<div
			class="view-pane"
			in:scale={{ duration: 260, start: 0.96, opacity: 0, easing: cubicOut }}
			out:scale={{ duration: 200, start: 0.96, opacity: 0, easing: cubicOut }}
		>
			<!-- Year title — same spot as the month selector in month view. -->
			<div class="year-nav">
				<h2 class="month-title">{viewYear}</h2>
			</div>
			<div class="year-grid">
			{#each monthsOfYear as mo (mo.month)}
				<div class="mini-month">
					<button class="mini-month-title" onclick={() => openMonth(mo.month)}>
						{mo.name}
					</button>
					<div class="mini-grid">
						{#each weekdayLabels as wd (wd)}
							<div class="mini-weekday">{wd.slice(0, 1)}</div>
						{/each}
						{#each mo.weeks as week (week[0].key)}
							{#each week as cell (cell.key)}
								{@const hasEvents = cell.events.length > 0}
								<div
									class="mini-cell br-full"
									class:out-month={!cell.inMonth}
									class:today={cell.isToday}
									class:has-events={hasEvents}
									role="gridcell"
									onclick={() => hasEvents && openDay(cell)}
									onkeydown={(e) =>
										hasEvents && (e.key === 'Enter' || e.key === ' ') && openDay(cell)}
									tabindex={hasEvents ? 0 : -1}
								>
									{#if hasEvents}
										<span class="mini-dot br-full" style={dayDotStyle(cell.events)}></span>
									{/if}
									<span class="mini-day">{cell.dayNum}</span>
								</div>
							{/each}
						{/each}
					</div>
				</div>
			{/each}
			</div><!-- /.year-grid -->
		</div><!-- /.view-pane (year) -->
	{/if}
	</div><!-- /.kalendar-main -->

	<!-- RIGHT: legend on top + (desktop) selected-day event cards below it -->
	<aside class="kalendar-side">
		<div class="legend">
			{#each legend as item (item.name)}
				<span class="legend-item">
					<span class="legend-dot br-full" style="background-color: {item.color}"></span>
					{item.name}
				</span>
			{/each}
		</div>

		<!-- Desktop-only events panel (mobile uses the modal instead) -->
		<div class="side-events">
			{#if selectedDay}
				<div class="side-events-head">
					<h3>{HR_LONG.format(selectedDay.date)}</h3>
					<button class="modal-close br-full" onclick={closeModal} aria-label="Zatvori">
						<CloseIcon size={18} />
					</button>
				</div>
				<div class="side-events-cards">
					{#each selectedDay.events as ev (ev.id)}
						{@render eventCard(ev)}
					{/each}
				</div>
			{:else}
				<p class="side-events-hint">Odaberite dan za prikaz događaja.</p>
			{/if}
		</div>
	</aside>
	</div><!-- /.kalendar-layout -->
	</div>
</section>

<!-- NADOLAZEĆE — one shared title over both the week + month sub-sections -->
<section class="events-block">
	<div class="events-inner">
		<h2 class="block-title" use:reveal>Nadolazeće</h2>

		<!-- This week -->
		<div class="events-sub">
			<h3 class="sub-heading">Ovaj tjedan <span class="sub-dates">[{weekRangeLabel}]</span></h3>
			{#if weekEvents.length}
				<div class="events-row">
					{#each weekEvents as ev, i (ev.id)}
						<div class="reveal-item" use:reveal={{ delay: i * 90 }}>
							{@render eventCard(ev)}
						</div>
					{/each}
				</div>
			{:else}
				<p class="events-empty">Nema događaja ovaj tjedan.</p>
			{/if}
		</div>

		<!-- This month (carousel) -->
		<div class="events-sub">
			<h3 class="sub-heading month-heading">Ovaj mjesec</h3>
			{#if monthEvents.length}
				<div class="carousel">
					{#if canScrollLeft}
						<button
							class="carousel-arrow left br-full"
							onclick={() => scrollCarousel(-1)}
							aria-label="Prethodno"
						>
							<ChevronIcon direction="left" size={22} />
						</button>
					{/if}
					<div class="carousel-track" bind:this={monthCarousel} onscroll={updateCarouselArrows}>
						{#each monthEvents as ev, i (ev.id)}
							<div class="carousel-item reveal-item" use:reveal={{ delay: (i % 4) * 90 }}>
								{@render eventCard(ev)}
							</div>
						{/each}
					</div>
					{#if canScrollRight}
						<button
							class="carousel-arrow right br-full"
							onclick={() => scrollCarousel(1)}
							aria-label="Sljedeće"
						>
							<ChevronIcon direction="right" size={22} />
						</button>
					{/if}
				</div>
			{:else}
				<p class="events-empty">Nema događaja ovaj mjesec.</p>
			{/if}
		</div>
	</div>
</section>

<!-- NEWS — the shared 8-article roster used across the site -->
<section class="news-block">
	<div use:reveal={{ threshold: 0.02 }}>
		<NewsRoster articles={data.articles} />
	</div>
</section>

<svelte:window onkeydown={onKeydown} />

<!-- ONE RM-style event card — reused by the mobile modal AND the desktop side panel -->
{#snippet eventCard(ev: ClubEventResolved)}
	{@const Scope = scopeIcon(ev.level)}
	<article class="ev-card br-md" class:cancelled={ev.isCancelled}>
		<!-- Navy header band: scope icon (tinted by level colour) + level name -->
		<div class="ev-card-head">
			{#if Scope}
				<span class="ev-scope" style="color: {eventColor(ev)}">
					<Scope size={84} />
				</span>
			{/if}
			<span class="ev-level" style="color: {eventColor(ev)}">{ev.level?.name ?? 'Ostalo'}</span>
		</div>

		<!-- White body -->
		<div class="ev-card-body">
			<p class="ev-cat">
				Streličarstvo{ev.format ? ` · ${ev.format}` : ''}
			</p>
			<h4 class="ev-name">{ev.name}</h4>
			{#if ev.isCancelled}
				<p class="ev-cancelled-tag">Otkazano</p>
			{/if}

			<p class="ev-row">
				<CalendarIcon size={16} />
				<span>{eventDateLabel(ev)}</span>
			</p>
			{#if ev.location}
				<p class="ev-row">
					<LocationIcon size={16} />
					<span>{ev.location}</span>
				</p>
			{/if}
			{#if ev.attendees.length || ev.hasUnlistedClubAttendee}
				<p class="ev-row">
					<PersonIcon size={16} />
					<span>
						{#if ev.attendees.length}
							{ev.attendees.join(', ')}{ev.hasUnlistedClubAttendee
								? ' i ostali članovi kluba'
								: ''}
						{:else}
							Članovi kluba
						{/if}
					</span>
				</p>
			{/if}

			{#if ev.sourceUrl}
				<a class="ev-more" href={ev.sourceUrl} target="_blank" rel="noopener">
					Više <ChevronIcon direction="right" size={14} />
				</a>
			{/if}
		</div>
	</article>
{/snippet}

<!-- Day modal — MOBILE only (≤1024px); desktop shows cards in the side panel.
     Animated open/close via svelte transitions (fade backdrop + scale panel). -->
{#if selectedDay}
	<div
		class="modal-backdrop"
		role="button"
		tabindex="-1"
		aria-label="Zatvori"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Enter' && closeModal()}
		transition:fade={{ duration: 200 }}
	>
		<!-- Stop propagation so clicks inside the panel don't close it -->
		<div
			class="modal-panel"
			role="dialog"
			aria-modal="true"
			aria-label="Događaji"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			transition:scale={{ duration: 240, start: 0.92, opacity: 0, easing: cubicOut }}
		>
			<header class="modal-head">
				<h3>{HR_LONG.format(selectedDay.date)}</h3>
				<button class="modal-close br-full" onclick={closeModal} aria-label="Zatvori">
					<CloseIcon size={20} />
				</button>
			</header>

			<div class="modal-cards">
				{#each selectedDay.events as ev (ev.id)}
					{@render eventCard(ev)}
				{/each}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');

	// ── Hero (full-screen placeholder PSG video, PSG-mirrored layout) ─────────────
	.schedule-hero {
		position: relative;
		// Full-width via the (gutter-less) .app-main wrapper — NOT 100vw, which
		// includes the vertical scrollbar's width and caused horizontal overflow.
		width: 100%;
		height: 100svh;
		// Pull the hero UP to y=0, cancelling the layout's .nav-offset spacer, so the
		// video fills the whole viewport with the fixed transparent navbar over it.
		margin-top: calc(-1 * var(--nav-h, 64px));
		overflow: hidden;
		// Gradient fallback shown until/if the video can't load.
		background: linear-gradient(135deg, $navy 0%, #07142e 100%);
	}
	.schedule-hero-video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.schedule-hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.55) 100%);
	}

	// Text block — bottom-left (PSG): logo, two-tier title, subtitle.
	.schedule-hero-inner {
		position: absolute;
		left: 0;
		bottom: 0;
		max-width: 1610px;
		padding: 0 clamp(1.5rem, 4vw, 4.5rem) clamp(2.5rem, 7vh, 6rem);
		color: #fff;
	}
	.schedule-hero-logo {
		display: block;
		height: clamp(40px, 5vw, 64px);
		width: auto;
		margin-bottom: 1.25rem;
		filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.5));
	}
	.schedule-hero-title {
		margin: 0;
		display: flex;
		flex-direction: column;
		line-height: 0.92;
		text-transform: uppercase;
		letter-spacing: 0.01em;
		text-shadow: 0 2px 22px rgba(0, 0, 0, 0.45);
		font-size: clamp(3.2rem, 9vw, 8rem);
	}
	// First word: thin/outline weight. Second: heavy. (PSG "PLAY / ZONE".)
	.schedule-hero-title .thin {
		font-weight: 200;
	}
	.schedule-hero-title .bold {
		font-weight: 800;
	}
	.schedule-hero-sub {
		margin: 1rem 0 0;
		font-size: clamp(0.85rem, 1.1vw, 1.05rem);
		font-weight: 700;
		letter-spacing: 0.04em;
		text-shadow: 0 1px 10px rgba(0, 0, 0, 0.5);
	}

	// Scroll-down arrow — bottom-right, inside a square corner-bracket frame (PSG).
	.schedule-hero-scroll {
		position: absolute;
		right: clamp(1.5rem, 4vw, 4.5rem);
		bottom: clamp(2.5rem, 7vh, 6rem);
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		background: transparent;
		border: 1.5px solid rgba(255, 255, 255, 0.85);
		cursor: pointer;
		color: #fff;
		animation: hero-bob 2s ease-in-out infinite;
		transition: background-color 0.2s ease;
	}
	.schedule-hero-scroll:hover {
		background: rgba(255, 255, 255, 0.15);
	}
	@keyframes hero-bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(5px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.schedule-hero-scroll {
			animation: none;
		}
	}

	// ── Calendar section ─────────────────────────────────────────────────────────
	.kalendar {
		background: #f3f3f3;
		color: var(--color-ink-dark);
	}
	.kalendar-inner {
		// OPTION 1: widened so the calendar keeps its old ~1280px and the rail sits
		// to its RIGHT (1280 + 2.5rem gap + 400 rail ≈ 1720).
		max-width: 1720px;
		margin: 0 auto;
		// Reduced top padding so the calendar + right rail fit on screen below the hero.
		padding: clamp(3rem, 6vw, 5rem) clamp(1rem, 3vw, 2rem) 5rem;
	}

	// Two columns on desktop: calendar (left, keeps old width) + side rail (right).
	.kalendar-layout {
		display: grid;
		grid-template-columns: minmax(0, 1280px) 400px;
		justify-content: center;
		gap: 2.5rem;
		align-items: start;
	}
	.kalendar-main {
		min-width: 0; // let the grid shrink instead of overflowing
	}
	.kalendar-side {
		// Scrolls away with the page (NOT sticky/fixed) like normal content.
		display: flex;
		flex-direction: column;
		gap: 0; // legend carries its own bottom margin to match the month-nav row
	}

	// Legend — horizontal row at the TOP of the right column, sized to the same
	// height as the calendar's month/year nav row to its left (42px tall + the same
	// 1.5rem margin-bottom), so the cards panel below lines up with the grid.
	.legend {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1.1rem;
		min-height: 42px;
		margin-bottom: 1.5rem;
	}
	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.95rem;
		font-weight: 500;
		color: $navy;
	}
	.legend-dot {
		width: 12px;
		height: 12px;
		flex: none;
		// circle via .br-full utility
	}

	// Selected-day events panel (desktop). Cards stack in a column, 1.5rem gap,
	// scrolls if more than fits. Hidden ≤1024px (the modal is used there instead).
	.side-events {
		display: flex;
		flex-direction: column;
		// Gives the empty-state hint room to sit centered; also a stable panel size.
		min-height: 280px;
	}
	.side-events-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}
	.side-events-head h3 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: $navy;
		text-transform: capitalize;
	}
	.side-events-cards {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		// Scrollable area, shorter than the full viewport so it doesn't run the whole
		// screen height; the list scrolls internally while the rail stays sticky.
		max-height: calc(100svh - var(--nav-h, 64px) - 16rem);
		overflow-y: auto;
		// Right gap to the scrollbar = the column gap (2.5rem); bottom padding so the
		// last card isn't flush against the bottom; left padding so cards (and their
		// box-shadow) aren't flush against the panel's left edge.
		padding: 0.5rem 2.5rem 1.5rem 0.75rem;

		// Custom scrollbar: thin thumb only, coloured the sponsor div bg
		// (--color-footer #081530) — no track/background, no up/down arrow buttons.
		// NB: we use the WebKit pseudo-element model here (NOT `scrollbar-width`),
		// because setting `scrollbar-width` switches Chrome/Edge to the standard
		// scrollbar and then IGNORES `::-webkit-scrollbar*` — including our rule that
		// hides the arrow buttons. So the thinness comes from ::-webkit-scrollbar.
		&::-webkit-scrollbar {
			width: 6px;
		}
		&::-webkit-scrollbar-track {
			background: transparent;
		}
		&::-webkit-scrollbar-thumb {
			background: var(--color-footer);
			border-radius: 999px;
			cursor: pointer;
		}
		// Remove the forced up/down arrow buttons (WebKit user-agent stylesheet).
		&::-webkit-scrollbar-button {
			display: none;
			height: 0;
			width: 0;
		}
	}
	.side-events-hint {
		flex: 1; // fill the panel so the text can center within it
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		margin: 0;
		font-size: 0.9rem;
		font-weight: 300;
		color: map.get(lib.$colors, 'jet-grey');
	}

	// Month nav — ‹  lipanj 2026  ›, centered.
	.month-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}
	.month-title {
		margin: 0;
		min-width: 11ch;
		text-align: center;
		font-size: clamp(1.4rem, 2.5vw, 1.9rem);
		font-weight: 700;
		letter-spacing: 0.01em;
		color: $navy;
		text-transform: capitalize; // Intl returns lowercase Croatian month names
	}
	.month-arrow {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border: 1px solid rgba(16, 46, 102, 0.25);
		background: #fff;
		color: $navy;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			opacity 0.15s ease;
	}
	.month-arrow:hover:not(:disabled) {
		background: rgba(16, 46, 102, 0.06);
		border-color: rgba(16, 46, 102, 0.5);
	}
	.month-arrow:disabled {
		opacity: 0.3;
		cursor: default;
	}

	// ── Grid ─────────────────────────────────────────────────────────────────────
	$grid-line: rgba(16, 46, 102, 0.1);

	.grid {
		border-top: 1px solid $grid-line;
	}
	// Month-switch animation: the keyed .weeks block flies in/out directionally.
	// Both old+new .weeks briefly co-exist during the transition; stacking them in
	// ONE grid cell (the viewport) keeps them overlaid with no vertical layout jump.
	// overflow:hidden clips the horizontal slide so it doesn't spill sideways.
	.weeks-viewport {
		display: grid;
		overflow: hidden;
	}
	.weeks-viewport > .weeks {
		grid-area: 1 / 1; // every .weeks occupies the same cell → overlaid
	}
	.weekday-row,
	.week {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}
	.weekday {
		padding: 0.6rem 0.75rem;
		text-align: right;
		font-size: 0.8rem;
		font-weight: 600;
		color: map.get(lib.$colors, 'jet-grey');
		text-transform: capitalize;
	}

	.cell {
		// Fixed height → every day cell is identical, NEVER scrolls. The "+N više"
		// chip absorbs any overflow beyond MAX_VISIBLE events.
		min-height: 116px;
		padding: 0.4rem 0.5rem 0.5rem;
		background: #fff; // white tiles on the #f3f3f3 section
		border-bottom: 1px solid $grid-line;
		border-right: 1px solid $grid-line;
		overflow: hidden;
		cursor: pointer; // whole day field is clickable
		transition: background-color 0.15s ease;
	}
	.cell:nth-child(7n + 1) {
		border-left: 1px solid $grid-line;
	}
	.cell.out-month {
		background: #fafafa; // faintly dimmed vs in-month white
	}
	.cell.out-month .cell-day {
		opacity: 0.35;
	}
	// ── Cell states ──────────────────────────────────────────────────────────────
	// today  = light RED (small opacity), so it reads as "today" without being the
	//          selected day. Other days have no idle tint.
	// hover  = BLUE at the hover opacity (today hovers RED instead).
	// selected (clicked day) = BLUE at a STRONGER opacity; if the selected day IS
	//          today, it's RED at that SAME stronger opacity (not blue).
	$cell-blue: map.get(lib.$colors, 'blue-dress'); // #187ff5
	$cell-red: #e60023; // Državno red
	$hover-op: 0.12;
	$select-op: 0.22;

	.cell.today {
		background: rgba($cell-red, 0.08);
	}
	// Hover — blue for normal days, red for today. Placed before .selected so a
	// selected day's stronger tint still wins when it's also hovered.
	.cell:hover {
		background: rgba($cell-blue, $hover-op);
	}
	.cell.today:hover {
		background: rgba($cell-red, $hover-op);
	}
	// Selected (clicked) day — stronger blue; today-selected = stronger red instead.
	// Last + higher specificity so it wins over hover.
	.cell.selected,
	.cell.selected:hover {
		background: rgba($cell-blue, $select-op);
	}
	.cell.today.selected,
	.cell.today.selected:hover {
		background: rgba($cell-red, $select-op);
	}
	.cell-day {
		display: block;
		text-align: right;
		font-size: 0.8rem;
		font-weight: 600;
		color: $navy;
		margin-bottom: 0.3rem;
	}

	.cell-events {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	// Event row: colored dot + single-line, ellipsised title.
	.event {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		padding: 0.1rem 0.15rem;
		border-radius: 4px;
		text-align: left;
	}
	.event-dot {
		width: 7px;
		height: 7px;
		flex: none;
	}
	.event-name {
		font-size: 0.78rem;
		line-height: 1.25;
		color: var(--color-ink-dark);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.event.cancelled .event-name {
		text-decoration: line-through;
		opacity: 0.55;
	}
	.event-more {
		align-self: flex-start;
		margin-top: 0.05rem;
		padding: 0.05rem 0.3rem;
		background: rgba(16, 46, 102, 0.07);
		border-radius: 4px;
		font-size: 0.72rem;
		font-weight: 600;
		color: $navy;
	}

	// ── Day modal (RM-style cards) ───────────────────────────────────────────────
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(8, 18, 40, 0.55);
		backdrop-filter: blur(2px);
	}
	.modal-panel {
		width: 100%;
		max-width: 380px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		background: #fff;
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
	}
	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(16, 46, 102, 0.1);
	}
	.modal-head h3 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: $navy;
		text-transform: capitalize;
	}
	.modal-close {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: none;
		background: rgba(16, 46, 102, 0.06);
		color: $navy;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}
	.modal-close:hover {
		background: rgba(16, 46, 102, 0.14);
	}
	.modal-cards {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		overflow-y: auto;
	}

	// One RM-style event card. No overflow:hidden — the body needs to overlap up
	// onto the navy band (RM look), which clipping would cut off.
	.ev-card {
		// radius via the library .br-md utility (12px) on the markup; box-shadow/
		// gradient/grid stay scoped (utilities can't express them).
		box-shadow: 0 0 16px rgba(16, 46, 102, 0.12);
		cursor: pointer;
		// Column so the body can stretch to equal heights across a row/carousel.
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.ev-card-body {
		flex: 1; // fill the card → all bodies in a row reach the tallest one's height
	}
	.ev-card.cancelled {
		opacity: 0.7;
	}
	// Navy header band (RM look): scope icon + level name in a ROW. Kept short
	// (less than half the white body's height) via tight vertical padding.
	.ev-card-head {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		// Symmetric left/right padding → the icon+label group sits centered with
		// EQUAL space on both sides. Extra bottom padding for the body's overlap.
		padding: 2.95rem 1.25rem 3.35rem;
		border-radius: 12px 12px 0 0;
		background: $navy;
	}
	.ev-scope {
		display: inline-flex;
		// color set inline (level colour) → the currentColor SVG tints to it.
		// Stronger white glow (RM lit-up look) + a faint dark shadow for depth.
		filter: drop-shadow(0 0 7px rgba(255, 255, 255, 0.65))
			drop-shadow(0 0 14px rgba(255, 255, 255, 0.4))
			drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
	}
	.ev-level {
		font-size: 1.55rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		text-align: center;
		line-height: 1.15;
		// Wrap between words when too long (e.g. "Europsko prvenstvo" → two rows);
		// shorter labels ("Svjetski kup", "Državno", "Domaće") stay on one row since
		// they fit. min-width:0 lets the flex item shrink so wrapping kicks in instead
		// of the text overflowing the band.
		min-width: 0;
		// Subtle white glow behind the text (RM-style lit-up look on the navy band).
		text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
	}
	// Body — #f8f8f8, rounded top, pulled UP so it overlaps onto the navy band
	// (RM "card sitting on top of the blue" look).
	.ev-card-body {
		position: relative;
		margin-top: -0.9rem; // overlap up onto the navy head
		padding: 1.25rem; // equal padding on all 4 sides
		background: #f8f8f8;
		border-radius: 14px 14px 12px 12px; // rounded top (overlap) + bottom (card base)
	}
	.ev-cat {
		margin: 0 0 0.15rem;
		font-size: 0.78rem;
		color: map.get(lib.$colors, 'jet-grey');
	}
	.ev-name {
		margin: 0 0 2.1rem;
		font-size: 1.15rem;
		font-weight: 700;
		color: $navy;
		line-height: 1.25;
	}
	.ev-cancelled-tag {
		display: inline-block;
		margin: 0 0 0.6rem;
		padding: 0.1rem 0.5rem;
		border-radius: 4px;
		background: rgba(230, 0, 35, 0.1);
		color: #e60023;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.ev-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 1rem 0 0;
		font-size: 0.97rem;
		font-weight: 600;
		line-height: 1.4; // more space between wrapped lines (e.g. participants list)
		color: var(--color-ink-dark);
	}
	.ev-row :global(svg) {
		color: map.get(lib.$colors, 'jet-grey');
		flex: none;
	}
	.ev-more {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.85rem;
		font-size: 0.9rem;
		font-weight: 700;
		color: map.get(lib.$colors, 'blue-dress');
		text-decoration: none;
	}
	.ev-more:hover {
		text-decoration: underline;
	}

	// ── Responsive: phone/tablet (≤1024px) use the centered modal; the right-column
	//    side panel is desktop-only. Above 1024px the modal never shows. ───────────
	// DESKTOP (>1024px): hide the modal entirely (cards go in the side panel).
	@media (min-width: 1025px) {
		.modal-backdrop {
			display: none;
		}
	}
	// PHONE/TABLET (≤1024px): single column; legend on top, no side-events panel
	// (the modal is used instead). Legend goes back to a horizontal wrap.
	@media (max-width: 1024px) {
		.kalendar-layout {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		.kalendar-side {
			position: static;
			order: -1; // legend above the calendar
		}
		.legend {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 1rem 1.5rem;
		}
		.side-events {
			display: none; // events shown via the modal on small screens
		}
	}

	// ── View toggle (left edge) ──────────────────────────────────────────────────
	.kalendar-main {
		position: relative; // anchor the left-edge toggle
		// Stack the month/year panes in ONE grid cell so the scale+fade swap doesn't
		// shift layout while both briefly co-exist during the transition.
		display: grid;
	}
	.view-pane {
		grid-area: 1 / 1;
		min-width: 0;
	}
	.view-toggle {
		position: absolute;
		left: -1.25rem;
		top: 0;
		transform: translateX(-100%);
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 10px;
		border: 1px solid rgba(16, 46, 102, 0.2);
		background: #fff;
		color: $navy;
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease;
	}
	.view-toggle:hover {
		background: rgba(16, 46, 102, 0.06);
		border-color: rgba(16, 46, 102, 0.45);
	}

	// ── Year view (12 mini-month grids) ──────────────────────────────────────────
	// Year title row — same placement as the month-nav in month view (centered, same
	// height + bottom gap), so "2026" sits where the month selector is.
	.year-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 42px;
		margin-bottom: 1.5rem;
	}
	.year-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem 1.25rem;
	}
	.mini-month {
		background: #fff;
		border: 1px solid $grid-line;
		border-radius: 10px;
		padding: 0.75rem;
	}
	.mini-month-title {
		display: block;
		width: 100%;
		margin: 0 0 0.5rem;
		padding: 0.15rem 0;
		background: none;
		border: none;
		text-align: center;
		font-size: 0.95rem;
		font-weight: 700;
		color: $navy;
		text-transform: capitalize;
		cursor: pointer;
		border-radius: 6px;
		transition: background-color 0.15s ease;
	}
	.mini-month-title:hover {
		background: rgba(24, 127, 245, 0.1);
	}
	.mini-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
	}
	.mini-weekday {
		text-align: center;
		font-size: 0.6rem;
		font-weight: 600;
		color: map.get(lib.$colors, 'jet-grey');
		padding-bottom: 0.2rem;
	}
	.mini-cell {
		position: relative;
		aspect-ratio: 1;
		display: grid;
		place-items: center;
		font-size: 0.7rem;
		color: var(--color-ink-dark);
	}
	.mini-cell.out-month .mini-day {
		opacity: 0.3;
	}
	.mini-cell.has-events {
		cursor: pointer;
	}
	// The conic/solid event dot sits BEHIND the day number (filled circle).
	.mini-dot {
		position: absolute;
		inset: 1px;
	}
	.mini-cell.has-events .mini-day {
		position: relative;
		z-index: 1;
		font-weight: 700;
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
	}
	.mini-cell.today:not(.has-events) {
		box-shadow: inset 0 0 0 1.5px #e60023; // today ring (red) when no events
	}

	@media (max-width: 1024px) {
		.year-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.view-toggle {
			position: static;
			transform: none;
			margin-bottom: 1rem;
		}
	}
	@media (max-width: 560px) {
		.year-grid {
			grid-template-columns: 1fr;
		}
	}

	// ── Upcoming / This-month event blocks ───────────────────────────────────────
	// Same bg as the calendar section (#f3f3f3).
	.events-block {
		background: #f3f3f3;
	}
	.events-inner {
		// Wide enough that 4 carousel cards show FULLY with a comfortable width each.
		max-width: 1560px;
		margin: 0 auto;
		padding: clamp(2.5rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem);
	}
	// Big shared title over both sub-sections.
	.block-title {
		margin: 0 0 2rem;
		font-size: clamp(2.2rem, 5vw, 3.4rem);
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.01em;
		color: $navy;
	}
	.events-sub + .events-sub {
		margin-top: clamp(2.5rem, 5vw, 4rem);
	}
	.sub-heading {
		margin: 0 0 1.25rem;
		font-size: clamp(1.2rem, 2.5vw, 1.6rem);
		font-weight: 800; // bumped from 700 (+100)
		color: $navy;
	}
	// "Ovaj mjesec" only — slightly larger than the shared sub-heading.
	.sub-heading.month-heading {
		font-size: clamp(1.35rem, 2.7vw, 1.8rem);
	}
	.sub-dates {
		font-weight: 400;
		color: map.get(lib.$colors, 'jet-grey');
	}
	.events-empty {
		margin: 0;
		color: map.get(lib.$colors, 'jet-grey');
		font-weight: 300;
	}

	// "Upcoming" — a simple wrapping row of cards.
	.events-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}
	.events-row > .reveal-item {
		width: 348px;
		max-width: 100%;
	}
	// Card fills its reveal-item wrapper (row + carousel). The fade/slide itself comes
	// from the shared global `.reveal`/`.reveal--in` (src/lib/actions/reveal.ts +
	// index.scss); `.reveal-item` here is only a layout hook.
	.reveal-item > :global(.ev-card) {
		width: 100%;
	}

	// "This month" — horizontal carousel + side arrows centered vertically.
	.carousel {
		position: relative;
	}
	.carousel-track {
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		padding: 0.5rem 0 1rem;
		scrollbar-width: none; // hide native bar; arrows drive it
		&::-webkit-scrollbar {
			display: none;
		}
	}
	.carousel-item {
		// Exactly 4 cards fully in view: a quarter of the track minus the 3 gaps.
		flex: 0 0 calc((100% - 3 * 1.5rem) / 4);
		scroll-snap-align: start;
	}
	.carousel-arrow {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10; // stay above the cards (incl. on card hover)
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border: 1px solid rgba(16, 46, 102, 0.2);
		background: #fff;
		color: $navy;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(16, 46, 102, 0.12);
		// No hover style change (per request).
	}
	.carousel-arrow.left {
		left: -1.25rem;
	}
	.carousel-arrow.right {
		right: -1.25rem;
	}
	// Fewer cards per view on smaller screens.
	@media (max-width: 1024px) {
		.carousel-item {
			flex-basis: calc((100% - 1.5rem) / 2); // 2 per view
		}
	}
	@media (max-width: 600px) {
		.carousel-item {
			flex-basis: 85%; // ~1 per view
		}
	}

	.news-block {
		background: #f3f3f3;
	}
	// Same extra space above "Najnovije vijesti" as the archer page ($sp*5 = 5rem).
	.news-block :global(.news-roster) {
		padding-top: 5rem;
	}
</style>
