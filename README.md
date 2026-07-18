# Archery club public site
The public website of the archery club, built with SvelteKit, rendered via SSR. It gets its data from the [Express API backend](https://github.com/axlothecook/Archery-club-backend). Links to the login page of [the dashboard](https://github.com/axlothecook/archery-dashboard). Runs on my Raspberry Pi as a Docker container.

![image](https://github.com/user-attachments/assets/7f695e48-671d-497e-9b2b-161dca7b9e42)


## Features
<ul>
  <li>homepage with auto-crossfading hero + animated sections</li>
  <li>weekly and monthly training schedule with a swipeable calendar</li>
  <li>full roster with individual archer profile pages</li>
  <li>individual archer profile page contains interactive 3D bow viewer, real achievements, coaches & students</li>
  <li>pages for achievements, sponsors, club history, and contact (membership, sponsor and donation) inquiry forms; the submissions appear in the dashboard and email the club inbox</li>
  <li>fully responsive, with a dedicated mobile pass across every page</li>
  <li>Croatian + English, switchable via a cookie-driven language toggle</li>
</ul>


## Data flow
The diagram shows how a page gets its data. Every page renders on the server first: the route loader asks the backend for data in the visitor's language, either Croatian or English (for now). If the backend is unreachable, the loader falls back to empty data, so the page still renders, just with no content.

// graph goes here


## Styling
The styling highlights and the tools used to create them:
<ul>
  <li><b>News cards</b> on desktop homepage: fully custom; cards' positions are computed in JS and applied as inline CSS 3D transforms; not featured on phones due to its heavy load</li>
  <li><b>The landing div</b> in schedule page: a pair of looping videos stacked in a column on top of which is a static title, styled with custom SCSS using my sass library's colors and spacing</li>
  <li><b>The 'Join Us' div</b> on the homepage: uses 2 stacked videos that crossfade for a seamless loop via custom Svelte logic; the moving text is a custom `typewriter` Svelte action paused off-screen by IntersectionObserver; the flicker is a pure-CSS `::after` pseudo-element blinking on a keyframe</li>
  <li><b>News carousel</b> in news page: my sass library in combination with Svelte</li>
  <li><b>Page transition:</b> a custom full-screen wipe overlay in the root layout using Svelte state and CSS</li>
  <li><b>Animation on scroll:</b> my own `reveal` Svelte action (IntersectionObserver) with CSS transitions</li>
</ul>


## Testing
The date and calendar logic and the route loaders are covered by 17 unit tests. They run in CI together with the type check before every deploy; if any fail, nothing gets deployed. The deployment pipeline itself is explained in [homelab-ci-cd](https://github.com/axlothecook/homelab-ci-cd).


## Tech stack
[SvelteKit 2](https://svelte.dev/docs/kit) / [Svelte 5 (runes)](https://svelte.dev): whole app; runes forced project-wide <br />
[Threlte](https://threlte.xyz) and [three.js](https://threejs.org): the 3D bow viewer on the homepage and archer profile pages <br />
[GSAP](https://gsap.com): strip morph animation of navbar pill <br />
[View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API): club history chapter open and close animation <br />
[Sass](https://sass-lang.com) + [axlothecook-sass-library](https://github.com/axlothecook/axlothecook-sass-library): global styling <br />
i18n: cookie-driven HR/EN switching of all text on the website <br />
[adapter-node](https://svelte.dev/docs/kit/adapter-node): builds the site into a self-contained Node server that renders pages on the server; it's what runs inside the Docker container on the Pi <br />
[Vite 8](https://vite.dev): used for building and development server <br />
[flag-icons](https://github.com/lipis/flag-icons): the individual country flag icons in the language switcher <br />
[@fontsource/inter](https://fontsource.org/fonts/inter): fonts used in public site and dashboard


## Shared types
The TypeScript data shapes shared with the backend come from [archery-contracts](https://github.com/axlothecook/Archery-contracts), imported as a local file dependency.
