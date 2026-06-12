<script lang="ts">
	// Calendar glyph (outline) — date rows on the schedule cards. Uses currentColor.
	let { size = 18, strokeWidth = 2 }: { size?: number; strokeWidth?: number } = $props();
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
	<rect x="3" y="4.5" width="18" height="16" rx="2" />
	<path d="M3 9h18" />
	<path d="M8 2.5v4M16 2.5v4" />
</svg>
