<script lang="ts">
	// Up chevron — drawn as a symmetric stroked shape (two equal arms meeting at a
	// point) so both sides are identical thickness. Uses currentColor so it
	// inherits the surrounding text colour (footer ink + gold hover). `strokeWidth`
	// (in viewBox units) controls how thick the chevron reads.
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
	<path d="M4 15l8-8 8 8" />
</svg>
