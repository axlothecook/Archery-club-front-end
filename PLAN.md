# Archery Website — Sprint to 15.6

**Start:** Mon 8.6.2026 · **Hard done:** end of Mon 15.6 · **Buffer:** Tue 16.6 (free if on track)
**Fallback window:** after 24.6 (only if we miss 15.6)
**Capacity:** ~12h/day (24h − 8h sleep − 4h reserve), every day
**Method:** piece-by-piece, browser-verified, **explicit approval before any commit**
**Slip-allowed past 24.6:** Three.js 3D bow *assets* only (component ships with a placeholder model);
homepage Three.js div left out for now; PSG-style schedule intro video (tool TBD, scope together).

## Scope (all must ship by 15.6)
Front-end · Back-end · DB · custom CI/CD deploy · daily data backup.

## Verified starting state (2026-06-08)
- ✅ `Archery-contracts` — done (shared TS types, Pattern-B i18n, `file:` dep).
- ✅ `Archery-club-backend` — mature: Express 5 + **Prisma 7 + PostgreSQL** (:3100), full public + `/admin` CRUD,
  session auth, R2 upload, Google-translate backfill, 7 integration test files, seed data present.
- ✅ Front-end chrome — TopBar + Footer merged. Menu = WIP on `feature-menu` (`4d5833d`, not merged).
- ⚠️ 9 placeholder pages: home, klub/povijest, klub/identitet, najnovije, momcad, raspored, postignuca, kontakt, sponzori.
- 🔴 GREENFIELD (nothing yet, either repo): no Docker, no Caddy/nginx, no `.github/workflows`, no backup scripts.
- Deploy plan: reuse game-shop pattern — Pi (IceCreamTruck) + Docker Compose + Cloudflare Tunnel (public site)
  + Tailscale (CI→Pi) + nightly backup adapted to Postgres `pg_dump`.

---

## Day-by-day

### Day 1 — Mon 8.6 · Menu + page template
- [x] **Menu DONE** (2026-06-08): rebuilt Gucci-style — flat list w/ one-level drill-down (Identitet → Grb/Dres/
  Vrijednosti, slow 0.7s slide, slow-fade › arrow), 3 text tiers (big/middle Kontakt/small email-phone-Prijava),
  center-out gold (`var(--color-accent)`) underline on direct links, upward-flying locale flag dropdown, close-X
  top-right. svelte-check 0 errors. ⏳ NOT yet committed/merged — awaiting user OK to commit+merge `feature-menu`→main+push.
- [x] **`klub/identitet` DONE** (2026-06-08, pushed): Barça-style frame (gold "Identitet" hero fading into page bg,
  tab bar inside the white card with animated gold center-out underline) + all 3 tabs — Vrijednosti (quote + olympic
  image + 4 value blocks), Dres (jersey timeline), Grb (crest). `$lib/identity.ts` slug map; `[slug]` route handles
  single+gallery kinds; page bg = sponsors-cap colour (rule). Library palette throughout. This is the TEMPLATE for the
  rest of the content pages. Gotcha: Croatian URL slugs (grb/dres) map to backend slugs (crest/jersey) via `apiSlugFor`.

### Day 2 — Tue 9.6 · Data-driven content pages
- [x] **`klub/povijest` DONE + pushed (2026-06-09, FE c190ff5)**: history LIST grid (Klub kroz godine +
  founder quote) + chapter `[slug]` detail (Barça-mirror: sticky cover, scroll-over title, flourish, related
  "POVEZANO" auto-scroll marquee, sticky-in-panel X button, View-Transitions list↔chapter slide). Design
  LOCKED IN by user. The Olympic-Charter founding text below is on the Identitet/Vrijednosti page.
  IN PROGRESS (uncommitted): shared `SectionExplore` "MOŽDA ĆE VAM SE SVIDJETI" block on Identitet (needs real
  Postignuća/Sponzori images + roll-out). TODO: bullet-point last-paragraph per chapter; global page-load loader SVG.
