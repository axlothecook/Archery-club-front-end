<script lang="ts">
	// Flag icon — wraps the `flag-icons` CSS package (`.fi .fi-<country>`) in a
	// component so flags follow the same "every icon is a component" rule as the
	// SVG icons. `country` is an ISO 3166-1 alpha-2 code (e.g. "hr", "gb").
	// `size` sets the flag height in rem.
	let { country, size = 1.25 }: { country: string; size?: number } = $props();
</script>

<span class="fi fi-{country} flag-icon" style="font-size: {size}rem;"></span>

<style>
	.flag-icon {
		border-radius: 3px;
		display: inline-block;
		line-height: 1;
	}
</style>
