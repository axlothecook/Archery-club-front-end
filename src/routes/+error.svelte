<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n';

	const locale = $derived(page.data.locale);

	// One error page for all cases — switches on the HTTP status. 404 gets a
	// "not found" message; everything else (500, load failures, thrown errors)
	// gets a generic "something went wrong". Renders inside the root layout, so
	// the NavBar + Footer still frame it.
	const isNotFound = $derived(page.status === 404);
	const title = $derived(t(locale, isNotFound ? 'err.notFoundTitle' : 'err.genericTitle'));
	const message = $derived(t(locale, isNotFound ? 'err.notFoundMsg' : 'err.genericMsg'));
</script>

<section class="error">
	<p class="error-status">Error {page.status}</p>
	<h1 class="error-title">{title}</h1>
	<p class="error-message">{message}</p>
	<a class="error-home" href="/">{t(locale, 'err.backHome')}</a>
</section>

<style lang="scss">
	.error {
		min-height: 60vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 0.75rem;
		padding: 4rem 1.5rem;
	}
	.error-status {
		margin: 0;
		font-size: 4rem;
		font-weight: 700;
		line-height: 1;
		color: var(--color-accent); // theme gold
	}
	.error-title {
		margin: 0;
		font-size: 1.6rem;
		font-weight: 600;
		color: var(--color-ink);
	}
	.error-message {
		margin: 0;
		max-width: 38ch;
		color: var(--color-ink);
		opacity: 0.8;
	}
	.error-home {
		margin-top: 1rem;
		position: relative;
		font-weight: 600;
		color: var(--color-ink);
		text-decoration: none;
		// center-out gold underline on hover (same motif as the menu)
		&::after {
			content: '';
			position: absolute;
			left: 0;
			right: 0;
			bottom: -0.2rem;
			height: 2px;
			background-color: var(--color-accent);
			transform: scaleX(0);
			transform-origin: center;
			transition: transform 0.3s ease;
		}
		&:hover::after {
			transform: scaleX(1);
		}
	}
</style>