- [~] `klub/povijest` (history grid 4-col + `/:slug` detail). **Include the full VSK Olympic-Charter founding
  text (user-supplied, transcribe VERBATIM — Croatian, do NOT paraphrase; source vsk.hr/o-klubu):**
  > Ovo je Olimpijska povelja. / Svi koji se bave sportom, kad ju pročitaju to će i reći. / Olimpijska povelja. /
  > Savjetujemo svima da je čitaju svaki dan. Čak više puta dnevno. / Kad ju zapamtite, čitajte ponovo. / Čitajte
  > između redaka. / Razumijete? / Ne? Da Vam pojasnim…. / Između ostalog u tom tekstu piše da sport nije ničije
  > vlasništvo. / Piše da imate pravo na slobodan odabir vrste sporta kojom se želite baviti, odabir natjecanja na
  > kojem želite sudjelovati, odabir kluba u kojem ćete trenirati, pravo na trenera s kojim Vi želite trenirati,
  > pravo na tim čiji dio Vi želite biti. / Pravo na prijatelje s kojima želite dijeliti osmjehe nakon pobjede. /
  > Pravo na prijatelje koji će razumjeti zašto nakon takmičenja plačete…. / Ovo je samo mali dio toga što se može
  > isčitati između redaka Olimpijske povelje. / Pročitajte ponovo. Razmislite. / U sportu Vam nitko ne može
  > nametati svoju volju. / Nitko Vas ne može prisiliti ni da budete u njemu, ako osjećate nelagodu. / Ako trenirate
  > bez volje. / Ako se ne osjećate kao dio tima. / Ako Vas okružuju ljudi s kojima Vam nije ugodno….. / Pročitajte
  > još jednom….maknite se, promjenite sport, klub, okolinu….krenite ispočetka. / Oslobodite se. / Sport je samo Vaš
  > izbor. / 10.10.2014. osnovan je Varaždinski streličarski klub. / Na načelima Olimpijske povelje. / Od strane
  > ljudi koji su je znali pročitati između redaka.
- [x] **`postignuca` DONE + pushed (2026-06-09 PM, FE 87368ef; BE 5899b3f)**: PSG-honours zig-zag
  (alternating image/text, images meet at the centreline corners), TRANSPARENT card on the dark bg,
  white headings + #ccc years, tier-ordered world→EU→state, FULL-width golden explore block, flourish,
  hero shows lower part of `achivements-cover-2.jpg`. Data = `/achievements/summary`. Backend data fixed
  at source: Conquest 3, Prvenstvo Hrvatske 66, Državni rekord 65 (2015–2026; PH/DR via year-only filler
  rows). Hid the date-unknown "Svjetski i europski juniorski rekord" (BE TODO "if adopted").
- [~] **`sponzori` BUILT, UNCOMMITTED on `feature-sponzori-page`**: mirrors the user's prototype
  (`axlothecook.github.io/VSK-archeryClub/sponsors.html`, Barça-inspired). Hero "SLUŽBENI PARTNERI" + HR
  intro + "PRIDRUŽITE SE" → **sponsor-inquiry modal (POST /inquiries/sponsor)**; 5 alternating offset
  partner cards (logo + HR desc + website link INLINE in the closing sentence); "Počasno priznanje" quote;
  flourish + golden explore block. NEXT: commit it, then rework `postignuca` to this sponsors-card style.

### Day 3 — Wed 10.6 · News + Contact
- [ ] `najnovije` (news feed, cursor-paginated `/articles`, load-older) + article detail template (`/articles/:slug`).
- [ ] `kontakt` (ONE page, 3 forms as tabs/sections: Učlanjenje/tryouts → `/inquiries/membership`,
  Sponzorstvo → `/inquiries/sponsor`, Donacija → `/inquiries/donation`; honeypot + consent). Menu keeps a single
  medium-tier "Kontakt" link (decided 2026-06-08) — forms are NOT separate routes.

### Day 4 — Thu 11.6 · Roster + archer profile
- [ ] `momcad` (roster grid, `/team`).
- [ ] Archer profile `/team/:slug` (bio, stats, performance, achievements) + **Three.js bow viewer with placeholder model**.

### Day 5 — Fri 12.6 · Homepage + schedule + legal
- [ ] Homepage `/`: hero (`/hero`) + sections; **remove temp `.dev-filler`**; leave Three.js div OUT (post-24.6).
  - [ ] **Reveal-on-scroll animation** — reuse the `use:reveal` IntersectionObserver action built on the schedule page (`src/routes/raspored/+page.svelte`): block fade-up (`.reveal-block`) + staggered card reveal (`.reveal-item` with an inline `transition-delay`), one-shot, respects `prefers-reduced-motion`. Apply it to the homepage's sections/cards. (Consider extracting `reveal` into `src/lib/` if 2+ pages use it — per the DRY rule.)
