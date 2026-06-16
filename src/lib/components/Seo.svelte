<script lang="ts">
	// Per-page SEO/meta. Sets <title>, meta description, canonical, and Open Graph +
	// Twitter card tags (link previews on Facebook/WhatsApp/X). Drop one near the top
	// of any page:  <Seo title="Vijesti" description="..." />
	// `title` is suffixed with the club name; pass a full title to override via `raw`.
	import { page } from '$app/state';

	const SITE = 'Varaždinski streličarski klub';
	const ORIGIN = 'https://archery.axlothecook.com';
	const DEFAULT_IMAGE = 'https://images.axlothecook.com/archery/identity/vsk-logo.png';
	const DEFAULT_DESC =
		'Varaždinski streličarski klub (VSK) — natjecateljski streličarski klub iz Varaždina. Vijesti, raspored natjecanja, momčad i postignuća.';

	let {
		title,
		description = DEFAULT_DESC,
		image = DEFAULT_IMAGE,
		/** Pass true if `title` is already the complete title (no " | club" suffix). */
		raw = false,
		/** og:type — 'website' (default) or 'article' for news pages. */
		type = 'website'
	}: {
		title?: string;
		description?: string;
		image?: string;
		raw?: boolean;
		type?: string;
	} = $props();

	const fullTitle = $derived(!title ? SITE : raw ? title : `${title} | ${SITE}`);
	const canonical = $derived(ORIGIN + page.url.pathname);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />

	<!-- Open Graph (Facebook, WhatsApp, LinkedIn…) -->
	<meta property="og:site_name" content={SITE} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	<meta property="og:locale" content="hr_HR" />

	<!-- Twitter / X card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
