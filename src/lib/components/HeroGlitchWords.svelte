<script lang="ts">
	// PSG-style glitch word overlay for the /raspored hero (WebGL).
	//
	// Renders the two giant scrolling words (VSK top / RASPORED bottom) into a
	// single transparent <canvas> stacked over the two video bands. The words are
	// drawn ONCE to offscreen 2D canvases (the "clean" texture), then a three.js
	// fullscreen quad samples them through a glitch FRAGMENT SHADER that does the
	// PSG datamosh: RGB cyan/magenta channel split, blocky pixel-cube displacement,
	// horizontal slice tear, and outline holes. Bursts are intermittent and BOTH
	// words glitch IN SYNC (one shared `uGlitch` envelope feeds both halves).
	//
	// Why WebGL: the pixel-cube / datamosh blocks can't be done in CSS. The clean
	// scroll + sizing match the previous CSS layer (top word top-anchored under the
	// navbar, bottom word filling its band).
	//
	// SSR-safe: nothing runs until mounted (the canvas + WebGL are browser-only).
	import { onMount } from 'svelte';
	import {
		WebGLRenderer,
		Scene,
		OrthographicCamera,
		PlaneGeometry,
		Mesh,
		ShaderMaterial,
		CanvasTexture,
		LinearFilter,
		RepeatWrapping,
		ClampToEdgeWrapping
	} from 'three';

	let {
		// Words + per-band config. `navH` = the px hidden above the viewport (the hero
		// is pulled up under the fixed navbar) so the top word starts just below y=0.
		navH = 64
	}: { navH?: number } = $props();

	let host = $state<HTMLDivElement>();
	let mounted = $state(false);

	// ── Word draw config (mirrors the old CSS: italic 900, fill/outline alternate) ──
	// cap-height ≈ 0.747em for Inter 900 italic (same constant the CSS used).
	const CAP_RATIO = 0.747;
	// Render the texture at this device-scale for crisp letters.
	const TEX_SCALE = 2;

	type Band = {
		word: string;
		color: 'white' | 'black';
		speed: number; // px/sec scroll (positive = right→left); resolved each resize
		// vertical sizing within the band, in CSS px (resolved each resize)
		fontPx: number;
		padTop: number; // top padding before caps (top band only)
		align: 'top' | 'center';
	};

	onMount(() => {
		mounted = true;
		if (!host) return;

		const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		// DEV: ?glitch=1 pins the burst on for visual inspection.
		const PIN_GLITCH = new URLSearchParams(location.search).has('glitch');
		const FREEZE = new URLSearchParams(location.search).has('freeze');

		// ── three.js fullscreen setup ──────────────────────────────────────────────
		let renderer: WebGLRenderer;
		try {
			renderer = new WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false });
		} catch {
			return; // no WebGL → leave the CSS fallback words visible
		}
		renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
		renderer.setClearColor(0x000000, 0); // transparent
		host.appendChild(renderer.domElement);
		renderer.domElement.style.cssText =
			'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';

		const scene = new Scene();
		const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

		// One offscreen 2D canvas per band. The canvas holds exactly TWO tiles of the
		// word (fill + outline, the alternation), and the texture REPEATS horizontally,
		// so an infinite fill/outline/fill/outline marquee tiles seamlessly with no
		// clipping. Scrolling = a UV x-offset in the shader.
		const makeBandTexture = () => {
			const c = document.createElement('canvas');
			c.width = 2;
			c.height = 2; // sane initial size; resize() sets the real dims before first draw
			const ctx = c.getContext('2d')!;
			const tex = new CanvasTexture(c);
			tex.minFilter = LinearFilter;
			tex.magFilter = LinearFilter;
			tex.wrapS = RepeatWrapping; // tile horizontally → infinite marquee
			tex.wrapT = ClampToEdgeWrapping;
			return { c, ctx, tex };
		};

		// Draw the repeating tile (one fill copy + one outline copy) into the canvas,
		// sized to exactly two word-steps wide × band-tall. Returns the tile width in
		// CSS px so the shader can convert band-px scroll → UV.
		const drawBand = (
			b: Band,
			ctx: CanvasRenderingContext2D,
			c: HTMLCanvasElement,
			bandH: number
		) => {
			const dpr = TEX_SCALE;
			const SKEW = -0.18; // synthetic italic lean (Inter canvas italic is unreliable)

			// Measure first (need a font set on a temp transform-free state).
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.font = `900 ${b.fontPx}px Inter, system-ui, sans-serif`;
			const word = b.word.toUpperCase();
			const wordW = ctx.measureText(word).width;
			const gap = b.fontPx * 0.18;
			const stepW = wordW + gap; // one fill-or-outline cell
			const tileW = stepW * 2; // fill + outline = one repeating unit
			// Pad the canvas so the shear's overhang doesn't clip; we draw three units
			// and treat the middle as the seamless tile (RepeatWrapping handles the rest).
			const padX = bandH; // generous horizontal pad for the slant overhang

			c.width = Math.max(1, Math.round(tileW * dpr));
			c.height = Math.max(1, Math.round(bandH * dpr));

			ctx.setTransform(dpr, 0, SKEW * dpr, dpr, 0, 0);
			ctx.clearRect(-padX, 0, tileW + 2 * padX, bandH);
			ctx.font = `900 ${b.fontPx}px Inter, system-ui, sans-serif`;
			ctx.textBaseline = 'alphabetic';
			ctx.textAlign = 'left';
			ctx.lineJoin = 'round';

			const cap = b.fontPx * CAP_RATIO;
			const baseline = b.align === 'top' ? b.padTop + cap : (bandH + cap) / 2;
			const fill = b.color === 'white' ? '#ffffff' : '#000000';

			// Draw the two-cell unit at x=0 and again at x=±tileW so glyph parts that
			// overhang the tile edges (slant + the word itself) wrap in seamlessly.
			for (let unit = -1; unit <= 1; unit++) {
				const ox = unit * tileW;
				// fill copy
				ctx.fillStyle = fill;
				ctx.fillText(word, ox, baseline);
				// outline copy
				ctx.lineWidth = Math.max(2, b.fontPx * 0.028);
				ctx.strokeStyle = fill;
				ctx.strokeText(word, ox + stepW, baseline);
			}
			return { tileW, baseline };
		};

		// Fragment shader — the glitch. Samples the band texture with scrolling UV,
		// applies block displacement + RGB split + slice tear, gated by uGlitch.
		const FRAG = /* glsl */ `
			precision highp float;
			varying vec2 vUv;
			uniform sampler2D uTexTop;
			uniform sampler2D uTexBot;
			uniform vec2 uStripTop;   // (drawnWidth, bandWidth) px, top band
			uniform vec2 uStripBot;
			uniform float uScrollTop; // px scrolled
			uniform float uScrollBot;
			uniform float uSplit;     // top band height fraction (0..1)
			uniform float uGlitch;    // 0..1 burst envelope (SHARED → words in sync)
			uniform float uTime;
			uniform float uSeed;      // changes per burst → different pattern each time

			// cheap hash noise
			float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
			float hash1(float n){ return fract(sin(n) * 43758.5453); }

			// Sample one band's tiled word strip at scrolled UV. uv.x in 0..1 across band.
			vec4 sampleBand(sampler2D tex, vec2 strip, float scroll, vec2 uv){
				float bandW = strip.y;
				float drawnW = strip.x;
				// px position then wrap within the drawn strip (seamless loop)
				float px = uv.x * bandW + scroll;
				float u = px / drawnW; // tile units; RepeatWrapping tiles infinitely
				return texture2D(tex, vec2(u, uv.y));
			}

			void main(){
				// pick band + remap uv.y to that band's local 0..1
				bool top = vUv.y > (1.0 - uSplit);
				vec2 strip = top ? uStripTop : uStripBot;
				float scroll = top ? uScrollTop : uScrollBot;
				float localY = top ? (vUv.y - (1.0 - uSplit)) / uSplit : vUv.y / (1.0 - uSplit);
				// CanvasTexture flips Y for us (flipY=true default), so localY maps the
				// band's top→1, bottom→0 already matching the canvas's top→bottom draw.
				vec2 uv = vec2(vUv.x, localY);

				float g = uGlitch;

				// ── block / pixel-cube displacement (datamosh) ──
				// Quantize into small cells; a random SUBSET shifts by a SMALL offset.
				// Kept modest so letters stay legible; cubes appear at torn edges.
				float cells = mix(48.0, 80.0, hash1(uSeed));
				vec2 cell = floor(uv * vec2(cells, cells * 0.5));
				float r = hash(cell + uSeed);
				float cellOn = step(0.78, hash(cell * 1.7 + uSeed + floor(uTime * 14.0)));
				vec2 disp = vec2(0.0);
				if (g > 0.0 && cellOn > 0.5) {
					disp.x = (r - 0.5) * 0.045 * g;          // small jump (not a full smear)
					disp.y = (hash(cell.yx + uSeed) - 0.5) * 0.012 * g;
				}

				// ── horizontal slice tear (a few scanline bands shift) ──
				float bandRow = floor(uv.y * 34.0);
				float tear = (hash1(bandRow + floor(uTime * 22.0) + uSeed) - 0.5);
				tear *= step(0.82, hash1(bandRow * 3.1 + uSeed)) * 0.05 * g; // fewer + smaller

				vec2 duv = uv + disp + vec2(tear, 0.0);
				float split = (0.006 + 0.01 * r) * g; // RGB split offset

				// GLSL ES 1.0 can't pass a sampler through a ternary/variable, so branch
				// the whole sample set per band. base = clean center (for ink masking).
				vec4 base; float aR; vec4 cG; float aB;
				if (top) {
					base = sampleBand(uTexTop, strip, scroll, uv);
					aR = sampleBand(uTexTop, strip, scroll, duv + vec2(split, 0.0)).a;
					cG = sampleBand(uTexTop, strip, scroll, duv);
					aB = sampleBand(uTexTop, strip, scroll, duv - vec2(split, 0.0)).a;
				} else {
					base = sampleBand(uTexBot, strip, scroll, uv);
					aR = sampleBand(uTexBot, strip, scroll, duv + vec2(split, 0.0)).a;
					cG = sampleBand(uTexBot, strip, scroll, duv);
					aB = sampleBand(uTexBot, strip, scroll, duv - vec2(split, 0.0)).a;
				}

				vec3 col = cG.rgb;
				float a = max(max(aR, cG.a), aB);
				if (g > 0.001) {
					// cyan fringe on the +split side, magenta on the -split side. These
					// only ADD where that offset hit INK, so the empty band stays clear.
					col += vec3(0.0, aR, aR) * 0.7 * g;
					col += vec3(aB, 0.0, aB) * 0.7 * g;
				}

				// ── outline holes: punch out a few cells, but ONLY where there's ink
				// (so we erode letter edges, not paint holes in the empty band) ──
				float hole = step(0.95, hash(cell * 2.3 + uSeed + 7.0)) * step(0.25, g);
				a *= (1.0 - hole * step(0.05, base.a));

				if (a < 0.01) discard;
				gl_FragColor = vec4(col, a);
			}
		`;

		const VERT = /* glsl */ `
			varying vec2 vUv;
			void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
		`;

		// Band definitions (sizing resolved on resize).
		const top: Band = {
			word: 'VSK',
			color: 'white',
			speed: -1, // resolved on resize (px/s)
			fontPx: 0,
			padTop: 0,
			align: 'top'
		};
		const bot: Band = {
			word: 'RASPORED',
			color: 'black',
			speed: -1,
			fontPx: 0,
			padTop: 0,
			align: 'center'
		};

		const T = makeBandTexture();
		const B = makeBandTexture();

		const uniforms = {
			uTexTop: { value: T.tex },
			uTexBot: { value: B.tex },
			uStripTop: { value: [1, 1] as [number, number] },
			uStripBot: { value: [1, 1] as [number, number] },
			uScrollTop: { value: 0 },
			uScrollBot: { value: 0 },
			uSplit: { value: 0.5 },
			uGlitch: { value: 0 },
			uTime: { value: 0 },
			uSeed: { value: 0 }
		};

		const material = new ShaderMaterial({
			vertexShader: VERT,
			fragmentShader: FRAG,
			transparent: true,
			depthTest: false,
			depthWrite: false
		});
		material.uniforms = uniforms;
		const quad = new Mesh(new PlaneGeometry(2, 2), material);
		scene.add(quad);

		// ── sizing ──────────────────────────────────────────────────────────────────
		let cssW = 0;
		let cssH = 0;
		const resize = () => {
			if (!host) return;
			const r = host.getBoundingClientRect();
			cssW = r.width;
			cssH = r.height;
			renderer.setSize(cssW, cssH, false);

			// The hero is pulled up by navH (hidden above viewport). Total hero height =
			// host height. Each VISIBLE band is half the VIEWPORT, but our canvas covers
			// the full pulled hero. Match the CSS: split at 50% of the *visible* viewport.
			// host height = 100svh + (navH + 4rem) pull... we just split the canvas in two
			// equal halves of the host; the CSS over-pull is cosmetic for the navbar.
			const splitFrac = 0.5;
			uniforms.uSplit.value = splitFrac;
			const topH = cssH * splitFrac;
			const botH = cssH - topH;

			// Top word (VSK): top-anchored, small gap under navbar. font from band height.
			// visible top band ≈ topH - navH; size caps to fill it minus a small gap.
			top.fontPx = Math.max(10, (topH - navH - 3.5 * 16) / CAP_RATIO);
			top.padTop = navH + 4; // small gap below the navbar (closer to the top edge)
			// Bottom word (RASPORED): fills its band.
			bot.fontPx = Math.max(10, (botH + 16) / CAP_RATIO);

			const dTop = drawBand(top, T.ctx, T.c, topH);
			const dBot = drawBand(bot, B.ctx, B.c, botH);
			// The canvas just changed size; force a full re-upload (not a partial
			// texSubImage, which triggers a CHROMIUM offset-overflow warning).
			T.tex.dispose();
			B.tex.dispose();
			T.tex.needsUpdate = true;
			B.tex.needsUpdate = true;
			// strip = (tileWidthPx, bandWidthPx). tileW is in CSS px already.
			uniforms.uStripTop.value = [dTop.tileW, cssW];
			uniforms.uStripBot.value = [dBot.tileW, cssW];

			// Scroll speeds (px/s) — VSK slower than RASPORED, like the CSS (90s vs 76s).
			// One full tile (two words) should pass in ~T seconds; pick T so the feel
			// matches the old marquee (slow VSK, faster RASPORED).
			// Positive speed scrolls the words RIGHT→LEFT (content moves leftward).
			top.speed = dTop.tileW / 58;
			bot.speed = dBot.tileW / 62;
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(host);

		// ── glitch burst scheduler (shared envelope → both words in sync) ────────────
		let burstUntil = 0;
		let burstStart = 0;
		let nextBurst = 0;
		const rand = (a: number, b: number) => a + Math.random() * (b - a);

		// ── animation loop ───────────────────────────────────────────────────────────
		let raf = 0;
		let last = performance.now();
		nextBurst = last + rand(1200, 3200);

		const tick = (now: number) => {
			raf = requestAnimationFrame(tick);
			const dt = Math.min(0.05, (now - last) / 1000);
			last = now;
			uniforms.uTime.value = now / 1000;

			// scroll — accumulate px (positive speed = words move right→left), wrap to one
			// tile so the float stays small. RepeatWrapping makes any value valid; the
			// modulo is just for precision.
			if (!FREEZE) {
				uniforms.uScrollTop.value += top.speed * dt;
				uniforms.uScrollBot.value += bot.speed * dt;
				const tT = uniforms.uStripTop.value[0] || 1;
				const tB = uniforms.uStripBot.value[0] || 1;
				uniforms.uScrollTop.value = ((uniforms.uScrollTop.value % tT) + tT) % tT;
				uniforms.uScrollBot.value = ((uniforms.uScrollBot.value % tB) + tB) % tB;
			}

			// glitch envelope
			if (PIN_GLITCH) {
				// DEV (?glitch=1): hold a burst on, re-seeding ~8×/s, for visual tuning.
				uniforms.uSeed.value = Math.floor(now / 120);
				uniforms.uGlitch.value = 0.9;
			} else if (!prefersReduced) {
				if (now >= nextBurst && now > burstUntil) {
					burstStart = now;
					burstUntil = now + rand(180, 520); // short burst
					uniforms.uSeed.value = Math.random() * 1000;
					nextBurst = burstUntil + rand(1800, 5000);
				}
				if (now <= burstUntil) {
					// envelope: fast attack, jittery sustain, quick release
					const t = (now - burstStart) / (burstUntil - burstStart);
					const env = Math.sin(t * Math.PI); // 0→1→0
					// add high-freq flicker so it stutters like datamosh frames
					const flick = 0.6 + 0.4 * Math.sin(now * 0.08) * Math.sin(now * 0.21);
					uniforms.uGlitch.value = Math.max(0, env * flick);
				} else {
					uniforms.uGlitch.value = 0;
				}
			}

			renderer.render(scene, camera);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			material.dispose();
			quad.geometry.dispose();
			T.tex.dispose();
			B.tex.dispose();
			renderer.dispose();
			renderer.domElement.remove();
		};
	});
</script>

<div class="hero-glitch" bind:this={host} aria-hidden="true"></div>

<style lang="scss">
	.hero-glitch {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2; // above the videos, below the navbar/text block
	}
</style>
