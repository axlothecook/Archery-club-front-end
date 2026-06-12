<script lang="ts">
	// Varaždin (city-level) achievement badge — a "Vz" monogram in a rounded shield.
	// Uses currentColor so the parent sets the tint (matches the other record icons:
	// GlobeRecordIcon / EuropeRecordIcon / CroatiaRecordIcon). The text is part of the
	// SVG (no font dependency at render) so it always reads "Vz".
	let { size = 24 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 100 100"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- Rounded shield outline -->
	<path
		fill="none"
		stroke="currentColor"
		stroke-width="6"
		stroke-linejoin="round"
		d="M50 6 L86 18 V50 C86 72 70 88 50 94 C30 88 14 72 14 50 V18 Z"
	/>
	<!-- "Vz" monogram -->
	<text
		x="50"
		y="58"
		text-anchor="middle"
		dominant-baseline="central"
		font-family="'Segoe UI', Arial, sans-serif"
		font-size="42"
		font-weight="800"
		fill="currentColor">Vz</text
	>
</svg>
