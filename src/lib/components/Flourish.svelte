<script lang="ts">
	// Decorative end-of-section flourish: the VSK crest flanked by two gold lines
	// that fan outward (and the crest lifts up) once it scrolls into view. Used at
	// the bottom of long white content cards (chapter article, Identitet, Postignuća)
	// just before the golden footer block. Self-contained: it carries its own
	// IntersectionObserver reveal so any page can drop it in.

	// The club crest (same as the topbar / chapter-article crest).
	const LOGO_URL =
		'https://rsjqguihhwunvpjsybtw.supabase.co/storage/v1/object/public/identity/vsk-logo.png';

	// Reveal once the flourish scrolls into view, then disconnect — a one-shot
	// entrance. Uses a slight negative bottom margin so it triggers a touch before
	// the very bottom edge, but NOT so aggressive that an element mounted already
	// near the bottom (e.g. when a "load more" button is replaced by the flourish)
	// fails to fire.
	let revealed = $state(false);
	function reveal(node: HTMLElement) {
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					revealed = true;
					io.disconnect();
				}
			},
			{ rootMargin: '0px 0px -10% 0px', threshold: 0 }
		);
		io.observe(node);
		return { destroy: () => io.disconnect() };
	}
</script>

<div class="flourish" class:revealed use:reveal aria-hidden="true">
	<span class="flourish-line left"></span>
	<img class="flourish-crest" src={LOGO_URL} alt="" />
	<span class="flourish-line right"></span>
</div>

<style lang="scss">
	@use 'axlothecook-sass-library/sass-library/variables' as lib;

	$sp: lib.$base-padding;
	$gold: var(--color-accent);

	// Crest + two gold lines, all vertically CENTRED on one line. The crest lifts
	// UP into its aligned spot on reveal (entrance), then the lines fan outward.
	.flourish {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $sp * 1.5; // gap between each line and the crest
		max-width: 668px;
		margin: 0 auto; // host controls the surrounding vertical spacing
	}
	.flourish-crest {
		flex: 0 0 auto;
		width: 56px;
		height: auto;
		// Crest is ALWAYS visible (no fade), just lifts UP a short distance into its
		// aligned spot. Slow, subtle.
		transform: translateY(1.5rem);
		transition: transform 1.1s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.flourish-line {
		flex: 1 1 auto;
		height: 2px;
		background: $gold;
		// Collapsed (0 width) until revealed, then grows OUTWARD from the crest side.
		transform: scaleX(0);
		transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.5s;
	}
	.flourish-line.left {
		transform-origin: right; // grows leftwards, away from the crest
	}
	.flourish-line.right {
		transform-origin: left; // grows rightwards, away from the crest
	}
	.flourish.revealed .flourish-crest {
		transform: translateY(0); // lifted into its aligned spot
	}
	.flourish.revealed .flourish-line {
		transform: scaleX(1); // fan out
	}

	// PHONE: line length mirrors the individual chapter page's flourish (~126px lines
	// on a 390px screen). 1rem side padding keeps them clear of the screen edges while
	// matching that reference length.
	@media (max-width: 720px) {
		.flourish {
			padding: 0 $sp;
		}
	}
</style>
