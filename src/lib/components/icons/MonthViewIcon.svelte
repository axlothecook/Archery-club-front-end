<script lang="ts">
	// Single-calendar glyph — represents the MONTH view in the schedule view toggle.
	// Outline, uses currentColor.
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
	<rect x="3" y="4.5" width="18" height="16" rx="2" />
	<path d="M3 9h18" />
	<path d="M8 2.5v4M16 2.5v4" />
	<!-- a few "day" dots to read as a single month grid -->
	<path d="M7.5 13h0M12 13h0M16.5 13h0M7.5 16.5h0M12 16.5h0" />
</svg>