- [ ] `raspored` (schedule, RM-card style; intro-video PLACEHOLDER — scope PSG-style video tool with user).
- [ ] Legal page stubs (footer `#` links).
- [ ] Full site click-through + responsive sweep.

### Day 6 — Sat 13.6 · 🔴 DEPLOY STACK (highest risk)
- [ ] Dockerize backend (+ Postgres) and front-end (adapter-node) + `docker-compose.yml`.
- [ ] Reverse proxy (Caddy/nginx) + Cloudflare Tunnel for the public site.
- [ ] Migrate Supabase image URLs → R2 (crest, sponsors, identity, roster, hero, navbar logo). Backend R2 plumbing exists.
- [ ] **🚫 Make archery FULLY INDEPENDENT of Supabase before CI/CD** — sweep every `*.supabase.co` URL (front-end
  hardcoded URLs in components incl. TopBar logo, identity hero/olimpic image, Footer logo + sponsor logos, and any
  backend seed/data) and repoint to R2. Grep for `supabase` across both repos; zero references must remain at deploy.
- [ ] Verify: full stack runs in Docker locally; tunnel serves site on a real hostname.

### Day 7 — Sun 14.6 · 🔴 CI/CD + backup
- [ ] `.github/workflows` deploy: build → push → Tailscale → Pi → `compose pull && up -d`.
- [ ] Nightly Postgres backup (`pg_dump` cron on Pi + pull to PC; 2-tier like game-shop).
- [ ] First real deploy to Pi; create admin; seed import on live DB; translate-backfill.
- [ ] Verify: push to main auto-deploys; backup runs + restorable; site live on its domain.

### Day 8 — Mon 15.6 · Buffer / hardening
- [ ] Absorb slipped page work, deploy bugs, content fixes, a11y/SEO/meta, mobile pass.
- [ ] Final end-to-end: forms email, locale switching, image cache versioning, 404s.
- [ ] Verify: whole site works on the live domain. **DONE.**

### Tue 16.6 — free buffer (untouched if on track)

---

## PHASE 2 — DASHBOARD + FULL DEPLOY · 7-DAY SPRINT (Mon → Sun, ~12h/day)
**Goal:** ship a CLIENT-READY admin dashboard (the WHOLE thing, handed to a client) AND the public
site, both LIVE on the Pi, in 7 days. Established 2026-06-15.

### Verified starting state (2026-06-15, checked against the code — corrects earlier notes)
- ❌ **There is NO separate "dashboard repo."** The admin lives INSIDE the two existing repos.
- ✅ **Dashboard BACKEND is essentially DONE.** Full session auth (login/logout/me, invite, accept-invite,
  forgot/reset — bcrypt + action tokens + email) and **37 `/admin/*` write endpoints** across 11 routers
  (sponsors, achievements, archers, articles w/ draft→publish, events, event-levels, hero, club-info,
  inquiries+reply, upload, dev), ALL `requireAuth`-gated. Prisma 7 + Postgres, 30 models.
- ❌ **Dashboard FRONTEND does not exist.** No `/prijava`, `/admin/*` in SvelteKit; "Prijava" = dead `#`
  link. **This is the bulk of the 7 days.**
- ✅ **Public site pages all BUILT** (home, klub/identitet+povijest, najnovije, momcad, postignuca,
  raspored, kontakt, sponzori, legal). Stack: SvelteKit 2.57 + Svelte 5 + **adapter-node**.
- 🔴 **Supabase URLs still in ~10 FE files** (NavBar logo, Footer, RosterCard×4, identity hero, …) —
  HARD deploy blocker (rule: zero `supabase` refs at deploy). Must migrate to R2.
- 🔴 **Deploy = GREENFIELD.** No Dockerfile/compose/nginx/CI in either repo. No deploy repo.

