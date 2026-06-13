<script lang="ts">
	// The spinning bow model + lights + orbit controls. Runs INSIDE a Threlte <Canvas>.
	// Behaviour:
	//  - When `active` flips true (the section is ~30% in view), the auto-spin starts
	//    FAST and eases down to a SLOW CONSTANT spin (exponential decay toward a floor).
	//  - The user can ORBIT by dragging (no zoom, no pan). While dragging the auto-spin
	//    pauses; it resumes a moment after release.
	//  - On load the model is auto-CENTERED and SCALED to a fixed size, so any model
	//    (whatever its native units/origin) fills the frame consistently.
	import { T, useTask } from '@threlte/core';
	import { GLTF, OrbitControls } from '@threlte/extras';
	import { Box3, Vector3, Mesh, type Group, type Object3D } from 'three';

	let {
		url,
		active = false,
		fixRotation
	}: { url: string; active?: boolean; fixRotation?: [number, number, number] } = $props();

	// Spin model: angular velocity (rad/s) decays from FAST → SLOW_CONSTANT.
	const FAST = 6.0; // initial spin speed (rad/s) right after it enters view
	const SLOW = 0.5; // constant cruising spin speed it settles to
	const DECAY = 1.6; // how quickly the fast spin eases down to SLOW (higher = faster)

	// Target on-screen size: the model's largest dimension is scaled to this many world
	// units, so the camera (below) frames it the same regardless of the model's units.
	const FIT_SIZE = 3.9;

	let elapsed = $state(0); // seconds since the intro spin started
	let started = $state(false); // intro has begun (first time only)
	let dragging = $state(false); // user is actively orbiting → pause auto-spin

	// Start the intro the first time the section becomes active.
	$effect(() => {
		if (active && !started) started = true;
	});

	// `spinner` is the group we rotate; the loaded model is recentered + scaled INSIDE
	// it (so rotation is around the model's centre, not its arbitrary origin).
	let spinner = $state<Group>();

	// Hide any node whose name marks it as an arrow (the recurve model ships with an
	// "Arrow_*" node we don't want shown). Done BEFORE fitting so the bounding box
	// (and thus the centre/scale) is computed from the bow alone.
	function hideArrow(model: Group) {
		model.traverse((o) => {
			if (/arrow/i.test(o.name)) o.visible = false;
		});
	}

	// Bounding box over only the VISIBLE meshes (Box3.setFromObject includes invisible
	// ones, which would let the hidden arrow still inflate the box). Build it manually.
	function visibleBounds(model: Object3D): Box3 {
		const box = new Box3();
		model.updateWorldMatrix(true, true);
		model.traverse((o) => {
			if (o instanceof Mesh && o.visible) box.expandByObject(o);
		});
		return box;
	}

	// Recenter the loaded model to the origin and scale it to FIT_SIZE. The bow's long
	// (handle) axis is already roughly vertical on screen as authored; the spinner
	// rotates it about that vertical handle axis (see useTask), so it spins in place.
	function fitModel(model: Group) {
		hideArrow(model);
		// Orientation fix (per-model): some models ship lying horizontal; rotate them
		// upright BEFORE measuring so the centre/scale are computed in the final pose.
		if (fixRotation) {
			model.rotation.set(fixRotation[0], fixRotation[1], fixRotation[2]);
			model.updateWorldMatrix(true, true);
		}
		const box = visibleBounds(model); // bow only — the hidden arrow is excluded
		const size = box.getSize(new Vector3());
		const center = box.getCenter(new Vector3());
		const maxDim = Math.max(size.x, size.y, size.z) || 1;
		const scale = FIT_SIZE / maxDim;
		model.scale.setScalar(scale);
		// Offset so the model's centre sits at the spinner's origin.
		model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
	}

	useTask((delta) => {
		if (!spinner || !started || dragging) return;
		elapsed += delta;
		// speed = SLOW + (FAST - SLOW) * e^(-DECAY * t)  → starts at FAST, eases to SLOW.
		const speed = SLOW + (FAST - SLOW) * Math.exp(-DECAY * elapsed);
		spinner.rotation.y += speed * delta;
	});
</script>

<!-- Camera + orbit controls: rotate only (no zoom, no pan). Damping for smooth feel.
     onstart/onend pause/resume the auto-spin while the user drags. -->
<T.PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45}>
	<OrbitControls
		enableZoom={false}
		enablePan={false}
		enableDamping
		dampingFactor={0.08}
		rotateSpeed={0.7}
		onstart={() => (dragging = true)}
		onend={() => {
			// Resume the slow auto-spin shortly after the user lets go.
			setTimeout(() => (dragging = false), 400);
		}}
	/>
</T.PerspectiveCamera>

<!-- Lighting (mandatory for glTF PBR materials, else the model renders black). A few
     lights from different sides so the dark bow materials read against the dark bg. -->
<T.AmbientLight intensity={1.4} />
<T.DirectionalLight position={[4, 8, 5]} intensity={2.4} />
<T.DirectionalLight position={[-5, 2, -4]} intensity={1.4} />
<T.DirectionalLight position={[0, -3, 6]} intensity={1.0} />

<!-- The spinner group we rotate; the centred + scaled model lives inside it. -->
<T.Group bind:ref={spinner}>
	<GLTF {url} onload={({ scene }) => fitModel(scene)} />
</T.Group>
