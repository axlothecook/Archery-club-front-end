import type { Bow } from 'archery-contracts';

// Croatian labels for the three bow styles. Shared by the team roster, the archer
// profile page and the news-article "U ovom članku" cards so the wording stays in
// one place.
export const BOW_LABEL: Record<Bow, string> = {
	recurve: 'Klasični luk',
	compound: 'Složeni luk',
	barebow: 'Goli luk'
};

// The roster grid is split into sections by PRIMARY bow (bowType[0]); render them
// in this fixed order. Archers with no bow (coach-only) are handled separately.
export const BOW_ORDER: Bow[] = ['recurve', 'compound', 'barebow'];

// An archer's display label = their primary bow's Croatian name ('' if coach-only).
export function bowLabel(bows: Bow[]): string {
	return bows[0] ? BOW_LABEL[bows[0]] : '';
}

// Per-archer photo scale for the roster CARD (ArcherCard, bottom-anchored). Each
// source headshot frames the figure differently, so the figure size is tuned per
// slug. 1 = default; >1 enlarges, <1 shrinks. Anyone not listed = 1. SHARED so the
// SAME scale is used everywhere a card renders (roster grid AND the archer profile's
// coaches/"Trenira" rows) — otherwise figures sit at different heights between pages.
export const ARCHER_CARD_SCALE: Record<string, number> = {
	'amanda-mlinaric': 1.32,
	'leo-sulik': 1.2,
	'zoran-velagic': 1.32,
	'mija-mance': 1.35,
	'tomislav-mlinaric': 1.32,
	'mila-vrbesic': 1.2,
	'nikola-portner-pavicevic': 1.05,
	'ela-drozdek': 1.12,
	'alen-remar': 1.0,
	'mia-medimurec': 0.85,
	'filip-bistricic': 0.85,
	'nicole-bratonja': 0.97,
	'aurelia-mlinaric': 0.85,
	'jakov-crnicki': 0.85,
	'bojan-rodik': 0.85,
	'luka-ciglaric': 0.97,
	'tena-mikolaj': 0.85,
	'leda-crncec': 0.97,
	'karmen-ahmetovic': 1.15,
	'rafael-barulek': 1.15,
	'cvijetoslav-zorman': 1.05
};