### 🔑 TOPOLOGY DECISION — same-origin (RESEARCH-VERIFIED 2026-06-15, 10+ sources)
Serve the **public site, the `/admin` dashboard, AND the API on ONE origin**
(`<vsk-host>.axlothecook.com`), API reverse-proxied at **`/api`**. Dashboard = routes INSIDE the
existing SvelteKit app (`/prijava`, `/admin/*`), NOT a separate app/subdomain.
- **Why (verified vs MDN + RFC 6265bis):** `app.*` and `api.*` subdomains are *same-site* but NOT enough —
  SvelteKit's default `SameSite=Lax` cookie is NOT sent on cross-origin `fetch()` (MDN: Lax excludes fetch
  + subresources). A split forces `SameSite=None; Secure`, which Safari ITP / Firefox TCP / Brave drop or
  partition → the "works on PC, fails on phone, `Failed to fetch`" trap (the exact Create_Resume bug).
  Same-origin keeps the cookie first-party `Lax`, no CORS, no strict-browser breakage. See
  [[same-origin-api-to-avoid-cross-site-cookie-block]] + [[secure-cookie-needs-https-force-redirect]].
- **Stack fit:** adapter-node SvelteKit server + Express API both behind one nginx (or the Tunnel ingress):
  `/api/*` → Express container; everything else → SvelteKit Node server. + Cloudflare "Always Use HTTPS".

### ⚠️ PRE-FLIGHT FIXES & GOTCHAS (found by an adversarial code+plan sweep 2026-06-15, each verified vs source)
Do these BEFORE/INSIDE the relevant day or the sprint hits known walls. 🔴 = blocker.
- 🔴 **Cookie is `SameSite=strict`, NOT Lax** (`backend/src/auth/cookies.ts:13,19`). This CONTRADICTS the
  topology note above. Strict is withheld on top-level cross-site navigations INTO the site, so the planned
  `/admin` `+layout.server.ts` guard calling `/api/auth/me` after an emailed invite/reset link (or any
  external link) sees NO cookie → bounces a logged-in admin to `/prijava`. **Change to `sameSite: "lax"`**
  (Day 1). Lax still covers CSRF here: same-origin API + POST/PUT/DELETE mutations aren't sent cross-site.
- 🔴 **FE API base must stay ABSOLUTE, not `/api`** (`frontend/src/lib/api.ts:39` does `new URL(path, BASE)`,
  which THROWS on a relative base). Day-5's "`API_URL=/api` (relative)" would break every page's data load.
  Fix: in prod set `PUBLIC_API_BASE_URL=https://<vsk-host>.axlothecook.com/api` (absolute) and let nginx route
  it — OR rewrite api.ts to build path-only. (Same-origin still holds; the browser request is same-origin.)
- 🔴 **nginx MUST strip the `/api` prefix** — Express mounts routes at bare paths (`/auth`, `/admin`, …, no
  `/api`). Use `location /api/ { proxy_pass http://backend:3100/; }` (trailing slash on BOTH = strips `/api`).
  A no-slash `proxy_pass` 404s the whole API. Day-5 smoke test: `curl https://host/api/health`.
- 🔴 **Postgres needs a NAMED VOLUME** — run PG as its OWN compose service with
  `pg_data:/var/lib/postgresql/data`; never bake it into the backend image. Without the volume, the Day-7 CI
  `compose pull && up -d` wipes the club DB on every redeploy. Verify `down && up -d` preserves data (Day 5).
