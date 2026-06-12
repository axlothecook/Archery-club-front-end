<script lang="ts">
	// 2×2 grid-of-months glyph — represents the YEAR view (year-at-a-glance) in the
	// schedule view toggle. Outline, uses currentColor.
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
	stroke-linejoin="round"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
	<rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
	<rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
	<rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
</svg>
