// Shared bow data — used by BOTH the individual archer page (/momcad/[slug]) and the
// homepage "Lukovi najboljih strelicara" section. One source of truth (DRY).
//
//  • BOW_INFO  — title + factual description per bow type (World Archery equipment
//                definitions). The description is the SAME on both pages.
//  • BOW_MODEL — the interactive 3D model (glTF in static/models) per bow type, with the
//                required CC licence attribution shown under the viewer.
//  • BOW_DEMO  — homepage-only: a specific real competition bow per type, shown as a DEMO
//                (the club's best archer of that type "uses" it). This drives only the
//                INTRO sentence on the homepage; the description body stays BOW_INFO.

export type BowType = 'recurve' | 'compound' | 'barebow';

export const BOW_INFO: Record<BowType, { title: string; body: string }> = {
	compound: {
		title: 'Složeni luk',
		body: 'Složeni luk koristi sustav ekscentričnih koloturnika (kamova) i kabela na krajevima krakova, što ga čini mehanički najučinkovitijim i najpreciznijim tipom luka. Zahvaljujući tom sustavu, na punom zatezanju dolazi do popuštanja sile pa streličar drži znatno manju težinu i može dulje i mirnije ciljati. Nišani se kroz nišan s povećalom (od dva do osam puta) i libelom, a okida posebnim mehaničkim okidačem za čist i ujednačen ispust tetive.'
	},
	recurve: {
		title: 'Klasični luk',
		body: 'Klasični (olimpijski) luk prepoznatljiv je po krakovima koji se na vrhovima savijaju unatrag, od streličara, po čemu je i dobio ime. To je luk kojim se nastupa na Olimpijskim igrama. Opremljen je nišanom bez povećala te stabilizatorima, dugim i kratkim šipkama i prigušivačima, koji uravnotežuju luk i smanjuju vibracije. Streličar zateže tetivu prstima do lica, koristi klikericu za kontrolu dužine zatezanja i ispušta tetivu otvaranjem prstiju.'
	},
	barebow: {
		title: 'Goli luk',
		body: 'Goli luk je osnovni oblik klasičnog luka izrađen od istih suvremenih materijala, ali bez pomagala za ciljanje i stabilizaciju. Nema nišan, stabilizatore ni klikericu. Streličar cilja gledajući niz strijelu, a udaljenost često prilagođava položajem prstiju na tetivi (tzv. hodanje po tetivi). Takav nastup traži iznimnu dosljednost i kontrolu, posebno u ponavljanju jednake dužine zatezanja jer nema mehaničkih pomagala.'
	}
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
};

const RECURVE_MODEL: BowModel = {
	url: '/models/recurve.glb',
	credit: {
		author: 'MrEliptik',
		url: 'https://sketchfab.com/3d-models/recurve-bow-800fb9f4eb224cedb1c8e0b9847bd00c',
		license: 'CC BY 4.0'
	}
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
		// This model ships lying HORIZONTAL — quarter-turn about Z to stand it upright like
		// the other bows.
		fixRotation: [0, 0, Math.PI / 2]
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
