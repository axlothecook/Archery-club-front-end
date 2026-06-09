<script lang="ts">
	// "Pridruži se" — prospective-sponsor inquiry modal. Industry-standard fields
	// (company, contact, email, optional phone / interest / message + GDPR consent)
	// matching the backend `POST /inquiries/sponsor` contract. Includes the hidden
	// honeypot field the spam guard expects. Closes on success / Esc / backdrop.

	import { env } from '$env/dynamic/public';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const API_BASE = env.PUBLIC_API_BASE_URL ?? 'http://localhost:3100';

	// Form state.
	let companyName = $state('');
	let contactName = $state('');
	let email = $state('');
	let phone = $state('');
	let sponsorshipInterest = $state('');
	let message = $state('');
	let consent = $state(false);
	let honeypot = $state(''); // hidden; bots fill it, humans don't

	let submitting = $state(false);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let errorMsg = $state('');

	function reset() {
		companyName = '';
		contactName = '';
		email = '';
		phone = '';
		sponsorshipInterest = '';
		message = '';
		consent = false;
		honeypot = '';
		status = 'idle';
		errorMsg = '';
	}

	function close() {
		open = false;
		// reset shortly after so the closing transition doesn't show a wiped form
		setTimeout(reset, 250);
	}

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;
		submitting = true;
		status = 'idle';
		errorMsg = '';
		try {
			const res = await fetch(`${API_BASE.replace(/\/$/, '')}/inquiries/sponsor`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					companyName,
					contactName,
					email,
					phone: phone.trim() || null,
					sponsorshipInterest: sponsorshipInterest.trim() || null,
					message: message.trim() || null,
					consentAccepted: consent,
					_hp: honeypot
				})
			});
			if (!res.ok) {
				const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
				throw new Error(body?.error?.message ?? 'Slanje nije uspjelo. Pokušajte ponovno.');
			}
			status = 'success';
		} catch (err) {
			status = 'error';
			errorMsg = err instanceof Error ? err.message : 'Slanje nije uspjelo. Pokušajte ponovno.';
		} finally {
			submitting = false;
		}
	}

	// Close on Escape.
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={open ? onKeydown : undefined} />

{#if open}
	<!-- Backdrop: click outside the dialog closes it. -->
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
	>
		<div class="modal" role="dialog" aria-modal="true" aria-labelledby="sponsor-modal-title">
			<button class="modal-close" type="button" aria-label="Zatvori" onclick={close}>×</button>

			{#if status === 'success'}
				<div class="modal-success">
					<h2 id="sponsor-modal-title">Hvala vam!</h2>
					<p>Vaš upit je zaprimljen. Javit ćemo vam se uskoro.</p>
					<button class="btn-primary" type="button" onclick={close}>Zatvori</button>
				</div>
			{:else}
				<h2 id="sponsor-modal-title" class="modal-title">Postanite naš partner</h2>
				<p class="modal-sub">
					Ostavite svoje podatke i naš tim će vas kontaktirati u vezi mogućnosti suradnje.
				</p>

				<form class="modal-form" onsubmit={submit}>
					<!-- Honeypot: visually hidden; real users never fill it. -->
					<input
						class="hp"
						type="text"
						tabindex="-1"
						autocomplete="off"
						aria-hidden="true"
						bind:value={honeypot}
					/>

					<label>
						<span>Naziv tvrtke<i>*</i></span>
						<input type="text" required bind:value={companyName} />
					</label>
					<label>
						<span>Ime i prezime<i>*</i></span>
						<input type="text" required bind:value={contactName} />
					</label>
					<label>
						<span>Email<i>*</i></span>
						<input type="email" required bind:value={email} />
					</label>
					<label>
						<span>Telefon</span>
						<input type="tel" bind:value={phone} />
					</label>
					<label>
						<span>Područje interesa</span>
						<input
							type="text"
							placeholder="npr. oprema, dresovi, sufinanciranje natjecanja"
							bind:value={sponsorshipInterest}
						/>
					</label>
					<label>
						<span>Poruka</span>
						<textarea rows="4" bind:value={message}></textarea>
					</label>

					<label class="consent">
						<input type="checkbox" required bind:checked={consent} />
						<span>
							Slažem se da klub pohrani moje podatke radi odgovora na ovaj upit (GDPR).<i>*</i>
						</span>
					</label>

					{#if status === 'error'}
						<p class="form-error" role="alert">{errorMsg}</p>
					{/if}

					<button class="btn-primary" type="submit" disabled={submitting}>
						{submitting ? 'Šaljem…' : 'Pošalji upit'}
					</button>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;
	@use 'sass:map';

	$navy: map.get(lib.$colors, 'deep-sapphire');
	$white: map.get(lib.$colors, 'white');
	$sp: lib.$base-padding;
	$grey: map.get(lib.$colors, 'jet-grey');

	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $sp * 1.5;
		background: rgba(8, 16, 38, 0.6);
		backdrop-filter: blur(3px);
	}
	.modal {
		position: relative;
		width: 100%;
		max-width: 560px;
		max-height: 90vh;
		overflow-y: auto;
		background: $white;
		color: $navy;
		border-radius: 14px;
		padding: ($sp * 2.5) ($sp * 2.5) ($sp * 2);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
	}
	.modal-close {
		position: absolute;
		top: $sp * 0.75;
		right: $sp;
		border: none;
		background: none;
		font-size: 2rem;
		line-height: 1;
		color: $grey;
		cursor: pointer;
		transition: color 0.2s ease;
		&:hover {
			color: $navy;
		}
	}
	.modal-title {
		margin: 0 0 ($sp * 0.5);
		font-size: 1.6rem;
		font-weight: 800;
	}
	.modal-sub {
		margin: 0 0 ($sp * 1.5);
		font-size: 0.95rem;
		font-weight: 300;
		color: $grey;
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: $sp;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: $sp * 0.35;
		font-size: 0.9rem;
		font-weight: 600;
		i {
			color: #d22; // required asterisk
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
		color: $navy;
		background: map.get(lib.$colors, 'white-smoke');
		border: 1px solid map.get(lib.$colors, 'heather');
		border-radius: 8px;
		transition: border-color 0.2s ease;
		&:focus {
			outline: none;
			border-color: map.get(lib.$colors, 'blue-dress');
		}
	}
	textarea {
		resize: vertical;
	}

	.consent {
		flex-direction: row;
		align-items: flex-start;
		gap: $sp * 0.6;
		font-weight: 400;
		font-size: 0.85rem;
		input {
			margin-top: 0.2em;
		}
	}

	// Honeypot — visually hidden but still in the DOM/tab-free for bots to fill.
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
		color: #c0392b;
	}

	.btn-primary {
		margin-top: $sp * 0.5;
		align-self: flex-start;
		padding: ($sp * 0.8) ($sp * 2);
		font: inherit;
		font-weight: 700;
		color: $white;
		background: map.get(lib.$colors, 'supermarket-blue'); // #00ade6
		border: none;
		border-radius: 999px;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			transform 0.1s ease;
		&:hover:not(:disabled) {
			background: map.get(lib.$colors, 'blue-dress');
		}
		&:disabled {
			opacity: 0.6;
			cursor: default;
		}
	}

	.modal-success {
		text-align: center;
		padding: ($sp * 1.5) 0 ($sp * 0.5);
		h2 {
			margin: 0 0 ($sp * 0.5);
			font-size: 1.6rem;
			font-weight: 800;
		}
		p {
			margin: 0 0 ($sp * 1.5);
			font-weight: 300;
		}
		.btn-primary {
			align-self: center;
		}
	}
</style>
