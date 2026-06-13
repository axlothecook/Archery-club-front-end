<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';

	// Generic cookie-notice boilerplate (Croatian). Template text — not lawyer-reviewed.
	const sections = [
		{
			heading: 'Što su kolačići',
			body: [
				'Kolačići (cookies) su male tekstualne datoteke koje web stranica pohranjuje na vaš uređaj kako bi stranica ispravno radila te kako bi se zapamtile vaše postavke prilikom posjeta.'
			]
		},
		{
			heading: 'Koje kolačiće koristimo',
			body: [
				'Ova stranica koristi prvenstveno nužne kolačiće potrebne za osnovno funkcioniranje (primjerice pamćenje sesije i postavki prikaza). Ne koristimo kolačiće za oglašavanje.'
			]
		},
		{
			heading: 'Upravljanje kolačićima',
			body: [
				'Kolačiće možete u svakom trenutku obrisati ili blokirati putem postavki svog web preglednika. Napominjemo da onemogućavanje nekih kolačića može utjecati na funkcionalnost stranice.'
			]
		}
	];
</script>

<LegalPage title="Kolačići" intro="Korištenje kolačića na ovoj web stranici." {sections} />
