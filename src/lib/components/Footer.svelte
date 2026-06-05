<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { MENU_GROUPS } from '$lib/nav';

	// Admin dashboard login lives on a separate app/subdomain (built later). The
	// public site exposes a discreet "Prijava" link in the footer pointing there.
	// Placeholder until the dashboard URL exists: PUBLIC_DASHBOARD_URL or '#'.
	const DASHBOARD_LOGIN = env.PUBLIC_DASHBOARD_URL ?? '#';

	const YEAR = new Date().getFullYear();
</script>

<footer class="club-footer site-footer">
	<div class="club-footer-columns">
		{#each MENU_GROUPS as group (group.heading)}
			<div class="club-footer-col">
				{#if group.heading}<h4>{group.heading}</h4>{/if}
				{#each group.links as link (link.href)}
					<a href={link.href}>{link.label}</a>
				{/each}
			</div>
		{/each}
	</div>

	<hr />

	<div class="footer-bottom">
		<p>© {YEAR} Varaždinski streličarski klub</p>
		<a class="admin-login" href={DASHBOARD_LOGIN}>Prijava</a>
	</div>
</footer>

<style lang="scss">
	.site-footer {
		background-color: var(--color-footer);
		color: var(--color-ink);
		padding-top: 2rem;
	}

	.club-footer-col {
		h4 {
			margin: 0 0 0.6rem;
			color: var(--color-accent);
			font-size: 0.9rem;
			text-transform: uppercase;
			letter-spacing: 0.1em;
		}
		a {
			color: var(--color-ink);
			text-decoration: none;
			display: block;
			padding: 0.15rem 0;
			opacity: 0.85;
			&:hover {
				opacity: 1;
				color: var(--color-accent);
			}
		}
	}

	hr {
		opacity: 0.25;
	}

	.footer-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 1rem 6rem 2rem;

		p {
			margin: 0;
			opacity: 0.7;
			font-size: 0.9rem;
		}
	}

	// Discreet admin entrance — small, low-key, near the copyright.
	.admin-login {
		color: var(--color-ink);
		opacity: 0.4;
		font-size: 0.8rem;
		text-decoration: none;
		&:hover {
			opacity: 0.9;
		}
	}

	@media (max-width: 640px) {
		.footer-bottom {
			padding: 1rem 1.5rem 2rem;
		}
	}
</style>
