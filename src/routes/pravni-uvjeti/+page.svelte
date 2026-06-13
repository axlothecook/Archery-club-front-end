<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';

	// Generic terms-of-use boilerplate (Croatian). Template text — not lawyer-reviewed.
	const sections = [
		{
			heading: 'Prihvaćanje uvjeta',
			body: [
				'Pristupanjem ovoj web stranici i njezinim korištenjem prihvaćate ove uvjete korištenja u cijelosti. Ako se ne slažete s bilo kojim dijelom ovih uvjeta, molimo da ne koristite stranicu.'
			]
		},
		{
			heading: 'Korištenje sadržaja',
			body: [
				'Sadržaj na ovoj stranici (tekstovi, slike, logotipi i ostali materijali) namijenjen je informativnoj uporabi. Sadržaj se ne smije umnožavati, distribuirati ni koristiti u komercijalne svrhe bez prethodnog dopuštenja nositelja prava.',
				'Trudimo se da informacije budu točne i ažurne, no ne jamčimo da su bez pogrešaka niti da su u svakom trenutku potpune.'
			]
		},
		{
			heading: 'Poveznice na druge stranice',
			body: [
				'Stranica može sadržavati poveznice na vanjske web stranice nad kojima nemamo kontrolu. Ne preuzimamo odgovornost za sadržaj, dostupnost ni politike tih stranica.'
			]
		},
		{
			heading: 'Ograničenje odgovornosti',
			body: [
				'Korištenje stranice je na vlastitu odgovornost. U najvećoj mjeri dopuštenoj zakonom ne odgovaramo za bilo kakvu izravnu ili neizravnu štetu nastalu korištenjem ili nemogućnošću korištenja stranice.'
			]
		},
		{
			heading: 'Izmjene uvjeta',
			body: [
				'Zadržavamo pravo izmjene ovih uvjeta u bilo kojem trenutku. Izmjene stupaju na snagu objavom na ovoj stranici, pa preporučujemo povremenu provjeru.'
			]
		}
	];
</script>

<LegalPage title="Pravni uvjeti" intro="Uvjeti korištenja web stranice." {sections} />
