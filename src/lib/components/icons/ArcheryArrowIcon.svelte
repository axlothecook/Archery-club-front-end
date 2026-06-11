<script lang="ts">
	// Archery arrow glyph (archery-arrow-down-svgrepo). Points DOWN in its own box;
	// the consumer rotates it to aim elsewhere. Uses currentColor so the fill can be
	// animated from the outside.
	let { size = 24 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 1792 1792"
	fill="currentColor"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path
		d="M895,1792l-198.5-431l157.5,84.5V462.9l-123.6-99.3V0l165,133.2L1061.6,0v363.6l-125.6,99.3v982.3l159.5-84.5L895,1792z"
	/>
</svg>
