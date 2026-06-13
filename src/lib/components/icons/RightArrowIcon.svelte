<script lang="ts">
	// Filled right-arrow glyph (chunky chevron ›). Uses currentColor + a size prop, per
	// the icons-as-components rule. Path from a 1024×1024 viewBox (svgrepo right-arrow).
	let { size = 16 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 1024 1024"
	fill="currentColor"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path d="M256 120.768L306.432 64 768 512l-461.568 448L256 903.232 659.072 512z" />
</svg>
