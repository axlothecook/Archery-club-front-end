<script lang="ts">
	// Chevron glyph pointing in a given direction. Uses currentColor.
	// direction: 'right' (default) | 'left' | 'up' | 'down'.
	let {
		size = 18,
		strokeWidth = 2,
		direction = 'right'
	}: { size?: number; strokeWidth?: number; direction?: 'right' | 'left' | 'up' | 'down' } =
		$props();

	// Each direction's path (drawn in a 24×24 box).
	const PATHS = {
		right: 'M9 6l6 6-6 6',
		left: 'M15 6l-6 6 6 6',
		up: 'M6 15l6-6 6 6',
		down: 'M6 9l6 6 6-6'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	stroke-linejoin="round"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path d={PATHS[direction]} />
</svg>
