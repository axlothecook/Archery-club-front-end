// Map an event LEVEL to its geographic scope icon (globe / Europe / Croatia).
//
// IMPORTANT: key off the level's COLOR (a stable, locale-independent field), NOT its
// `name` — `name` is flattened to the active locale by the read API, so matching on
// "Svjetski kup" silently returns no icon in EN mode (the i18n regression this fixes).
// Colours come from seed-data/event-levels.json (the canonical legend palette):
//   #FFD400 world (Svjetski kup) · #00ade6 european (Europsko prvenstvo)
//   #E60023 state (Državno)      · #8E44AD local (Domaće)
import type { Component } from 'svelte';
import type { EventLevelResolved } from 'archery-contracts';
import GlobeRecordIcon from '$lib/components/icons/GlobeRecordIcon.svelte';
import EuropeRecordIcon from '$lib/components/icons/EuropeRecordIcon.svelte';
import CroatiaRecordIcon from '$lib/components/icons/CroatiaRecordIcon.svelte';

export function scopeIcon(level: EventLevelResolved | null): Component | null {
	if (!level) return null;
	switch (level.color.toUpperCase()) {
		case '#FFD400': // Svjetski kup (world)
			return GlobeRecordIcon;
		case '#00ADE6': // Europsko prvenstvo (european)
			return EuropeRecordIcon;
		case '#E60023': // Državno (state)
		case '#8E44AD': // Domaće (local)
			return CroatiaRecordIcon;
		default:
			return null;
	}
}
