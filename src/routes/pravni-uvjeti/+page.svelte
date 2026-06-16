<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';

	// Generic terms-of-use boilerplate (i18n; template text — not lawyer-reviewed).
	const locale = $derived(page.data.locale);
	const sections = $derived([
		{ heading: t(locale, 'legal.t1h'), body: [t(locale, 'legal.t1b')] },
		{ heading: t(locale, 'legal.t2h'), body: [t(locale, 'legal.t2b1'), t(locale, 'legal.t2b2')] },
		{ heading: t(locale, 'legal.t3h'), body: [t(locale, 'legal.t3b')] },
		{ heading: t(locale, 'legal.t4h'), body: [t(locale, 'legal.t4b')] },
		{ heading: t(locale, 'legal.t5h'), body: [t(locale, 'legal.t5b')] }
	]);
</script>

<LegalPage title={t(locale, 'legal.termsTitle')} intro={t(locale, 'legal.termsIntro')} {sections} />