- 🔴 **Supabase→R2 is bigger than the FE** — live DB rows + **8 backend seed files** still hold dead
  `*.supabase.co` URLs (achievement-categories, achievements, club-history, crest, home-stat-images, jersey,
  roster residual, sponsors); only `posts.json`+`roster.json` have migration scripts. Day 5: migrate ALL seed
  JSON **and** add a one-off DB `UPDATE` sweep of every `*Url` column (admin-edited rows aren't in the seed).
- **CORS + prod env**: set `CORS_ORIGINS=<prod origin>`, `DASHBOARD_URL=https://<vsk-host>...` (else invite
  emails link to `localhost:5173`), a FRESH prod `AUTH_TOKEN_SECRET`, and `DATABASE_URL` → the compose PG
  service. Hand-place a prod `.env` on the Pi (gitignored) via compose `env_file:`. Add a startup guard that
  throws if any required env is missing (fail fast, not 500s).
- **`app.set('trust proxy', 1)`** — behind nginx+Tunnel, else the inquiries rate-limiter keys every client to
  the proxy IP (one shared bucket). Low blast radius but real.
- **Reset-password token is replayable** for its 30-min window (no nonce/`passwordChangedAt` binding,
  `auth/action-token.ts`). Bind it to server state. (Security hardening, not deploy-blocking.)
- **`import-seed` is NOT safe to re-run on a live DB** — it resets `adminEdited:false` and overwrites admin
  edits. Treat as one-time bootstrap; gate behind an empty-DB check.

### Day 1 (Mon) — Dashboard auth shell
- [ ] `/prijava` login page → `POST /api/auth/login`; on success → `/admin`. Wire the menu's dead `#` link.
- [ ] `/admin` protected layout: a SvelteKit `+layout.server.ts`/hook that calls `/api/auth/me`, redirects to
  `/prijava` if 401; admin shell (sidebar nav per entity, logout). Verify the session cookie round-trips.
- [ ] `accept-invite` + `reset-password` + `forgot-password` pages (the backend tokens already exist).
- [ ] Typed admin API client (mirror the public one) hitting `/api/admin/*`, `credentials: 'include'`.
- [ ] 🔴 **FIRST: switch cookie to `sameSite: "lax"`** (`backend/src/auth/cookies.ts`) + add a backend
  integration test asserting login's `Set-Cookie` carries `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
- [ ] 🧪 FE: a hook/load test that an unauthenticated `/admin` request (mock `/api/auth/me` → 401) redirects
  to `/prijava` (this is the regression net for the whole guard; FE already has vitest + Playwright installed).
- [ ] 🧪 Backend: integration test for the EXPIRED/idle session path (back-date `expiresAt` → `/auth/me` 401 +
  row deleted) — the session path gates all 37 admin endpoints and is currently untested.

### Day 2 (Tue) — Highest-churn editors: Articles/News + Events
- [ ] Articles list + create/edit (incl. the draft → publish-draft → delete-draft workflow) + image upload.
- [ ] Events + event-levels CRUD. Verify each against the live API (create/edit/delete round-trips).
- [ ] 🧪 Backend integration test for the **articles draft lifecycle** (PUT `/:id/draft` → assert public feed
  still shows OLD content → POST `/publish-draft` → assert public reflects new + `draftRevision` cleared).
  This is bespoke state-machine logic, currently ZERO coverage, and it's the editor you build today.
- [ ] 🧪 Backend CRUD round-trip tests for **events + event-levels** (both fully untested today).
- [ ] 🧪 FE component test: a 400 with `error.fields` renders inline field errors (one editor proves the pattern).

### Day 3 (Wed) — Roster + Achievements + Sponsors
- [ ] Archers (roster) CRUD (bio, stats, performance, per-archer achievements, roles, image).
- [ ] Achievements CRUD + Sponsors CRUD (translations where the API expects them).
- [ ] 🧪 Backend CRUD round-trip test for **achievements** (untested router). (Sponsors/archers already covered.)

### Day 4 (Thu) — Remaining editors + Inquiries inbox + Uploads
- [ ] Hero images, club-info (contact fields incl. the new phone), club-identity/history (if editable).
- [ ] Inquiries inbox (membership / sponsor / donation) — list, mark status, reply.
- [ ] Reusable image/video upload component → `/api/admin/upload` (R2). Dashboard click-through QA pass.
- [ ] 🧪 Backend tests: **hero** CRUD round-trip; inquiries **status-PATCH + sponsor/donation** inboxes
  (only `membership` list+reply is covered today) — parametrize the existing membership test over all 3 types.
- [ ] 🧪 FE upload-component test: spoofed-type + video-on-non-article rejection messages surface gracefully.

### Day 5 (Fri) — 🔴 Kill Supabase → R2, then Dockerize
- [ ] Sweep EVERY `*.supabase.co` URL in **both repos** — FE (NavBar/Footer/RosterCard/identity/…) AND the
  **8 backend seed JSONs** (achievement-categories, achievements, club-history, crest, home-stat-images,
  jersey, roster, sponsors) → repoint to R2 (`images.axlothecook.com`). Generalize the migration to walk ALL
  seed JSON, not just posts/roster.
- [ ] **One-off DB `UPDATE` sweep** of every `*Url` column on the live DB (admin-edited rows aren't in seed).
- [ ] 🧪 CI grep-guard that FAILS the build if any `*.supabase.co` string remains in either repo (turns the
  "ZERO refs" rule from a manual grep into an enforced gate).
- [ ] Dockerfile (FE adapter-node) + Dockerfile (backend) + **Postgres as its OWN service** with a named
  `pg_data` volume + `docker-compose.prod.yml`. nginx: `location /api/ { proxy_pass http://backend:3100/; }`
  (trailing slash strips `/api`), `/` → SvelteKit. Prod `PUBLIC_API_BASE_URL` = ABSOLUTE `https://host/api`.
- [ ] Prod env on the Pi (gitignored, via compose `env_file:`): fresh `AUTH_TOKEN_SECRET`, `DATABASE_URL` →
  compose PG, `CORS_ORIGINS` + `DASHBOARD_URL` = prod host, R2 creds. Add a startup fail-fast env guard.
- [ ] Verify locally: full stack in Docker; `curl /api/health` 200; login round-trips same-origin; **`compose
  down && up -d` preserves the DB** (proves the volume).

### Day 6 (Sat) — 🔴 Cloudflare Tunnel + first live deploy
- [ ] Cloudflare Tunnel: one public hostname → nginx (game-shop pattern: Service Type HTTP, `host:port`, no
  scheme). "Always Use HTTPS" ON. Bring the stack up on the Pi (`IceCreamTruck`, `100.97.123.51`).
- [ ] Create the first admin (invite flow) on the live DB; seed import (ONE-TIME, empty DB); translate-backfill.
- [ ] Verify: public site live on the domain; dashboard login works on a PHONE (strict-browser cookie test);
  the emailed invite link resolves to the live host (not localhost), proving `DASHBOARD_URL`.

### Day 7 (Sun) — 🔴 CI/CD + backup + harden
- [ ] `.github/workflows` deploy: build → GHCR → Tailscale → Pi → `compose pull && up -d` (reuse game-shop's
  5 secrets + Node-24 action majors; `appleboy/ssh-action@v1` stays). Verify push-to-main auto-deploys
  **AND that the redeploy preserves DB data** (the volume test, now live).
- [ ] Nightly **`pg_dump`** backup (Pi cron + PC scp pull, 2-tier like game-shop). **Actually restore** the
  archive into a scratch DB and assert row counts (not just a checkbox — the game-shop restore drill).
- [ ] Run the full test suite (`npm run test:all` backend + FE `npm run test`) green in CI before deploy.
- [ ] Full end-to-end: forms email, locale switch, image cache, 404s, mobile pass. **DONE — client-ready.**

### Risks (this sprint)
1. Days 5–7 (Supabase→R2 + greenfield deploy) = the blow-up risk, exactly as the public sprint warned.
   First Docker/CI for these repos, Postgres-not-Mongo. Front-loaded; cut dashboard polish before deploy.
2. 37 endpoints → a lot of CRUD UI in Days 1–4. If it slips, the Day-2 priority order (news/events first)
   means the highest-value editors ship even if the rarest (hero/identity) slip to "after live."
3. Strict-browser cookie test (Day 6 phone check) is the gate that proves the same-origin decision held.

## If website gets adopted (only build IF the club commits to running the site)
Features that only make sense once the club actively maintains the site; skip until then.
- [ ] **⚖️ TOP PRIORITY — LEGAL IP REVIEW before formally adopting as the OFFICIAL site.** Get a binding read
  from a Croatian / EU intellectual-property attorney. Context: the site recreates common layout/look patterns
  inspired by other sports clubs' sites (carousel, "mentioned players" cards, alternating-image honours, hero/cover,
  newsletter band) — all built FROM SCRATCH, with NO copied logos, brand names, photos, text, code, fonts, or icons.
  Research (2026-06-10, 15+ confirmed US + EU sources: idea/expression dichotomy, *Cofemel*, *BSA v Ministerstvo
  kultury* C-393/09, *Apple v Microsoft*, *Lotus v Borland*, *Wal-Mart v Samara*, *TrafFix*, EU unfair-competition
  / passing-off / slavish-imitation) concluded the risk is **very low / negligible** for generic from-scratch
  patterns — but that is general info, NOT legal advice. The Croatia-specific contour is supported only by ANALOGY
  to the harmonized EU framework + representative CEE imitation rules (the Croatian statute text couldn't be pulled
  directly), so an attorney should confirm before the club puts its name on it. 🔴 STAYS RED until reviewed: copied
  code/CSS, copied images/photos/icons, unlicensed fonts, any reproduced logo/crest/wordmark, or a look so close it
  implies affiliation with a famous brand.
- [ ] **Newsletter email signup — WIRE IT UP** — the "enter your email" subscribe box on the news page
  (email/phone/zip + SUBSCRIBE, mirrors the reference `news.html`) is BUILT as a VISUAL-ONLY placeholder
  (2026-06-10): the SUBSCRIBE button is inert (no POST). Making it real needs a mailing-list backend (list
  storage + double opt-in + an email provider e.g. Brevo) the club would have to run. When adopted: add a
  `POST /newsletter/subscribe` endpoint + DB table + provider, then wire the form's button to it.

## Backlog (added 2026-06-08, do AFTER the menu)
- [ ] **Import a custom font (down the line)** — the whole site currently uses Inter (`--font-primary` in
  `src/styles/index.scss`, self-hosted via @fontsource in `+layout.svelte`). Pick + self-host a brand font
  (e.g. via @fontsource or local woff2), wire it into `--font-primary`, keep Inter as the fallback. Re-check
  the gradient-clip headings + Barça-matched weights after swapping (different fonts render weight differently).
- [ ] **Founding/about page text** — add this paragraph (Croatian, transcribe VERBATIM, do not edit):
  > „Varaždinski streličarski klub od svojeg osnutka ima svoje streličare u redovima reprezentacije i oni
  > redovito donose izvanredne rezultate za klub i za Hrvatsku, što je sve posljedica odličnog rada u klubu
  > te izuzetnog zalaganja samih streličara.”
  Origin (user-supplied): facebook permalink story_fbid=pfbid0QESy8Gm…id=100063458080154. (Which page = TBC; likely homepage/about.)
- [x] **Error page DONE** (2026-06-08): root `src/routes/+error.svelte` (one component, switches on `page.status` →
  404 vs generic 500-type, theme-styled, gold center-out underline on the home link) + `src/error.html` last-resort
  fallback (inline styles, renders when the layout itself fails).
- [x] **Footer icons static on hover DONE** (2026-06-08): removed the +2px lift from BOTH sponsor logos and social
  icons (FB/IG/YT) in Footer.svelte; kept the subtle opacity brighten on socials; kept optical-size `.scale()`.

## Menu data note (2026-06-08)
- [ ] **Phone is NOT in ClubInfo** — backend/ClubInfo carries `email` but no phone field. Menu currently hardcodes
  the club phone `+385 98 372 912` (user-supplied) while email is data-driven. TODO: add a `phone` field to ClubInfo
  (backend + seed `club-info.json`) so the menu phone is data-driven like email, then remove the hardcode.

## Menu decisions (locked 2026-06-08)
- Menu is now **Gucci-style FLAT list, left-aligned**, close-X **top-right**. (Two-column RM design ABANDONED.)
- Medium size: Povijest, Identitet, Postignuća, Sponzori, Kontakt. Smallest: Email, Phone, Prijava (Log In, `#` placeholder).
- Hover only: text → deep-sapphire on hover (no pill, no selected state). Email/phone = plain text, not links.
- Excludes TopBar items (Vijesti, Momčad, Raspored) + home. Flag locale dropdown kept (flag + short code, opens downward).
- Active pill = library **deep-sapphire #102E66**: light shade for pill bg, dark shade of the SAME blue for text.
- Remove "Više" group → Sponzori + Kontakt become standalone left items (navigate directly, no right column).
- Sub-items: vertical gap, NO grey background panel.
- Locale = flag dropdown (old design), opens downward, "{flag} HR/EN/…" (short code), placed as last left item below Kontakt with equal gap.
- Menu width: measure RM live, then match (pending browser go-ahead).

---

## Risks
1. Day 6–7 (deploy) is the blow-up risk — first time for these repos, Postgres-not-Mongo, R2 migration.
   Polish + Three.js assets are the slip valve, NOT deploy.
2. 9 pages in 5 days (Days 1–5) is brisk with piece-by-piece approval; heavy design iteration on one page eats the next.
3. Day 8 buffer absorbs ONE slipped day; beyond that we cut polish first.

## Git (strict)
One feature branch → `--no-ff` merge to main → delete branch → push origin main.
🚫 NO `Co-Authored-By: Claude` trailer in any archery repo. Commit/merge/push ONLY on explicit user OK.
