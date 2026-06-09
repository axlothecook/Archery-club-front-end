<script lang="ts">
	// Two crossed archery arrows (archery-bow emblem, from archery-bow-svgrepo-com).
	// Each arrow = one shaft path + its arrowhead polygon, grouped so it takes a
	// single colour. The loader cycles the two arrows blue↔gold (one lightens while
	// the other darkens), so the fills are CSS-driven via the `.arrow-a` / `.arrow-b`
	// groups rather than hard-coded here.
	let { size = 72 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 512 512"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<!-- Arrow A: bottom-left → top-right (shaft + top-right arrowhead). -->
	<g class="arrow arrow-a">
		<path
			d="M8.258,419.165h68.77l27.366-27.366H52.139c-4.561,0-8.258-3.696-8.258-8.258
			s3.697-8.258,8.258-8.258h68.771l27.365-27.365H96.02c-4.561,0-8.258-3.696-8.258-8.258c0-4.562,3.697-8.258,8.258-8.258h68.77
			l305.2-305.199l11.678,11.679L176.469,343.081v68.77c0,4.562-3.697,8.258-8.258,8.258s-8.258-3.696-8.258-8.258v-52.254
			l-27.365,27.365v68.77c0,4.562-3.697,8.258-8.258,8.258c-4.561,0-8.258-3.696-8.258-8.258v-52.254l-27.365,27.365v68.77
			c0,4.562-3.697,8.258-8.258,8.258c-4.561,0-8.258-3.696-8.258-8.258v-63.932H8.258c-4.561,0-8.258-3.696-8.258-8.258
			S3.697,419.165,8.258,419.165z"
		/>
		<polygon points="466.545,113.515 503.742,4.129 394.356,41.326 453.808,54.063 " />
	</g>

	<!-- Arrow B: bottom-right → top-left (shaft + top-left arrowhead). -->
	<g class="arrow arrow-b">
		<path
			d="M503.742,419.165h-68.77l-27.366-27.366h52.255c4.561,0,8.258-3.696,8.258-8.258
			s-3.697-8.258-8.258-8.258H391.09l-27.365-27.365h52.254c4.561,0,8.258-3.696,8.258-8.258c0-4.562-3.697-8.258-8.258-8.258h-68.77
			L42.009,26.202L30.331,37.881l305.199,305.199v68.77c0,4.562,3.697,8.258,8.258,8.258c4.561,0,8.258-3.696,8.258-8.258v-52.254
			l27.365,27.365v68.77c0,4.562,3.697,8.258,8.258,8.258c4.561,0,8.258-3.696,8.258-8.258v-52.254l27.365,27.365v68.77
			c0,4.562,3.697,8.258,8.258,8.258c4.561,0,8.258-3.696,8.258-8.258v-63.932h63.933c4.561,0,8.258-3.696,8.258-8.258
			S508.303,419.165,503.742,419.165z"
		/>
		<polygon points="45.455,113.515 8.258,4.129 117.644,41.326 58.192,54.063 " />
	</g>
</svg>

<style>
	/* Default fills; the loader overrides these with the cycling animation. */
	.arrow-a {
		fill: var(--arrow-a, #2f6df6);
	}
	.arrow-b {
		fill: var(--arrow-b, #efb52f);
	}
</style>
