<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';

	// Generic privacy-policy boilerplate (i18n; template text — not lawyer-reviewed).
	const locale = $derived(page.data.locale);
	const sections = $derived([
		{ heading: t(locale, 'legal.p1h'), body: [t(locale, 'legal.p1b')] },
		{ heading: t(locale, 'legal.p2h'), body: [t(locale, 'legal.p2b')] },
		{ heading: t(locale, 'legal.p3h'), body: [t(locale, 'legal.p3b')] },
		{ heading: t(locale, 'legal.p4h'), body: [t(locale, 'legal.p4b')] },
		{ heading: t(locale, 'legal.p5h'), body: [t(locale, 'legal.p5b')] }
	]);
</script>

<LegalPage
	title={t(locale, 'legal.privacyTitle')}
	intro={t(locale, 'legal.privacyIntro')}
	{sections}
/>
