<script lang="ts">
	// Person-outline silhouette (head + shoulders). Used as the fallback "photo"
	// for an archer card / profile when no headshot exists. Uses currentColor so it
	// inherits the surrounding colour (drawn light on the blue placeholder bg).
	let { size = 48 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="currentColor"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<path
		d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-3.31-3.58-6-8-6Z"
	/>
</svg>
