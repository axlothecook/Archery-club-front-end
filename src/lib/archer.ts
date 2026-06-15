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

// ── Per-archer RosterCard tuning (SHARED) ────────────────────────────────────────
// RosterCard reads per-archer framing from CSS vars its PARENT sets on the card wrapper.
// These maps are the ONE source of truth so a card looks IDENTICAL wherever it renders:
// the momcad roster grid AND the archer page's coach ("Treneri") / student ("Trenira")
// rows. (The bow FLIP direction lives inside RosterCard itself, keyed by slug + bowLeft.)
//   FIG_SCALE      → --fig-scale     : desktop figure scale (default 1.3 in the card)
//   PHONE_SCALE    → --phone-scale   : phone contained-photo scale (default 1)
//   PHONE_BOW_X/Y  → --phone-bow-x/y : phone bow-watermark shift (negative x = LEFT)
//   PHONE_BOW_SCALE→ --phone-bow-scale: phone bow-watermark size
//   FIG_OFFSET     → --photo-nudge   : vertical photo nudge (negative = lift UP)
//   BOW_NUDGE      → --bow-nudge      : extra horizontal bow nudge (negative = LEFT)
export const FIG_SCALE: Record<string, number> = {
	'amanda-mlinaric': 1.65,
	'tomislav-mlinaric': 1.55,
	'cvijetoslav-zorman': 1.65,
	'rafael-barulek': 1.55,
	'mija-mance': 1.4,
	'leda-crncec': 1.55,
	'nikola-portner-pavicevic': 1.55
};
export const PHONE_SCALE: Record<string, number> = {
	'amanda-mlinaric': 1.45,
	'alen-remar': 1.1,
	'leo-sulik': 1.35,
	'zoran-velagic': 1.35,
	'ela-drozdek': 1.35,
	'mija-mance': 1.5,
	'mila-vrbesic': 1.35,
	'nikola-portner-pavicevic': 1.15,
	'nicole-bratonja': 1.2,
	'tomislav-mlinaric': 1.35,
	'karmen-ahmetovic': 1.35,
	'rafael-barulek': 1.35,
	'cvijetoslav-zorman': 1.35,
	'leda-crncec': 1.1,
	'bojan-rodik': 1.2
};
export const PHONE_BOW_X: Record<string, string> = {
	'amanda-mlinaric': '-18%',
	'alen-remar': '28%',
	'leo-sulik': '28%',
	'zoran-velagic': '22%',
	'ela-drozdek': '28%',
	'mila-vrbesic': '14%',
	'jakov-crnicki': '28%',
	'leda-crncec': '28%',
	'karmen-ahmetovic': '28%',
	'filip-bistricic': '28%',
	'nicole-bratonja': '-28%',
	'bojan-rodik': '-22%',
	'luka-ciglaric': '-28%',
	'tena-mikolaj': '-22%',
	'mija-mance': '-22%',
	'mia-medimurec': '-22%',
	'tomislav-mlinaric': '-22%',
	'rafael-barulek': '-22%',
	'nikola-portner-pavicevic': '22%',
	'aurelia-mlinaric': '22%'
};
export const PHONE_BOW_Y: Record<string, string> = {
	'amanda-mlinaric': '-8%'
};
export const PHONE_BOW_SCALE: Record<string, number> = {
	'amanda-mlinaric': 2.1
};
export const FIG_OFFSET: Record<string, string> = {
	'bojan-rodik': '0rem',
	'cvijetoslav-zorman': '2.1rem'
};
export const BOW_NUDGE: Record<string, string> = {
	'karmen-ahmetovic': '1.8rem',
	'zoran-velagic': '1.8rem'
};

// Archers whose hover BOW image emerges on the LEFT (default is RIGHT). The first-name
// watermark then sits on the OPPOSITE wall automatically. Shared so the Momčad roster and
// the archer page's coach/Trenira cards keep each archer on the SAME side.
export const BOW_LEFT = new Set<string>([
	'amanda-mlinaric',
	'mia-medimurec',
	'tena-mikolaj',
	'luka-ciglaric',
	'bojan-rodik',
	'rafael-barulek',
	'mija-mance',
	'nicole-bratonja',
	'tomislav-mlinaric'
]);
