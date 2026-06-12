// reveal — a Svelte action that fades + slides an element in the first time it scrolls
// into view, using IntersectionObserver (no dependency). Add `use:reveal` to any
// element; it starts hidden (.reveal) and gets .reveal--in when ~15% visible. Respects
// prefers-reduced-motion by revealing immediately. Optional params tune the trigger
// threshold and a per-element delay (for staggering a group).
//
//   <div use:reveal>…</div>
//   <div use:reveal={{ delay: 120 }}>…</div>

type RevealOptions = {
	/** 0–1 fraction of the element that must be visible to trigger. Default 0.15. */
	threshold?: number;
	/** ms delay before the reveal transition starts (for staggering). Default 0. */
	delay?: number;
	/** Re-hide + replay each time it leaves/re-enters. Default false (reveal once). */
	repeat?: boolean;
};

export function reveal(node: HTMLElement, options: RevealOptions = {}) {
	const reduceMotion =
		typeof window !== 'undefined' &&
		window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	let opts = options;
	node.classList.add('reveal');
	if (opts.delay) node.style.setProperty('--reveal-delay', `${opts.delay}ms`);

	// No motion preference → just show it, no observer.
	if (reduceMotion) {
		node.classList.add('reveal--in');
		return {
			update(next: RevealOptions) {
				opts = next;
			}
		};
	}

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('reveal--in');
					if (!opts.repeat) io.unobserve(node);
				} else if (opts.repeat) {
					node.classList.remove('reveal--in');
				}
			}
		},
		{ threshold: opts.threshold ?? 0.15 }
	);
	io.observe(node);

	return {
		update(next: RevealOptions) {
			opts = next;
			if (next.delay) node.style.setProperty('--reveal-delay', `${next.delay}ms`);
		},
		destroy() {
			io.disconnect();
		}
	};
}
