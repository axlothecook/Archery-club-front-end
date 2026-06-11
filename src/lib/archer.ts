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
