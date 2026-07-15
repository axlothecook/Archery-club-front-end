// Static-UI-string translations.
//
// DB content (article bodies, achievement titles, archer bios, sponsor text, …)
// is translated by the BACKEND via `?locale=` and is NOT here. This file holds the
// STATIC strings that live in component markup — nav, headings, buttons, form
// labels, empty-states, errors — so they switch with the locale too.
//
// USAGE in a component:
//   import { t } from '$lib/i18n';
//   import { page } from '$app/stores';     // (Svelte 5: $app/state `page` also fine)
//   $: locale = $page.data.locale;          // resolved server-side, no flash
//   ... {t(locale, 'nav.team')} ...
//
// hr is the SOURCE locale; an English value falls back to the hr value if missing,
// so a not-yet-translated key still renders (in Croatian) rather than blank.

import { DEFAULT_LOCALE, type Locale } from '$lib/locale';

// One entry per UI string. Keys are dotted by area (`nav.*`, `footer.*`, …) and are
// STABLE — they don't change when the wording does, so components never reference
// Croatian text directly. Add a key here, then call t(locale, 'the.key') in markup.
type Dict = Record<string, string>;

const hr: Dict = {
	// Club name (the visible brand wordmark + page-title suffix). The proper name is
	// Croatian; in EN the club uses the English form "Varaždin Archery Club".
	'clubName': 'Varaždinski streličarski klub',

	// ── NavBar ──────────────────────────────────────────────────────────────
	'nav.openMenu': 'Otvori meni',
	'nav.menu': 'Meni',
	'nav.home': 'Naslovnica',
	'nav.clubSections': 'Sekcije kluba',
	'nav.login': 'Prijava',
	// Primary + section nav links (keyed by destination, not by label text)
	'nav.team': 'Momčad',
	'nav.news': 'Vijesti',
	'nav.schedule': 'Raspored',
	'nav.achievements': 'Postignuća',
	'nav.sponsors': 'Sponzori',
	'nav.identity': 'Identitet',
	'nav.history': 'Povijest',
	'nav.contact': 'Kontakt',
	'nav.crest': 'Grb',
	'nav.jersey': 'Dres',
	'nav.values': 'Vrijednosti',

	// ── Half-screen menu ────────────────────────────────────────────────────
	'menu.main': 'Glavni izbornik',
	'menu.close': 'Zatvori izbornik',
	'menu.back': 'Natrag',

	// ── Footer ──────────────────────────────────────────────────────────────
	'footer.backToTop': 'Natrag na vrh',
	'footer.colClub': 'Klub',
	'footer.colAboutClub': 'O klubu',
	'footer.colServices': 'Usluge',
	'footer.membership': 'Učlanjenje',
	'footer.sponsorship': 'Sponzorstvo',
	'footer.donation': 'Donacija',
	'footer.legalTerms': 'Pravni uvjeti',
	'footer.privacy': 'Pravila privatnosti',
	'footer.cookies': 'Kolačići',
	'footer.sitemap': 'Karta stranice',

	// ── Homepage ────────────────────────────────────────────────────────────
	'home.news': 'Vijesti',
	'home.allNews': 'Sve vijesti',
	'home.upcoming': 'Nadolazeće',
	'home.schedule': 'Raspored',
	'home.achHonour': 'Ponos hrvatskog streličarstva',
	'home.allAchievements': 'Sva postignuća',
	'home.clubAchievements': 'Postignuća kluba',
	'home.bestBows': 'Lukovi najboljih streličara',
	'home.bowType': 'Tip luka',
	'home.showImage': 'Prikaži sliku', // suffixed with the image number
	'home.previous': 'Prethodno',
	'home.next': 'Sljedeće',
	'home.heroAlt': 'Pregled kandidata za naslovnu',
	'home.tagline': 'Hrvatski streličarski klub iz Varaždina, koji puca za svijet od 2014.',
	'home.joinTitlePre': 'Postani dio',
	'home.joinTitleAccent': 'kluba',
	'home.joinSub': 'Pridruži se Varaždinskom streličarskom klubu.',
	'home.joinType': 'Početnici su dobrodošli.',
	'home.joinBtn': 'Registriraj se',
	// Achievement stat labels (genitive plural — read after a count)
	'home.statWorldTitles': 'Svjetskih naslova',
	'home.statEuropeanTitles': 'Europskih naslova',
	'home.statNationalTitles': 'Državnih naslova',
	'home.statWorldRecords': 'Svjetskih rekorda',
	'home.statEuropeanRecords': 'Europskih rekorda',
	'home.statNationalRecords': 'Državnih rekorda',
	'home.seoDesc':
		'Varaždinski streličarski klub (VSK), natjecateljski streličarski klub iz Varaždina. Pratite vijesti, raspored natjecanja, momčad i postignuća kluba.',

	// ── Schedule (/raspored) ──────────────────────────────────────────────────
	'sched.heroSub': 'Natjecanja na kojima nastupaju streličari kluba',
	'sched.scrollTo': 'Pomakni na raspored',
	'sched.viewYear': 'Godišnji prikaz',
	'sched.viewMonth': 'Mjesečni prikaz',
	'sched.prevMonth': 'Prethodni mjesec',
	'sched.nextMonth': 'Sljedeći mjesec',
	'sched.more': 'više', // "+ 3 više"
	'sched.pickDay': 'Odaberite dan za prikaz događaja.',
	'sched.upcoming': 'Nadolazeće',
	'sched.thisWeek': 'Ovaj tjedan',
	'sched.thisMonth': 'Ovaj mjesec',
	'sched.noWeek': 'Nema događaja ovaj tjedan.',
	'sched.noMonth': 'Nema događaja ovaj mjesec.',
	'sched.clubMembers': 'Članovi kluba',
	'sched.andOthers': 'i ostali članovi kluba',
	'sched.moreLink': 'Više',
	'sched.events': 'Događaji',
	'sched.close': 'Zatvori',
	'sched.levelOther': 'Ostalo',
	'sched.archery': 'Streličarstvo',
	'sched.cancelled': 'Otkazano',
	'sched.seoDesc':
		'Raspored natjecanja na kojima nastupaju streličari Varaždinskog streličarskog kluba.',

	// ── News (/najnovije) + NewsCarousel ──────────────────────────────────────
	'news.heroTitle': 'Najnovije',
	'news.heroSub': 'Vijesti, rezultati i događanja iz kluba.',
	'news.empty': 'Trenutno nema objava.',
	'news.signupAria': 'Pretplata na vijesti',
	'news.signupTitle': 'Pretplati se na vijesti',
	'news.email': 'E-mail',
	'news.emailPlaceholder': 'Unesite e-mail',
	'news.phoneOptional': 'Telefon (neobavezno)',
	'news.phone': 'Telefon',
	'news.postal': 'Poštanski broj',
	'news.subscribe': 'Pretplati se',
	'news.moreHeading': 'Više vijesti',
	'news.loadFailed': 'Učitavanje nije uspjelo.',
	'news.loading': 'Učitavam…',
	'news.more': 'Više',
	'news.featuredAria': 'Istaknute vijesti',
	'news.prev': 'Prethodna',
	'news.next': 'Sljedeća',
	'news.readMore': 'Pročitaj više',
	'news.seoDesc':
		'Najnovije vijesti Varaždinskog streličarskog kluba: rezultati, natjecanja i događanja.',
	// Newsletter disclaimer (inert placeholder; link to privacy policy is rendered inline)
	'news.disclaimerBefore':
		'Davanjem svog broja telefona pristajem da mi Varaždinski streličarski klub putem Community usluge šalje vijesti i ponude na navedeni broj te prihvaćam ',
	'news.disclaimerLink': 'Pravila privatnosti',
	'news.disclaimerAfter':
		' Varaždinskog streličarskog kluba. Odgovorite HELP za pomoć. U svakom trenutku možete se odjaviti slanjem poruke STOP. Napomena: ovo nije stvarni newsletter, služi isključivo za potrebe osobnog projekta.',

	// ── Roster (/momcad) ──────────────────────────────────────────────────────
	'roster.title': 'Momčad',
	'roster.empty': 'Popis članova uskoro će biti dostupan.',
	'roster.filterByBow': 'Filtriraj po luku',
	'roster.all': 'Svi',
	'roster.coaches': 'Treneri',
	'roster.seoDesc':
		'Streličari i treneri Varaždinskog streličarskog kluba: upoznajte našu momčad.',
	// Bow type labels (also the roster filter labels). English archery terms.
	'bow.recurve': 'Klasični luk',
	'bow.compound': 'Složeni luk',
	'bow.barebow': 'Goli luk',

	// ── Archer profile (/momcad/[slug]) ───────────────────────────────────────
	'pf.personalDetails': 'Osobni podaci',
	'pf.name': 'Ime',
	'pf.age': 'Dob',
	'pf.years': 'godina', // "24 godina"
	'pf.gender': 'Spol',
	'pf.male': 'Muški',
	'pf.female': 'Ženski',
	'pf.category': 'Kategorija',
	'pf.bowType': 'Vrsta luka',
	'pf.primaryRole': 'Primarna uloga',
	'pf.extraRoles': 'Dodatne uloge',
	'pf.roleCoach': 'Trener',
	'pf.roleArcher': 'Streličar',
	'pf.biography': 'Biografija',
	'pf.waProfile': 'World Archery profil',
	'pf.achievements': 'Postignuća',
	'pf.statsOrResults': 'Statistika ili rezultati',
	'pf.statsByYear': 'Statistika po godinama',
	'pf.results': 'Rezultati',
	'pf.colYear': 'Godina',
	'pf.colDiscipline': 'Disciplina',
	'pf.colAverage': 'Prosjek',
	'pf.colWins': 'Pobjede',
	'pf.colLosses': 'Porazi',
	'pf.colBest': 'Najbolji',
	'pf.colDate': 'Datum',
	'pf.colCompetition': 'Natjecanje',
	'pf.colType': 'Vrsta',
	'pf.colCategories': 'Kategorije',
	'pf.colPlacing': 'Plasman',
	'pf.colPoints': 'Bodovi',
	'pf.scopeDomestic': 'Domaće',
	'pf.scopeGlobal': 'Međunarodno',
	'pf.typeOutdoor': 'Vanjsko',
	'pf.typeIndoor': 'Dvoransko',
	'pf.typeField': 'Terensko',
	'pf.type3d': '3D',
	'pf.bowTitleMale': 'Njegov luk',
	'pf.bowTitleFemale': 'Njezin luk',
	'pf.trains': 'Trenira',
	'pf.medalsSuffix': 'medalje', // appended to a medal-achievement card title
	'pf.coachedBy': 'Trenira ovaj trener', // overridden by the gendered derived form below
	'pf.prev': 'Prethodni',
	'pf.next': 'Sljedeći',

	// ── Achievements (/postignuca) ────────────────────────────────────────────
	'ach.title': 'Postignuća',
	'ach.empty': 'Postignuća će uskoro biti dostupna.',
	'ach.seoDesc':
		'Postignuća Varaždinskog streličarskog kluba: svjetski, europski i državni naslovi i rekordi.',
	'ach.intro':
		'Malo je klubova u Hrvatskoj koji su osvojili toliko naslova. Najveći ponos kluba ostaju 6 svjetskih i 8 europskih naslova, među kojima se ističu obranjeno svjetsko juniorsko zlato (2019. i 2021.), tri uzastopne pobjede na Conquest Cupu (od 2024. do 2026.) te tri naslova u Indoor World Seriesu.',

	// ── Sponsors (/sponzori) ──────────────────────────────────────────────────
	'spon.seoTitle': 'Partneri',
	'spon.seoDesc':
		'Službeni partneri i sponzori Varaždinskog streličarskog kluba. Pridružite se i podržite naše streličare.',
	'spon.title': 'Službeni partneri',
	'spon.join': 'Pridružite se',
	'spon.partnersAria': 'Partneri',
	'spon.empty': 'Popis partnera uskoro će biti dostupan.',
	'spon.honoraryAria': 'Počasno priznanje',
	'spon.honoraryHeading': 'Počasno priznanje',
	'spon.heroText':
		'Varaždinski streličarski klub poznat je po svojoj predanosti i izvrsnosti, s dosljednim uspjesima na svjetskim i državnim natjecanjima, te njegovanom zajednicom u kojoj napreduju i početnici i iskusni streličari. Ovo poticajno okruženje duboko je povezano s velikodušnom podrškom partnera, čiji doprinosi osiguravaju vrhunsku opremu, jačaju natjecateljsku snagu kluba, te učvršćuju zajedničku predanost promicanju sporta i razvoju talenata.',
	'spon.honoraryQuote':
		'Nećemo zaboraviti prijateljsku gestu Općine Vidovec na čelu s gospodinom Hranićem te Osnovne škole Vidovec s ravnateljem gospodinom Mašićem, koji su nam ustupili prijeko potreban prostor za zimske treninge. Još jednom, veliko hvala svima u ime osnivača i streličara Varaždinskog streličarskog kluba. Opravdat ćemo vaše povjerenje!',

	// ── Identity / Values (/klub/identitet) ───────────────────────────────────
	'id.seoTitle': 'Identitet',
	'id.seoDesc': 'Identitet i vrijednosti Varaždinskog streličarskog kluba.',
	'id.valuesTitle': 'Vrijednosti',
	'id.heroTitle': 'Identitet',
	'id.tabsAria': 'Identitet kluba',
	'id.charterCaption': 'Olimpijska povelja',
	'id.olympicAlt': 'Olimpijski duh',
	'id.quote':
		'Bavljenje sportom je ljudsko pravo. Svakom pojedincu mora biti omogućeno bavljenje sportom, bez diskriminacije bilo koje vrste i u olimpijskom duhu, što zahtijeva obostrano razumijevanje u duhu prijateljstva, solidarnosti i fair playa.',
	'id.v1h': 'Sport je ljudsko pravo',
	'id.v1b':
		'Sport nije ničije vlasništvo. Bavljenje sportom je ljudsko pravo. Svakom pojedincu mora biti omogućeno kojom vrstom sporta se pojedinac želi baviti, odabir natjecanja na kojem želi sudjelovati, odabir kluba u kojem će trenirati, pravo na trenera s kojim on želi trenirati, pravo na tim čiji dio on želi biti. Pravo na prijatelje s kojima streličar želi dijeliti osmjehe nakon pobjede i koji će razumjeti zašto nakon takmičenja osoba plače.',
	'id.v2h': 'Bez diskriminacije',
	'id.v2b':
		'Bavljenje sportom mora biti omogućeno bez diskriminacije bilo koje vrste i u olimpijskom duhu, neovisno o rasi, boji kože, spolu, spolnoj orijentaciji, jeziku, vjeri, političkom ili drugom uvjerenju, nacionalnom ili socijalnom podrijetlu, imovini, rođenju ili drugom statusu.',
	'id.v3h': 'Prijateljstvo i solidarnost',
	'id.v3b':
		'Olimpijski duh zahtijeva obostrano razumijevanje u duhu prijateljstva i solidarnosti. U sportu Vam nitko ne može nametati svoju volju. Nitko Vas ne može prisiliti ni da budete u njemu, ako osjećate nelagodu. Ako trenirate bez volje, ako se ne osjećate kao dio tima, ako Vas okružuju ljudi s kojima Vam nije ugodno, maknite se, promijenite sport, klub, okolinu, krenite ispočetka. Oslobodite se. Sport je samo Vaš izbor.',
	'id.v4h': 'Poštena igra',
	'id.v4b':
		'Bavljenje sportom zahtijeva obostrano razumijevanje u duhu poštene igre i natjecanje u kojem rezultat nikada nije važniji od poštivanja pravila i suparnika. Pobjedu cijenimo, ali poraz prihvaćamo s jednakim poštovanjem, jer je prava vrijednost sportaša vidljiva u načinu na koji se nosi s oboje. U našem klubu njegujemo iskrenost, čestitost i međusobno poštovanje, na liniji i izvan nje.',

	// ── History (/klub/povijest) ──────────────────────────────────────────────
	'hist.seoTitle': 'Povijest',
	'hist.seoDesc': 'Povijest Varaždinskog streličarskog kluba kroz godine.',
	'hist.heading': 'Klub kroz godine',
	'hist.founderCaption': 'Osnivač Tomislav Mlinarić',
	'hist.founderQuote':
		'Varaždinski streličarski klub od svojeg osnutka ima svoje streličare u redovima reprezentacije i oni redovito donose izvanredne rezultate za klub i za Hrvatsku, što je sve posljedica odličnog rada u klubu te izuzetnog zalaganja samih streličara.',

	// ── Shared: SectionExplore ("you might also like" block) ──────────────────
	'explore.aria': 'Istraži klub',
	'explore.headStrong': 'MOŽDA', // bolded first word
	'explore.headRest': 'ĆE VAM SE SVIDJETI',

	// ── Bow descriptions + demo intros (homepage "Bows" + archer profile) ─────
	'bow.body.recurve':
		'ATF-DX donosi iste prigušivače kao i ručka META-DX, čime se učinkovito smanjuje titranje nastalo udarom u trenutku ispucavanja i nepotrebno gibanje luka, što pomaže boljem grupiranju strijela. Anatomski oblikovan rukohvat daje ugodan osjećaj u ruci i povećava stabilnost. Pločice rešta podesive su u 4 razine prema strijelama i podešavanju luka.',
	'bow.body.compound':
		'TITLE 38 jedan je od najboljih ciljnih lukova ikad napravljenih za natjecateljskog streličara. Njegova Limb Shift tehnologija prvi je takav sustav podešavanja koji omogućuje mikro-podešavanje kraka bez rastavljanja luka. Bridge-Lock karbonske ciljne šipke daju čvršću vezu s lukom uz do 36% manji otpor vjetru, dok BOND rukohvat s teksturiranom gumenom površinom pruža vrhunsku anatomsku udobnost. Razmak osovina iznosi 38″, a brzina doseže do 330 fps.',
	'bow.body.barebow':
		'Gillo GX2 ručka izrađena je od visokokvalitetnog aluminija 7075 s nehrđajućim okovom. Plutajući ležajevi krakova omogućuju podešavanje jakosti do 30%, a integrirani prigušivači smanjuju titranje. Uz napredan tanki 3D rukohvat i malu masu (oko 1210 g), nudi vrhunske značajke po pristupačnoj cijeni i pogodna je i početnicima i iskusnim streličarima.',
	'bow.demo.recurve':
		'Alen Remar pucao je za Europske igre s modelom WIAWIS ATF-DX klasičnog luka.',
	'bow.demo.compound':
		'Model složenog luka Mathews TITLE 38 luk je kojim Amanda Mlinarić puca već nekoliko mjeseci.',
	'bow.demo.barebow':
		'Klubsko ime koje dođe na um kad se spomenu 3D turniri, Zoran Velagić, puca Gillo GX2 27″ lukom.',

	// ── Contact (/kontakt) ────────────────────────────────────────────────────
	'k.title': 'Kontakt',
	'k.sub': 'Javite nam se za učlanjenje, suradnju ili podršku klubu.',
	'k.infoTitle': 'Varaždinski streličarski klub',
	'k.email': 'E-mail',
	'k.phone': 'Telefon',
	'k.address': 'Adresa',
	'k.oib': 'OIB',
	'k.tabMembership': 'Učlanjenje',
	'k.tabSponsor': 'Sponzorstvo',
	'k.tabDonation': 'Donacija',
	'k.successHeading': 'Hvala vam!',
	'k.successBody': 'Vaš upit je zaprimljen. Javit ćemo vam se uskoro.',
	'k.newInquiry': 'Pošalji novi upit',
	'k.introMembership': 'Pridružite se klubu i započnite svoj streličarski put.',
	'k.introSponsor': 'Postanite službeni partner kluba i podržite naše streličare.',
	'k.introDonation': 'Vaša donacija pomaže razvoju kluba i mladih streličara.',
	'k.fullName': 'Ime i prezime',
	'k.companyName': 'Naziv tvrtke',
	'k.fieldEmail': 'Email',
	'k.fieldPhone': 'Telefon',
	'k.experience': 'Streličarsko iskustvo',
	'k.experiencePlaceholder': 'npr. početnik, 2 godine…',
	'k.forMinor': 'Prijavljujem maloljetnu osobu',
	'k.minorDetails': 'Podaci o maloljetniku',
	'k.minorPlaceholder': 'ime i dob djeteta',
	'k.interest': 'Područje interesa',
	'k.interestPlaceholder': 'npr. oprema, dresovi, natjecanja',
	'k.message': 'Poruka',
	'k.consent': 'Slažem se da klub pohrani moje podatke radi odgovora na ovaj upit (GDPR).',
	'k.sending': 'Šaljem…',
	'k.submit': 'Pošalji upit',
	'k.sendFailed': 'Slanje nije uspjelo. Pokušajte ponovno.',

	// ── Shared: error page + loaders + modal ──────────────────────────────────
	'err.notFoundTitle': 'Stranica nije pronađena',
	'err.genericTitle': 'Nešto je pošlo po zlu',
	'err.notFoundMsg': 'Stranica koju tražite ne postoji ili je premještena.',
	'err.genericMsg': 'Dogodila se pogreška. Pokušajte ponovno kasnije.',
	'err.backHome': 'Povratak na početnu',
	'loader.loading': 'Učitavanje',

	// Article media-type category labels (phone news cards) + news roster heading
	'media.event': 'DOGAĐAJ',
	'media.gallery': 'GALERIJA',
	'media.video': 'VIDEO',
	'media.externalLink': 'VANJSKA POVEZNICA',
	'nr.headingStrong': 'Najnovije',
	'nr.headingRest': 'vijesti',
	'nr.aria': 'Najnovije vijesti',
	'nr.tag': 'Najnovije',

	// ── NewsCoverflow arrows ──────────────────────────────────────────────────
	'cf.prev': 'Prethodna vijest',
	'cf.next': 'Sljedeća vijest',

	// ── Article detail (/najnovije/[slug]) ────────────────────────────────────
	'post.viewOnFacebook': 'Pogledaj na Facebooku',
	'post.inThisArticle': 'U ovom članku',
	'post.share': 'Podijeli članak',
	'post.close': 'Zatvori',
	'post.linkToArticle': 'Poveznica na članak',
	'post.copy': 'Kopiraj',
	'post.copied': 'Kopirano!',

	// ── Default site meta (root layout fallback) ──────────────────────────────
	'meta.defaultDesc':
		'Varaždinski streličarski klub (VSK), natjecateljski streličarski klub iz Varaždina. Vijesti, raspored natjecanja, momčad i postignuća.',

	// ── Chapter detail (/klub/povijest/[slug]) ────────────────────────────────
	'chap.related': 'Povezano s ovim člankom',
	'chap.relatedStrong': 'POVEZANO',
	'chap.relatedRest': 'S OVIM ČLANKOM',

	// ── Sitemap (/karta-stranice) ─────────────────────────────────────────────
	'site.title': 'Karta stranice',
	'site.sub': 'Pregled svih stranica na web stranici.',
	'site.groupHome': 'Početna',
	'site.home': 'Naslovnica',

	// ── Legal pages (titles + intros + disclaimer + prose) ────────────────────
	'legal.disclaimerBefore':
		'Napomena: ovo je osobni projekt, a ne službena stranica kluba. Gornji tekst je općenit predložak i nije pravno provjeren. Za stvarna pravna pitanja obratite se klubu putem ',
	'legal.disclaimerLink': 'kontakt stranice',
	'legal.disclaimerAfter': '.',
	'legal.cookiesTitle': 'Kolačići',
	'legal.cookiesIntro': 'Korištenje kolačića na ovoj web stranici.',
	'legal.privacyTitle': 'Pravila privatnosti',
	'legal.privacyIntro': 'Kako prikupljamo i koristimo osobne podatke.',
	'legal.termsTitle': 'Pravni uvjeti',
	'legal.termsIntro': 'Uvjeti korištenja web stranice.',
	// Cookie sections
	'legal.c1h': 'Što su kolačići',
	'legal.c1b':
		'Kolačići (cookies) su male tekstualne datoteke koje web stranica pohranjuje na vaš uređaj kako bi stranica ispravno radila te kako bi se zapamtile vaše postavke prilikom posjeta.',
	'legal.c2h': 'Koje kolačiće koristimo',
	'legal.c2b':
		'Ova stranica koristi prvenstveno nužne kolačiće potrebne za osnovno funkcioniranje (primjerice pamćenje sesije i postavki prikaza). Ne koristimo kolačiće za oglašavanje.',
	'legal.c3h': 'Upravljanje kolačićima',
	'legal.c3b':
		'Kolačiće možete u svakom trenutku obrisati ili blokirati putem postavki svog web preglednika. Napominjemo da onemogućavanje nekih kolačića može utjecati na funkcionalnost stranice.',
	// Privacy sections
	'legal.p1h': 'Koje podatke prikupljamo',
	'legal.p1b':
		'Prikupljamo samo podatke koje nam dobrovoljno dostavite, primjerice putem kontakt obrasca (ime, adresa e-pošte, telefon i poruka). Stranica ne traži osjetljive osobne podatke.',
	'legal.p2h': 'Svrha obrade',
	'legal.p2b':
		'Dostavljene podatke koristimo isključivo kako bismo odgovorili na vaš upit, obradili zahtjev za učlanjenje, suradnju ili donaciju te vas po potrebi kontaktirali. Podatke ne koristimo u druge svrhe bez vašeg pristanka.',
	'legal.p3h': 'Dijeljenje podataka',
	'legal.p3b':
		'Vaše osobne podatke ne prodajemo niti ustupamo trećim stranama u marketinške svrhe. Podaci se mogu dijeliti samo ako to zahtijeva zakon ili je nužno za obradu vašeg zahtjeva.',
	'legal.p4h': 'Čuvanje podataka',
	'legal.p4b':
		'Podatke čuvamo samo onoliko dugo koliko je potrebno za ostvarenje svrhe za koju su prikupljeni, nakon čega ih brišemo ili anonimiziramo.',
	'legal.p5h': 'Vaša prava',
	'legal.p5b':
		'U skladu s Općom uredbom o zaštiti podataka (GDPR) imate pravo na pristup svojim podacima, njihov ispravak, brisanje te prigovor na obradu. Za ostvarivanje tih prava obratite nam se putem kontakt stranice.',
	// Terms sections
	'legal.t1h': 'Prihvaćanje uvjeta',
	'legal.t1b':
		'Pristupanjem ovoj web stranici i njezinim korištenjem prihvaćate ove uvjete korištenja u cijelosti. Ako se ne slažete s bilo kojim dijelom ovih uvjeta, molimo da ne koristite stranicu.',
	'legal.t2h': 'Korištenje sadržaja',
	'legal.t2b1':
		'Sadržaj na ovoj stranici (tekstovi, slike, logotipi i ostali materijali) namijenjen je informativnoj uporabi. Sadržaj se ne smije umnožavati, distribuirati ni koristiti u komercijalne svrhe bez prethodnog dopuštenja nositelja prava.',
	'legal.t2b2':
		'Trudimo se da informacije budu točne i ažurne, no ne jamčimo da su bez pogrešaka niti da su u svakom trenutku potpune.',
	'legal.t3h': 'Poveznice na druge stranice',
	'legal.t3b':
		'Stranica može sadržavati poveznice na vanjske web stranice nad kojima nemamo kontrolu. Ne preuzimamo odgovornost za sadržaj, dostupnost ni politike tih stranica.',
	'legal.t4h': 'Ograničenje odgovornosti',
	'legal.t4b':
		'Korištenje stranice je na vlastitu odgovornost. U najvećoj mjeri dopuštenoj zakonom ne odgovaramo za bilo kakvu izravnu ili neizravnu štetu nastalu korištenjem ili nemogućnošću korištenja stranice.',
	'legal.t5h': 'Izmjene uvjeta',
	'legal.t5b':
		'Zadržavamo pravo izmjene ovih uvjeta u bilo kojem trenutku. Izmjene stupaju na snagu objavom na ovoj stranici, pa preporučujemo povremenu provjeru.'
};

