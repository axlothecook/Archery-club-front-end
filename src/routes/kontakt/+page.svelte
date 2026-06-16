<script lang="ts">
	// Kontakt page. A tab switcher selects ONE of three public inquiry forms —
	// membership / sponsor / donation — each POSTing to /inquiries/* with a honeypot
	// + GDPR consent (matching the backend zod schemas). Club contact info (email,
	// address, phone, socials) sits alongside.

	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { t } from '$lib/i18n';
	import MailIcon from '$lib/components/icons/MailIcon.svelte';
	import FacebookIcon from '$lib/components/icons/FacebookIcon.svelte';
	import InstagramIcon from '$lib/components/icons/InstagramIcon.svelte';
	import YouTubeIcon from '$lib/components/icons/YouTubeIcon.svelte';

	const API_BASE = (env.PUBLIC_API_BASE_URL ?? 'http://localhost:3100').replace(/\/$/, '');

	// Club contact details (site-wide layout data). Phone is hardcoded until ClubInfo
	// gains a phone field (per the menu note).
	const clubInfo = $derived(page.data.clubInfo);
	const locale = $derived(page.data.locale);
	const CLUB_PHONE = '+385 98 372 912';
	const socials = $derived(clubInfo?.socials ?? []);
	const SOCIAL_ICON: Record<string, typeof FacebookIcon> = {
		facebook: FacebookIcon,
		instagram: InstagramIcon,
		youtube: YouTubeIcon
	};

	// ── Tabs ──────────────────────────────────────────────────────────────────────
	type Tab = 'membership' | 'sponsor' | 'donation';
	const TABS: { id: Tab; key: string }[] = [
		{ id: 'membership', key: 'k.tabMembership' },
		{ id: 'sponsor', key: 'k.tabSponsor' },
		{ id: 'donation', key: 'k.tabDonation' }
	];
	// Initial tab from the URL (?vrsta=uclanjenje|sponzorstvo|donacija) so footer links can
	// deep-link straight to one form; defaults to membership.
	const VRSTA_TAB: Record<string, Tab> = {
		uclanjenje: 'membership',
		sponzorstvo: 'sponsor',
		donacija: 'donation'
	};
	let activeTab = $state<Tab>(VRSTA_TAB[page.url.searchParams.get('vrsta') ?? ''] ?? 'membership');

	// ── Shared submit state (reset when switching tabs) ─────────────────────────────
	let submitting = $state(false);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let errorMsg = $state('');

	function switchTab(id: Tab) {
		if (id === activeTab) return;
		activeTab = id;
		status = 'idle';
		errorMsg = '';
	}

	// ── Form field state (one set per form; honeypot + consent shared shape) ────────
	// Membership
	let mFullName = $state('');
	let mEmail = $state('');
	let mPhone = $state('');
	let mExperience = $state('');
	let mForMinor = $state(false);
	let mMinorDetails = $state('');
	let mMessage = $state('');
	let mConsent = $state(false);

	// Sponsor
	let sCompany = $state('');
	let sContact = $state('');
	let sEmail = $state('');
	let sPhone = $state('');
	let sInterest = $state('');
	let sMessage = $state('');
	let sConsent = $state(false);

	// Donation
	let dDonor = $state('');
	let dEmail = $state('');
	let dPhone = $state('');
	let dMessage = $state('');
	let dConsent = $state(false);

	let honeypot = $state(''); // hidden; bots fill it

	function nn(v: string) {
		return v.trim() || null;
	}

	async function post(path: string, body: Record<string, unknown>) {
		if (submitting) return;
		submitting = true;
		status = 'idle';
		errorMsg = '';
		try {
			const res = await fetch(`${API_BASE}/inquiries/${path}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...body, _hp: honeypot })
			});
			if (!res.ok) {
				const b = (await res.json().catch(() => null)) as { message?: string } | null;
				throw new Error(b?.message ?? t(locale, 'k.sendFailed'));
			}
			status = 'success';
			// Scroll back to the top so the (now shorter) success message — and the
			// page header — are fully in view, instead of leaving the user stranded
			// mid-page where the confirmation is below the fold.
			if (typeof window !== 'undefined') {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		} catch (err) {
			status = 'error';
			errorMsg = err instanceof Error ? err.message : t(locale, 'k.sendFailed');
		} finally {
			submitting = false;
		}
	}

	function submitMembership(e: SubmitEvent) {
		e.preventDefault();
		post('membership', {
			fullName: mFullName,
			email: mEmail,
			phone: nn(mPhone),
			experience: nn(mExperience),
			forMinor: mForMinor,
			minorDetails: mForMinor ? nn(mMinorDetails) : null,
			message: nn(mMessage),
			consentAccepted: mConsent
		});
	}
	function submitSponsor(e: SubmitEvent) {
		e.preventDefault();
		post('sponsor', {
			companyName: sCompany,
			contactName: sContact,
			email: sEmail,
			phone: nn(sPhone),
			sponsorshipInterest: nn(sInterest),
			message: nn(sMessage),
			consentAccepted: sConsent
		});
	}
	function submitDonation(e: SubmitEvent) {
		e.preventDefault();
		post('donation', {
			donorName: dDonor,
			email: dEmail,
			phone: nn(dPhone),
			message: nn(dMessage),
			consentAccepted: dConsent
		});
	}
</script>

<div class="kontakt">
	<header class="kontakt-hero">
		<h1 class="kontakt-title">{t(locale, 'k.title')}</h1>
		<p class="kontakt-sub">{t(locale, 'k.sub')}</p>
	</header>

	<div class="kontakt-body">
		<!-- Club contact info -->
		<aside class="kontakt-info">
			<h2 class="info-title">{t(locale, 'k.infoTitle')}</h2>
			<ul class="info-list">
				{#if clubInfo?.email}
					<li><span class="info-label">{t(locale, 'k.email')}</span><a href="mailto:{clubInfo.email}">{clubInfo.email}</a></li>
				{/if}
				<li><span class="info-label">{t(locale, 'k.phone')}</span><a href="tel:{CLUB_PHONE.replace(/\s/g, '')}">{CLUB_PHONE}</a></li>
				{#if clubInfo?.address}
					<li><span class="info-label">{t(locale, 'k.address')}</span><span>{clubInfo.address}</span></li>
				{/if}
				{#if clubInfo?.oib}
					<li><span class="info-label">{t(locale, 'k.oib')}</span><span>{clubInfo.oib}</span></li>
				{/if}
			</ul>
			{#if socials.length}
				<div class="info-socials">
					{#each socials as soc (soc.platform)}
						{#if SOCIAL_ICON[soc.platform]}
							{@const Icon = SOCIAL_ICON[soc.platform]}
							<a href={soc.url} target="_blank" rel="noopener" aria-label={soc.platform}>
								<Icon size={24} />
							</a>
						{/if}
					{/each}
				</div>
			{/if}
		</aside>

		<!-- Tabbed forms -->
		<section class="kontakt-forms">
			<div class="form-tabs" role="tablist">
				{#each TABS as tab (tab.id)}
					<button
						class="form-tab"
						class:active={activeTab === tab.id}
						role="tab"
						aria-selected={activeTab === tab.id}
						onclick={() => switchTab(tab.id)}
					>
						{t(locale, tab.key)}
					</button>
				{/each}
			</div>

			<div class="form-panel">
				<!-- Honeypot (shared, visually hidden) -->
				<input
					class="hp"
					type="text"
					tabindex="-1"
					autocomplete="off"
					aria-hidden="true"
					bind:value={honeypot}
				/>

				{#if status === 'success'}
					<div class="form-success">
						<h3>{t(locale, 'k.successHeading')}</h3>
						<p>{t(locale, 'k.successBody')}</p>
						<button class="btn-primary" type="button" onclick={() => (status = 'idle')}>
							{t(locale, 'k.newInquiry')}
						</button>
					</div>
				{:else if activeTab === 'membership'}
					<form class="form" onsubmit={submitMembership}>
						<p class="form-intro">{t(locale, 'k.introMembership')}</p>
						<label>
							<span>{t(locale, 'k.fullName')}<i>*</i></span>
							<input type="text" required bind:value={mFullName} />
						</label>
						<div class="form-row">
							<label>
								<span>{t(locale, 'k.fieldEmail')}<i>*</i></span>
								<input type="email" required bind:value={mEmail} />
							</label>
							<label>
								<span>{t(locale, 'k.fieldPhone')}</span>
								<input type="tel" bind:value={mPhone} />
							</label>
						</div>
						<label>
							<span>{t(locale, 'k.experience')}</span>
							<input type="text" placeholder={t(locale, 'k.experiencePlaceholder')} bind:value={mExperience} />
						</label>
						<label class="checkbox">
							<input type="checkbox" bind:checked={mForMinor} />
							<span>{t(locale, 'k.forMinor')}</span>
						</label>
						{#if mForMinor}
							<label>
								<span>{t(locale, 'k.minorDetails')}</span>
								<input type="text" placeholder={t(locale, 'k.minorPlaceholder')} bind:value={mMinorDetails} />
							</label>
						{/if}
						<label>
							<span>{t(locale, 'k.message')}</span>
							<textarea rows="3" bind:value={mMessage}></textarea>
						</label>
						{@render consentField('m', mConsent, (v) => (mConsent = v))}
						{@render formFoot()}
					</form>
				{:else if activeTab === 'sponsor'}
					<form class="form" onsubmit={submitSponsor}>
						<p class="form-intro">{t(locale, 'k.introSponsor')}</p>
						<div class="form-row">
							<label>
								<span>{t(locale, 'k.companyName')}<i>*</i></span>
								<input type="text" required bind:value={sCompany} />
							</label>
							<label>
								<span>{t(locale, 'k.fullName')}<i>*</i></span>
								<input type="text" required bind:value={sContact} />
							</label>
						</div>
						<div class="form-row">
							<label>
								<span>{t(locale, 'k.fieldEmail')}<i>*</i></span>
								<input type="email" required bind:value={sEmail} />
							</label>
							<label>
								<span>{t(locale, 'k.fieldPhone')}</span>
								<input type="tel" bind:value={sPhone} />
							</label>
						</div>
						<label>
							<span>{t(locale, 'k.interest')}</span>
							<input type="text" placeholder={t(locale, 'k.interestPlaceholder')} bind:value={sInterest} />
						</label>
						<label>
							<span>{t(locale, 'k.message')}</span>
							<textarea rows="3" bind:value={sMessage}></textarea>
						</label>
						{@render consentField('s', sConsent, (v) => (sConsent = v))}
						{@render formFoot()}
					</form>
				{:else}
					<form class="form" onsubmit={submitDonation}>
						<p class="form-intro">{t(locale, 'k.introDonation')}</p>
						<label>
							<span>{t(locale, 'k.fullName')}<i>*</i></span>
							<input type="text" required bind:value={dDonor} />
						</label>
						<div class="form-row">
							<label>
								<span>{t(locale, 'k.fieldEmail')}<i>*</i></span>
								<input type="email" required bind:value={dEmail} />
							</label>
							<label>
								<span>{t(locale, 'k.fieldPhone')}</span>
								<input type="tel" bind:value={dPhone} />
							</label>
						</div>
						<label>
							<span>{t(locale, 'k.message')}</span>
							<textarea rows="3" bind:value={dMessage}></textarea>
						</label>
						{@render consentField('d', dConsent, (v) => (dConsent = v))}
						{@render formFoot()}
					</form>
				{/if}
			</div>
		</section>
	</div>
</div>

{#snippet consentField(id: string, checked: boolean, set: (v: boolean) => void)}
	<label class="checkbox consent" for="consent-{id}">
		<input
			id="consent-{id}"
			type="checkbox"
			required
			{checked}
			onchange={(e) => set(e.currentTarget.checked)}
		/>
		<span>
			{t(locale, 'k.consent')}<i>*</i>
		</span>
	</label>
{/snippet}

{#snippet formFoot()}
	{#if status === 'error'}
		<p class="form-error" role="alert">{errorMsg}</p>
	{/if}
	<button class="btn-primary" type="submit" disabled={submitting}>
		{submitting ? t(locale, 'k.sending') : t(locale, 'k.submit')}
	</button>
{/snippet}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';
	@use 'sass:color';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$gold: map.get(lib.$colors, 'macaroni-and-cheese');
	$white: map.get(lib.$colors, 'white');
	$blue: map.get(lib.$colors, 'blue-dress');
	$grey: map.get(lib.$colors, 'jet-grey');
	$sp: lib.$base-padding;
	$page-bg: var(--color-footer);

	.kontakt {
		width: 100%;
		background-color: $page-bg;
	}

	.kontakt-hero {
		padding: ($sp * 5) ($sp * 2) ($sp * 2);
		text-align: center;
		background-image: linear-gradient(to bottom, $navy 0%, $page-bg 100%);
	}
	.kontakt-title {
		margin: 0;
		color: $gold;
		font-size: 3.2rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}
	.kontakt-sub {
		margin: ($sp * 0.75) 0 0;
		color: #ccc;
		font-weight: 300;
		font-size: 1.05rem;
	}

	.kontakt-body {
		max-width: 1100px;
		margin: 0 auto;
		padding: ($sp * 3) ($sp * 2) ($sp * 6);
		display: grid;
		grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
		gap: ($sp * 3);
		align-items: start;
	}

	// ── Club info ───────────────────────────────────────────────────────────────
	.kontakt-info {
		color: var(--color-ink);
	}
	.info-title {
		margin: 0 0 ($sp * 1.5);
		padding-top: ($sp * 0.85);
		font-size: 1.2rem;
		font-weight: 800;
		color: $white;
	}
	.info-list {
		list-style: none;
		margin: 0 0 ($sp * 1.5);
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: ($sp);
		li {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
		}
		a {
			color: $gold;
			text-decoration: none;
			&:hover {
				text-decoration: underline;
			}
		}
	}
	.info-label {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9fb0c8;
	}
	.info-socials {
		display: flex;
		gap: ($sp);
		a {
			color: #ccc;
			transition: color 0.2s ease;
			&:hover {
				color: $white;
			}
		}
	}

	// ── Tabs ────────────────────────────────────────────────────────────────────
	.kontakt-forms {
		min-width: 0;
	}
	.form-tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		margin-bottom: ($sp * 2);
	}
	.form-tab {
		position: relative;
		padding: ($sp * 0.85) ($sp * 1.5);
		font: inherit;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		font-size: 0.9rem;
		color: #9fb0c8;
		background: none;
		border: none;
		cursor: pointer;
		transition: color 0.2s ease;
		&:hover {
			color: $white;
		}
		&.active {
			color: $white;
			&::after {
				content: '';
				position: absolute;
				left: 0;
				right: 0;
				bottom: -1px;
				height: 3px;
				background: $gold;
			}
		}
	}

	// ── Form ────────────────────────────────────────────────────────────────────
	.form-panel {
		position: relative;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: ($sp);
	}
	.form-intro {
		margin: 0 0 ($sp * 0.5);
		font-weight: 300;
		color: #ccc;
	}
	.form-row {
		display: flex;
		gap: ($sp);
		flex-wrap: wrap;
		label {
			flex: 1 1 200px;
		}
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-ink);
		i {
			color: #e23b3b;
			font-style: normal;
			margin-left: 0.15em;
		}
	}
	input[type='text'],
	input[type='email'],
	input[type='tel'],
	textarea {
		width: 100%;
		padding: ($sp * 0.7) ($sp * 0.9);
		font: inherit;
		font-weight: 400;
		color: $white;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 8px;
		transition: border-color 0.2s ease;
		&::placeholder {
			color: #8295ad;
		}
		&:focus {
			outline: none;
			border-color: $blue;
		}
	}
	textarea {
		display: block;
		margin-top: 0;
		resize: vertical;
	}

	.checkbox {
		flex-direction: row;
		align-items: center;
		gap: ($sp * 0.6);
		font-weight: 400;
		font-size: 0.9rem;
		cursor: pointer;
		input {
			width: auto;
		}
	}
	.consent {
		align-items: center;
		font-size: 0.85rem;
	}

	.hp {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.form-error {
		margin: 0;
		font-size: 0.9rem;
		color: #ff8a8a;
	}

	.btn-primary {
		margin-top: ($sp * 0.5);
		align-self: flex-start;
		padding: ($sp * 0.85) ($sp * 2.5);
		font: inherit;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		color: $navy;
		background: $gold;
		border: none;
		border-radius: 7px;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			transform 0.1s ease;
		&:hover:not(:disabled) {
			background: color.adjust($gold, $lightness: 6%);
		}
		&:disabled {
			opacity: 0.6;
			cursor: default;
		}
	}

	.form-success {
		text-align: center;
		padding: ($sp * 2) 0;
		h3 {
			margin: 0 0 ($sp * 0.5);
			font-size: 1.5rem;
			font-weight: 800;
			color: $white;
		}
		p {
			margin: 0 0 ($sp * 1.5);
			font-weight: 300;
			color: #ccc;
		}
		.btn-primary {
			align-self: center;
		}
	}

	@media (max-width: 760px) {
		.kontakt-body {
			grid-template-columns: 1fr;
		}
	}

	// ── Phone (≤600px) ────────────────────────────────────────────────────────────
	@media (max-width: 600px) {
		// Tighter side padding across the whole page (hero/info + form body) so content
		// uses more of the narrow screen.
		.kontakt-hero {
			padding-left: $sp;
			padding-right: $sp;
			padding-top: ($sp * 2.5); // raise the title (was $sp*5) higher up the screen
		}
		// Keep the subtitle where it was — push it back down by the amount the title rose,
		// so only the KONTAKT title moves up, not its subtext.
		.kontakt-sub {
			margin-top: ($sp * 3);
		}
		.kontakt-body {
			padding-left: $sp;
			padding-right: $sp;
		}
		// All THREE form-type tabs (Učlanjenje / Sponzorstvo / Donacija) fit on ONE row,
		// CLOSE together (centred cluster, small gap) rather than spread edge-to-edge.
		.form-tabs {
			gap: ($sp * 0.75);
			justify-content: center;
		}
		.form-tab {
			padding: ($sp * 0.7) ($sp * 0.4);
			font-size: 0.72rem;
			letter-spacing: 0;
			-webkit-tap-highlight-color: transparent;
		}
		// Each form's one-line intro: single row + centred, with more space below it before
		// the first field.
		.form-intro {
			font-size: 0.9rem;
			line-height: 1.3;
			text-align: center;
			margin-bottom: ($sp * 1.75);
		}
		// Give the GDPR consent checkbox plenty of breathing room from the inputs above AND
		// the submit button below (the uniform form gap was too tight around it on phone).
		.consent {
			margin-top: ($sp * 3);
			margin-bottom: ($sp * 3);
		}
		// Center the submit button on phone (was left-aligned).
		.btn-primary {
			align-self: center;
		}
	}
</style>
