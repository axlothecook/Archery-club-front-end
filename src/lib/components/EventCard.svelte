<script lang="ts">
	// RM-style event card (navy header band with a scope icon + level name; white body
	// with category, name, date, location, attendees, and a "Više" source link). Extracted
	// from the schedule page so the homepage's "upcoming events" teaser can reuse it (DRY).
	import type { ClubEventResolved, EventLevelResolved } from 'archery-contracts';
	import type { Component } from 'svelte';
	import GlobeRecordIcon from '$lib/components/icons/GlobeRecordIcon.svelte';
	import EuropeRecordIcon from '$lib/components/icons/EuropeRecordIcon.svelte';
	import CroatiaRecordIcon from '$lib/components/icons/CroatiaRecordIcon.svelte';
	import CalendarIcon from '$lib/components/icons/CalendarIcon.svelte';
	import LocationIcon from '$lib/components/icons/LocationIcon.svelte';
	import PersonIcon from '$lib/components/icons/PersonIcon.svelte';
	import ChevronIcon from '$lib/components/icons/ChevronIcon.svelte';

	let { ev }: { ev: ClubEventResolved } = $props();

	const NEUTRAL_COLOR = '#888888'; // level-less events ("Ostalo")

	// Legend colour for an event: its resolved level colour, else neutral.
	const eventColor = (e: ClubEventResolved): string => e.level?.color ?? NEUTRAL_COLOR;

	// Scope icon by level (globe = world, Europe = european, Croatia = state/domestic).
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

	const HR_LONG = new Intl.DateTimeFormat('hr-HR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
	const HR_SHORT = new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'long' });

	// "7. ožujka 2026." or, for a range, "7. – 8. ožujka 2026."
	function eventDateLabel(e: ClubEventResolved): string {
		const from = new Date(e.dateFrom);
		if (!e.dateTo) return HR_LONG.format(from);
		const to = new Date(e.dateTo);
		return `${HR_SHORT.format(from)} – ${HR_LONG.format(to)}`;
	}

	const Scope = $derived(scopeIcon(ev.level));
</script>

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

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');

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
		padding: 2.95rem 1.25rem 3.35rem;
		border-radius: 12px 12px 0 0;
		background: $navy;
	}
	.ev-scope {
		display: inline-flex;
		// color set inline (level colour) → the currentColor SVG tints to it.
		filter: drop-shadow(0 0 7px rgba(255, 255, 255, 0.65))
			drop-shadow(0 0 14px rgba(255, 255, 255, 0.4)) drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
	}
	.ev-level {
		font-size: 1.55rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		text-align: center;
		line-height: 1.15;
		min-width: 0;
		text-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
	}
	// Body — #f8f8f8, rounded top, pulled UP so it overlaps onto the navy band.
	.ev-card-body {
		flex: 1; // fill the card → all bodies in a row reach the tallest one's height
		position: relative;
		margin-top: -0.9rem;
		padding: 1.25rem;
		background: #f8f8f8;
		border-radius: 14px 14px 12px 12px;
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
		line-height: 1.4;
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
</style>
