<script lang="ts">
	// Hamburger (menu) glyph — three lines. Uses currentColor.
	let { size = 22, strokeWidth = 2 }: { size?: number; strokeWidth?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path d="M3 6h18M3 12h18M3 18h18" />
</svg>
