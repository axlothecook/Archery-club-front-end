<script lang="ts">
	import LegalPage from '$lib/components/LegalPage.svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';

	// Generic cookie-notice boilerplate (i18n; template text — not lawyer-reviewed).
	const locale = $derived(page.data.locale);
	const sections = $derived([
		{ heading: t(locale, 'legal.c1h'), body: [t(locale, 'legal.c1b')] },
		{ heading: t(locale, 'legal.c2h'), body: [t(locale, 'legal.c2b')] },
		{ heading: t(locale, 'legal.c3h'), body: [t(locale, 'legal.c3b')] }
	]);
</script>

<LegalPage title={t(locale, 'legal.cookiesTitle')} intro={t(locale, 'legal.cookiesIntro')} {sections} />
