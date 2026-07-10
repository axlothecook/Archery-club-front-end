// One-click guard for the archer cards (roster grid + related-archers rows).
//
// The cards are plain <a href="/momcad/{slug}"> links. Rapidly clicking several cards
// (or double-clicking one) queued MULTIPLE SvelteKit client-side navigations, which
// caused a janky double-load / flash before the last one won. This guard lets the FIRST
// archer-card click through and swallows any further archer-card clicks until that
// navigation settles — so exactly one profile opens per click burst.
//
// Usage: on each card's <a>, `onclick={archerNavGuard}`. It calls preventDefault() only
// when a navigation is already in flight (so the first click still navigates normally,
// keeping SPA routing, middle-click / ctrl-click / new-tab behaviour intact).

let navigating = false;

// Reset the guard when a navigation finishes (or is cancelled). Call once from the root
// layout via afterNavigate so the flag never sticks. Also self-heals via a timeout in
// case afterNavigate doesn't fire (e.g. same-URL click).
export function releaseArcherNav() {
	navigating = false;
}

export function archerNavGuard(event: MouseEvent) {
	// Never interfere with modified clicks (new tab / new window / download) — let the
	// browser handle those normally.
	if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return;
	}
	if (navigating) {
		// A profile navigation is already under way — ignore this extra click.
		event.preventDefault();
		return;
	}
	navigating = true;
	// Safety net: the root layout's onNavigate releases the flag when the page-transition
	// wipe (~1500ms) completes; this timeout is a fallback that just needs to outlast the
	// wipe in case that release doesn't fire (e.g. a same-URL click that no-ops).
	setTimeout(releaseArcherNav, 1800);
}
