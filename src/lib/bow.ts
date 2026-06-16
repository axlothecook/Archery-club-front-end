// Shared bow data — used by BOTH the individual archer page (/momcad/[slug]) and the
// homepage "Lukovi najboljih streličara" section. One source of truth (DRY).
//
//  • BOW_INFO  — per bow TYPE: the type title (heading), the specific demo MODEL name, and
//                that model's description (from the manufacturer's official copy, in
//                Croatian). The description is the SAME on both pages; only the INTRO
//                sentence above it differs (homepage demo vs per-archer on the archer page).
//  • BOW_MODEL — the interactive 3D model (glTF in static/models) per type + CC attribution.
//  • BOW_DEMO  — homepage-only INTRO sentence per type (a demo: a named club archer "uses"
//                the model). The archer page builds its own intro per-archer instead.

export type BowType = 'recurve' | 'compound' | 'barebow';

// title = bow-type name (heading) · model = the specific demo bow model · body = that
// model's description (translated from the manufacturer's official text).
export const BOW_INFO: Record<BowType, { title: string; model: string; body: string }> = {
	compound: {
		title: 'Složeni luk',
		model: 'Mathews TITLE 38',
		body: 'TITLE 38 jedan je od najboljih ciljnih lukova ikad napravljenih za natjecateljskog streličara. Njegova Limb Shift tehnologija prvi je takav sustav podešavanja koji omogućuje mikro-podešavanje kraka bez rastavljanja luka. Bridge-Lock karbonske ciljne šipke daju čvršću vezu s lukom uz do 36% manji otpor vjetru, dok BOND rukohvat s teksturiranom gumenom površinom pruža vrhunsku anatomsku udobnost. Razmak osovina iznosi 38″, a brzina doseže do 330 fps.'
	},
	recurve: {
		title: 'Klasični luk',
		model: 'WIAWIS ATF-DX',
		body: 'ATF-DX donosi iste prigušivače kao i ručka META-DX, čime se učinkovito smanjuje titranje nastalo udarom u trenutku ispucavanja i nepotrebno gibanje luka, što pomaže boljem grupiranju strijela. Anatomski oblikovan rukohvat daje ugodan osjećaj u ruci i povećava stabilnost. Pločice rešta podesive su u 4 razine prema strijelama i podešavanju luka.'
	},
	barebow: {
		title: 'Goli luk',
		model: 'Gillo GX2 27″',
		body: 'Gillo GX2 ručka izrađena je od visokokvalitetnog aluminija 7075 s nehrđajućim okovom. Plutajući ležajevi krakova omogućuju podešavanje jakosti do 30%, a integrirani prigušivači smanjuju titranje. Uz napredan tanki 3D rukohvat i malu masu (oko 1210 g), nudi vrhunske značajke po pristupačnoj cijeni i pogodna je i početnicima i iskusnim streličarima.'
	}
};

// Bow-type label used in the archer-page intro for a SECOND bow type ("...te također puca
// u kategoriji golog luka"). Genitive case to follow "u kategoriji".
export const BOW_CATEGORY_GENITIVE: Record<BowType, string> = {
	recurve: 'klasičnog luka',
	compound: 'složenog luka',
	barebow: 'golog luka'
};

// 3D bow model per type (glTF in static/models). `credit` is the required CC attribution
// shown under the viewer. Recurve, compound and barebow each have their OWN model now.
export type BowModel = {
	url: string;
	credit: { author: string; url: string; license: string };
	// Optional orientation fix (radians, [x, y, z] Euler) applied to the loaded model so
	// every bow stands upright in the viewer, regardless of how it was authored. Most
	// models ship vertical (no fix needed); some (e.g. the Sengchor barebow) ship lying
	// horizontal and need a quarter-turn about Z to stand up.
	fixRotation?: [number, number, number];
	// Optional vertical nudge (world units) applied AFTER centering, to fine-tune where the
	// model sits in the viewer box. Negative = lower it. Default 0 (centred).
	yOffset?: number;
	// Auto-spin direction: 1 = default, -1 = reversed (clockwise). Default 1.
	spinDir?: number;
};

const RECURVE_MODEL: BowModel = {
	url: '/models/recurve.glb',
	credit: {
		author: 'MrEliptik',
		url: 'https://sketchfab.com/3d-models/recurve-bow-800fb9f4eb224cedb1c8e0b9847bd00c',
		license: 'CC BY 4.0'
	},
	// This model ships lying HORIZONTAL (handle across the screen → thin top-down line).
	// A quarter-turn about Z stands the handle vertical so it shows its full side profile
	// (matches how the compound/barebow present), then the spinner rotates it about Y.
	fixRotation: [0, 0, Math.PI / 2],
	// Spin clockwise (opposite the compound).
	spinDir: -1
};

export const BOW_MODEL: Record<BowType, BowModel> = {
	compound: {
		url: '/models/compound.glb',
		credit: {
			author: 'Wade_Kenny',
			url: 'https://sketchfab.com/3d-models/compound-bow-c559a06ab84644abb47637cde93471bd',
			license: 'CC BY-NC 4.0'
		}
	},
	recurve: RECURVE_MODEL,
	barebow: {
		// Distinct from the recurve model — a clean recurve (no sight/stabilisers) reads as
		// a barebow. Sketchfab "Recurve Bow" by Sengchor, CC BY.
		url: '/models/recurve_bow.glb',
		credit: {
			author: 'Sengchor',
			url: 'https://sketchfab.com/3d-models/recurve-bow-6cfcb941316b4ac5a5ba11952c205950',
			license: 'CC BY 4.0'
		},
		// Ships lying HORIZONTAL — quarter-turn about Z stands it upright, plus a quarter-turn
		// about Y so its face points at the camera and it spins like the compound/recurve.
		fixRotation: [0, Math.PI / 2, Math.PI / 2],
		// Sits a touch high in the box — nudge it down.
		yOffset: -0.6,
		// Spin clockwise (opposite the compound).
		spinDir: -1
	}
};

// Homepage DEMO: a specific real competition bow per type (the club's best archer of that
// type "uses" it). Shown as a demo — NOT real archers' actual equipment. Drives only the
// homepage intro sentence; the description stays BOW_INFO.
export const BOW_DEMO: Record<BowType, { intro: string }> = {
	recurve: {
		intro: 'Alen Remar pucao je za Europske igre s modelom WIAWIS ATF-DX klasičnog luka.'
	},
	compound: {
		intro:
			'Model složenog luka Mathews TITLE 38 luk je kojim Amanda Mlinarić puca već nekoliko mjeseci.'
	},
	barebow: {
		intro:
			'Klubsko ime koje dođe na um kad se spomenu 3D turniri, Zoran Velagić, puca Gillo GX2 27″ lukom.'
	}
};

// Display order on the homepage (recurve, compound, barebow).
export const BOW_HOME_ORDER: BowType[] = ['recurve', 'compound', 'barebow'];
