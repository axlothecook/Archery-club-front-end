<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';

	// Generic privacy-policy boilerplate (Croatian). Template text — not lawyer-reviewed.
	const sections = [
		{
			heading: 'Koje podatke prikupljamo',
			body: [
				'Prikupljamo samo podatke koje nam dobrovoljno dostavite, primjerice putem kontakt obrasca (ime, adresa e-pošte, telefon i poruka). Stranica ne traži osjetljive osobne podatke.'
			]
		},
		{
			heading: 'Svrha obrade',
			body: [
				'Dostavljene podatke koristimo isključivo kako bismo odgovorili na vaš upit, obradili zahtjev za učlanjenje, suradnju ili donaciju te vas po potrebi kontaktirali. Podatke ne koristimo u druge svrhe bez vašeg pristanka.'
			]
		},
		{
			heading: 'Dijeljenje podataka',
			body: [
				'Vaše osobne podatke ne prodajemo niti ustupamo trećim stranama u marketinške svrhe. Podaci se mogu dijeliti samo ako to zahtijeva zakon ili je nužno za obradu vašeg zahtjeva.'
			]
		},
		{
			heading: 'Čuvanje podataka',
			body: [
				'Podatke čuvamo samo onoliko dugo koliko je potrebno za ostvarenje svrhe za koju su prikupljeni, nakon čega ih brišemo ili anonimiziramo.'
			]
		},
		{
			heading: 'Vaša prava',
			body: [
				'U skladu s Općom uredbom o zaštiti podataka (GDPR) imate pravo na pristup svojim podacima, njihov ispravak, brisanje te prigovor na obradu. Za ostvarivanje tih prava obratite nam se putem kontakt stranice.'
			]
		}
	];
</script>

<LegalPage
	title="Pravila privatnosti"
	intro="Kako prikupljamo i koristimo osobne podatke."
	{sections}
/>