// English overrides. Anything missing here falls back to the hr value above.
const en: Dict = {
	'clubName': 'Varaždin Archery Club',

	// ── NavBar ──────────────────────────────────────────────────────────────
	'nav.openMenu': 'Open menu',
	'nav.menu': 'Menu',
	'nav.home': 'Home',
	'nav.clubSections': 'Club sections',
	'nav.login': 'Log in',
	'nav.team': 'Team',
	'nav.news': 'News',
	'nav.schedule': 'Schedule',
	'nav.achievements': 'Achievements',
	'nav.sponsors': 'Sponsors',
	'nav.identity': 'Identity',
	'nav.history': 'History',
	'nav.contact': 'Contact',
	'nav.crest': 'Crest',
	'nav.jersey': 'Jersey',
	'nav.values': 'Values',

	// ── Half-screen menu ────────────────────────────────────────────────────
	'menu.main': 'Main menu',
	'menu.close': 'Close menu',
	'menu.back': 'Back',

	// ── Footer ──────────────────────────────────────────────────────────────
	'footer.backToTop': 'Back to top',
	'footer.colClub': 'Club',
	'footer.colAboutClub': 'About the club',
	'footer.colServices': 'Services',
	'footer.membership': 'Membership',
	'footer.sponsorship': 'Sponsorship',
	'footer.donation': 'Donation',
	'footer.legalTerms': 'Terms',
	'footer.privacy': 'Privacy policy',
	'footer.cookies': 'Cookies',
	'footer.sitemap': 'Sitemap',

	// ── Homepage ────────────────────────────────────────────────────────────
	'home.news': 'News',
	'home.allNews': 'All news',
	'home.upcoming': 'Upcoming',
	'home.schedule': 'Schedule',
	'home.achHonour': 'The pride of Croatian archery',
	'home.allAchievements': 'All achievements',
	'home.clubAchievements': 'Club achievements',
	'home.bestBows': 'The bows of our best archers',
	'home.bowType': 'Bow type',
	'home.showImage': 'Show image',
	'home.previous': 'Previous',
	'home.next': 'Next',
	'home.heroAlt': 'Cover candidate preview',
	'home.tagline': 'A Croatian archery club from Varaždin, shooting for the world since 2014.',
	'home.joinTitlePre': 'Become part of the',
	'home.joinTitleAccent': 'club',
	'home.joinSub': 'Join the Varaždin Archery Club.',
	'home.joinType': 'Beginners are welcome.',
	'home.joinBtn': 'Sign up',
	// Achievement stat labels (plural — read after a count)
	'home.statWorldTitles': 'World titles',
	'home.statEuropeanTitles': 'European titles',
	'home.statNationalTitles': 'National titles',
	'home.statWorldRecords': 'World records',
	'home.statEuropeanRecords': 'European records',
	'home.statNationalRecords': 'National records',
	'home.seoDesc':
		'Varaždin Archery Club (VSK), a competitive archery club from Varaždin, Croatia. Follow the club’s news, competition schedule, team and achievements.',

	// ── Schedule (/raspored) ──────────────────────────────────────────────────
	'sched.heroSub': 'Tournaments our archers compete in',
	'sched.scrollTo': 'Scroll to schedule',
	'sched.viewYear': 'Per year',
	'sched.viewMonth': 'Per month',
	'sched.prevMonth': 'Previous month',
	'sched.nextMonth': 'Next month',
	'sched.more': 'more',
	'sched.pickDay': 'Select a day to see its events.',
	'sched.upcoming': 'Upcoming',
	'sched.thisWeek': 'This week',
	'sched.thisMonth': 'This month',
	'sched.noWeek': 'No events this week.',
	'sched.noMonth': 'No events this month.',
	'sched.clubMembers': 'Club members',
	'sched.andOthers': 'and other club members',
	'sched.moreLink': 'More',
	'sched.events': 'Events',
	'sched.close': 'Close',
	'sched.levelOther': 'Other',
	'sched.archery': 'Archery',
	'sched.cancelled': 'Cancelled',
	'sched.seoDesc':
		'The tournament schedule for the archers of Varaždin Archery Club.',

	// ── News (/najnovije) + NewsCarousel ──────────────────────────────────────
	'news.heroTitle': 'Latest',
	'news.heroSub': 'News, results and events from the club.',
	'news.empty': 'No posts yet.',
	'news.signupAria': 'Newsletter subscription',
	'news.signupTitle': 'Subscribe to our news',
	'news.email': 'Email',
	'news.emailPlaceholder': 'Enter your email',
	'news.phoneOptional': 'Phone (optional)',
	'news.phone': 'Phone',
	'news.postal': 'Postal code',
	'news.subscribe': 'Subscribe',
	'news.moreHeading': 'More news',
	'news.loadFailed': 'Loading failed.',
	'news.loading': 'Loading…',
	'news.more': 'More',
	'news.featuredAria': 'Featured news',
	'news.prev': 'Previous',
	'news.next': 'Next',
	'news.readMore': 'Read more',
	'news.seoDesc':
		'The latest news from Varaždin Archery Club: results, competitions and events.',
	'news.disclaimerBefore':
		'By providing my phone number I agree that Varaždin Archery Club may send me news and offers at that number via its Community service, and I accept the ',
	'news.disclaimerLink': 'Privacy policy',
	'news.disclaimerAfter':
		' of Varaždin Archery Club. Reply HELP for help. You can opt out at any time by sending STOP. Note: this is not a real newsletter; it exists only for the purposes of a personal project.',

	// ── Roster (/momcad) ──────────────────────────────────────────────────────
	'roster.title': 'Team',
	'roster.empty': 'The member list will be available soon.',
	'roster.filterByBow': 'Filter by bow',
	'roster.all': 'All',
	'roster.coaches': 'Coaches',
	'roster.seoDesc':
		'Archers and coaches of Varaždin Archery Club: meet our team.',
	'bow.recurve': 'Recurve',
	'bow.compound': 'Compound',
	'bow.barebow': 'Barebow',

	// ── Archer profile (/momcad/[slug]) ───────────────────────────────────────
	'pf.personalDetails': 'Personal details',
	'pf.name': 'Name',
	'pf.age': 'Age',
	'pf.years': 'years',
	'pf.gender': 'Gender',
	'pf.male': 'Male',
	'pf.female': 'Female',
	'pf.category': 'Category',
	'pf.bowType': 'Bow type',
	'pf.primaryRole': 'Primary role',
	'pf.extraRoles': 'Additional roles',
	'pf.roleCoach': 'Coach',
	'pf.roleArcher': 'Archer',
	'pf.biography': 'Biography',
	'pf.waProfile': 'World Archery profile',
	'pf.achievements': 'Achievements',
	'pf.statsOrResults': 'Statistics or results',
	'pf.statsByYear': 'Statistics by year',
	'pf.results': 'Results',
	'pf.colYear': 'Year',
	'pf.colDiscipline': 'Discipline',
	'pf.colAverage': 'Average',
	'pf.colWins': 'Wins',
	'pf.colLosses': 'Losses',
	'pf.colBest': 'Best',
	'pf.colDate': 'Date',
	'pf.colCompetition': 'Competition',
	'pf.colType': 'Type',
	'pf.colCategories': 'Categories',
	'pf.colPlacing': 'Placing',
	'pf.colPoints': 'Points',
	'pf.scopeDomestic': 'Domestic',
	'pf.scopeGlobal': 'International',
	'pf.typeOutdoor': 'Outdoor',
	'pf.typeIndoor': 'Indoor',
	'pf.typeField': 'Field',
	'pf.type3d': '3D',
	'pf.bowTitleMale': 'His bow',
	'pf.bowTitleFemale': 'Her bow',
	'pf.trains': 'Coaches',
	'pf.medalsSuffix': 'medals',
	'pf.coachedBy': 'Coached by',
	'pf.prev': 'Previous',
	'pf.next': 'Next',

	// ── Achievements (/postignuca) ────────────────────────────────────────────
	'ach.title': 'Achievements',
	'ach.empty': 'Achievements will be available soon.',
	'ach.seoDesc':
		'Achievements of Varaždin Archery Club: world, European and national titles and records.',
	'ach.intro':
		'There are few clubs in Croatia that have won so many titles. The club\'s greatest pride remains 6 world and 8 European titles, among which the most notable are the defended world junior gold (2019 and 2021), three consecutive victories at the Conquest Cup (from 2024 to 2026), and three titles in the Indoor World Series.',

	// ── Sponsors (/sponzori) ──────────────────────────────────────────────────
	'spon.seoTitle': 'Partners',
	'spon.seoDesc':
		'Official partners and sponsors of Varaždin Archery Club. Join us and support our archers.',
	'spon.title': 'Official partners',
	'spon.join': 'Join us',
	'spon.partnersAria': 'Partners',
	'spon.empty': 'The partner list will be available soon.',
	'spon.honoraryAria': 'Honorary mention',
	'spon.honoraryHeading': 'Honorary mention',
	'spon.heroText':
		'Varaždin Archery Club is known for its dedication and excellence, with consistent success at world and national competitions, and a nurturing community where both beginners and experienced archers thrive. This nurturing environment is deeply connected to the generous support of partners, whose contributions provide top-notch equipment, strengthen the club\'s competitive strength, and solidify a shared commitment to promoting the sport and developing talent.',
	'spon.honoraryQuote':
		'We will not forget the friendly gesture of the Vidovec Municipality, headed by Mr. Hranić, and the Vidovec Elementary School, with its principal Mr. Mašić, who gave us the much-needed space for winter training. Once again, a big thank you to everyone on behalf of the founders and archers of the Varaždin Archery Club. We will justify your trust!',

	// ── Identity / Values (/klub/identitet) ───────────────────────────────────
	'id.seoTitle': 'Identity',
	'id.seoDesc': 'The identity and values of Varaždin Archery Club.',
	'id.valuesTitle': 'Values',
	'id.heroTitle': 'Identity',
	'id.tabsAria': 'Club identity',
	'id.charterCaption': 'Olympic Charter',
	'id.olympicAlt': 'The Olympic spirit',
	'id.quote':
		'Playing sports is a human right. Every individual must be able to practice sports, without discrimination of any kind and in the Olympic spirit, which requires mutual understanding in the spirit of friendship, solidarity and fair play.',
	'id.v1h': 'Sport is a human right',
	'id.v1b':
		'Sport is no one\'s property. Playing sports is a human right. Every individual must be allowed to choose the type of sport they want to play, choose the competition they want to participate in, choose the club they want to train in, the right to the coach they want to train with, the right to the team they want to be a part of. The right to friends with whom the archer wants to share smiles after a victory and who will understand why a person cries after a competition.',
	'id.v2h': 'No discrimination',
	'id.v2b':
		'The practice of sport must be possible without discrimination of any kind and in the Olympic spirit, regardless of race, colour, sex, sexual orientation, language, religion, political or other belief, national or social origin, property, birth or other status.',
	'id.v3h': 'Friendship and solidarity',
	'id.v3b':
		'The Olympic spirit requires mutual understanding in the spirit of friendship and solidarity. In sport, no one can impose their will on you. No one can force you to be in it, even if you feel uncomfortable. If you train without will, if you don\'t feel like part of the team, if you are surrounded by people you are not comfortable with, move away, change the sport, the club, the environment, start over. Free yourself. Sport is only your choice.',
	'id.v4h': 'Fair play',
	'id.v4b':
		'Playing sports requires mutual understanding in the spirit of fair play and competition in which the result is never more important than respecting the rules and opponents. We value victory, but we accept defeat with equal respect, because the true value of an athlete is visible in the way he or she deals with both. In our club, we foster honesty, integrity and mutual respect, on and off the field.',

	// ── History (/klub/povijest) ──────────────────────────────────────────────
	'hist.seoTitle': 'History',
	'hist.seoDesc': 'The history of Varaždin Archery Club through the years.',
	'hist.heading': 'The club through the years',
	'hist.founderCaption': 'Founder Tomislav Mlinarić',
	'hist.founderQuote':
		'Since its founding, the Varaždin Archery Club has had its archers in the ranks of the national team, and they regularly bring outstanding results for the club and for Croatia, which is all a result of the excellent work in the club and the exceptional dedication of the archers themselves.',

	// ── Shared: SectionExplore ("you might also like" block) ──────────────────
	'explore.aria': 'Explore the club',
	'explore.headStrong': 'YOU',
	'explore.headRest': 'MIGHT ALSO LIKE',

	// ── Bow descriptions + demo intros (homepage "Bows" + archer profile) ─────
	'bow.body.recurve':
		'The ATF-DX features the same dampers as the META-DX handle, effectively reducing the vibration caused by the impact at the moment of shooting and unnecessary bow movement, which helps to better group the arrows. The anatomically shaped handle provides a comfortable feel in the hand and increases stability. The rest plates are adjustable in 4 levels according to the arrows and the bow setup.',
	'bow.body.compound':
		'The TITLE 38 is one of the best target bows ever made for the competitive archer. Its Limb Shift technology is the first of its kind adjustment system that allows for micro-adjustment of the limb without disassembling the bow. Bridge-Lock carbon target rods provide a stronger connection to the bow with up to 36% less wind resistance, while the BOND grip with a textured rubber surface provides superior anatomical comfort. The axle spacing is 38″ and the speed reaches up to 330 fps.',
	'bow.body.barebow':
		'The Gillo GX2 handle is made of high-quality 7075 aluminum with stainless hardware. Floating limb bearings allow for up to 30% strength adjustment, and integrated dampers reduce vibration. With an advanced slim 3D grip and a low weight (approx. 1210 g), it offers premium features at an affordable price and is suitable for both beginners and experienced archers.',
	'bow.demo.recurve':
		'Alen Remar shot for the European Games with the WIAWIS ATF-DX recurve bow model.',
	'bow.demo.compound':
		'The Mathews TITLE 38 compound bow model is the bow Amanda Mlinarić has been shooting with for several months.',
	'bow.demo.barebow':
		'The club name that comes to mind when 3D tournaments are mentioned, Zoran Velagić, shoots with a Gillo GX2 27″ bow.',

	// ── Contact (/kontakt) ────────────────────────────────────────────────────
	'k.title': 'Contact',
	'k.sub': 'Get in touch about membership, partnership or supporting the club.',
	'k.infoTitle': 'Varaždin Archery Club',
	'k.email': 'Email',
	'k.phone': 'Phone',
	'k.address': 'Address',
	'k.oib': 'Company ID (OIB)',
	'k.tabMembership': 'Membership',
	'k.tabSponsor': 'Sponsorship',
	'k.tabDonation': 'Donation',
	'k.successHeading': 'Thank you!',
	'k.successBody': 'Your inquiry has been received. We will get back to you soon.',
	'k.newInquiry': 'Send another inquiry',
	'k.introMembership': 'Join the club and begin your archery journey.',
	'k.introSponsor': 'Become an official partner of the club and support our archers.',
	'k.introDonation': 'Your donation helps the club and young archers grow.',
	'k.fullName': 'Full name',
	'k.companyName': 'Company name',
	'k.fieldEmail': 'Email',
	'k.fieldPhone': 'Phone',
	'k.experience': 'Archery experience',
	'k.experiencePlaceholder': 'e.g. beginner, 2 years…',
	'k.forMinor': 'I am registering a minor',
	'k.minorDetails': 'Minor’s details',
	'k.minorPlaceholder': 'child’s name and age',
	'k.interest': 'Area of interest',
	'k.interestPlaceholder': 'e.g. equipment, jerseys, competitions',
	'k.message': 'Message',
	'k.consent': 'I agree that the club may store my data in order to respond to this inquiry (GDPR).',
	'k.sending': 'Sending…',
	'k.submit': 'Send inquiry',
	'k.sendFailed': 'Sending failed. Please try again.',

	// ── Shared: error page + loaders + modal ──────────────────────────────────
	'err.notFoundTitle': 'Page not found',
	'err.genericTitle': 'Something went wrong',
	'err.notFoundMsg': 'The page you are looking for does not exist or has moved.',
	'err.genericMsg': 'An error occurred. Please try again later.',
	'err.backHome': 'Back to home',
	'loader.loading': 'Loading',

	// Article media-type category labels (phone news cards) + news roster heading
	'media.event': 'EVENT',
	'media.gallery': 'GALLERY',
	'media.video': 'VIDEO',
	'media.externalLink': 'EXTERNAL LINK',
	'nr.headingStrong': 'Latest',
	'nr.headingRest': 'news',
	'nr.aria': 'Latest news',
	'nr.tag': 'Latest',

	// ── NewsCoverflow arrows ──────────────────────────────────────────────────
	'cf.prev': 'Previous article',
	'cf.next': 'Next article',

	// ── Article detail (/najnovije/[slug]) ────────────────────────────────────
	'post.viewOnFacebook': 'View on Facebook',
	'post.inThisArticle': 'In this article',
	'post.share': 'Share article',
	'post.close': 'Close',
	'post.linkToArticle': 'Link to the article',
	'post.copy': 'Copy',
	'post.copied': 'Copied!',

	// ── Default site meta (root layout fallback) ──────────────────────────────
	'meta.defaultDesc':
		'Varaždin Archery Club (VSK), a competitive archery club from Varaždin, Croatia. News, competition schedule, team and achievements.',

	// ── Chapter detail (/klub/povijest/[slug]) ────────────────────────────────
	'chap.related': 'Related to this article',
	'chap.relatedStrong': 'RELATED',
	'chap.relatedRest': 'TO THIS ARTICLE',

	// ── Sitemap (/karta-stranice) ─────────────────────────────────────────────
	'site.title': 'Sitemap',
	'site.sub': 'An overview of all pages on the website.',
	'site.groupHome': 'Home',
	'site.home': 'Home',

	// ── Legal pages ───────────────────────────────────────────────────────────
	'legal.disclaimerBefore':
		'Note: this is a personal project, not an official club page. The text above is a general template and has not been legally verified. For actual legal questions, please contact the club via ',
	'legal.disclaimerLink': 'the contact page',
	'legal.disclaimerAfter': '.',
	'legal.cookiesTitle': 'Cookies',
	'legal.cookiesIntro': 'Use of cookies on this website.',
	'legal.privacyTitle': 'Privacy policy',
	'legal.privacyIntro': 'How we collect and use personal information.',
	'legal.termsTitle': 'Terms',
	'legal.termsIntro': 'Terms of use of the website.',
	'legal.c1h': 'What are cookies?',
	'legal.c1b':
		'Cookies are small text files that a website stores on your device to make the site work properly and to remember your settings during your visit.',
	'legal.c2h': 'What cookies do we use?',
	'legal.c2b':
		'This site uses primarily necessary cookies required for basic functionality (such as remembering your session and display settings). We do not use cookies for advertising.',
	'legal.c3h': 'Cookie management',
	'legal.c3b':
		'You can delete or block cookies at any time through your web browser settings. Please note that disabling some cookies may affect the functionality of the site.',
	'legal.p1h': 'What data do we collect?',
	'legal.p1b':
		'We only collect information that you voluntarily provide to us, for example via the contact form (name, email address, phone number and message). The site does not ask for sensitive personal information.',
	'legal.p2h': 'Purpose of processing',
	'legal.p2b':
		'We use the information you provide solely to respond to your inquiry, process your request for membership, collaboration, or donation, and contact you as needed. We do not use the information for any other purpose without your consent.',
	'legal.p3h': 'Data sharing',
	'legal.p3b':
		'We do not sell or share your personal information with third parties for marketing purposes. Data may only be shared if required by law or necessary to process your request.',
	'legal.p4h': 'Data storage',
	'legal.p4b':
		'We only keep data for as long as necessary to achieve the purpose for which it was collected, after which we delete or anonymize it.',
	'legal.p5h': 'Your rights',
	'legal.p5b':
		'In accordance with the General Data Protection Regulation (GDPR), you have the right to access, rectify, delete and object to the processing of your data. To exercise these rights, please contact us via the contact page.',
	'legal.t1h': 'Acceptance of terms',
	'legal.t1b':
		'By accessing and using this website, you accept these terms of use in their entirety. If you do not agree to any part of these terms, please do not use the site.',
	'legal.t2h': 'Content usage',
	'legal.t2b1':
		'The content on this site (texts, images, logos and other materials) is intended for informational use only. The content may not be copied, distributed or used for commercial purposes without the prior permission of the copyright holder.',
	'legal.t2b2':
		'We strive to keep the information accurate and up-to-date, but we do not guarantee that it is error-free or complete at all times.',
	'legal.t3h': 'Links to other pages',
	'legal.t3b':
		'The site may contain links to external websites over which we have no control. We are not responsible for the content, availability, or policies of those sites.',
	'legal.t4h': 'Limitation of liability',
	'legal.t4b':
		'Use of the site is at your own risk. To the fullest extent permitted by law, we are not liable for any direct or indirect damages arising from the use of or inability to use the site.',
	'legal.t5h': 'Changes to terms',
	'legal.t5b':
		'We reserve the right to change these terms at any time. Changes will be effective upon posting on this page, so we recommend checking them periodically.'
};

const DICTS: Record<Locale, Dict> = { hr, en };

// Translate a key for a locale. Falls back: requested locale → hr → the key itself
// (so a missing key is visible in dev, never a blank string in prod).
export function t(locale: Locale | string | undefined, key: string): string {
	const loc = (locale as Locale) in DICTS ? (locale as Locale) : DEFAULT_LOCALE;
	return DICTS[loc]?.[key] ?? DICTS[DEFAULT_LOCALE]?.[key] ?? key;
}
