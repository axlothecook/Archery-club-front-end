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
- [ ] `klub/povijest` (history grid 4-col + `/:slug` detail). **Include the full VSK Olympic-Charter founding
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
- [ ] `sponzori` (sponsors grid; data already in `+layout.ts`).
- [ ] `postignuca` (achievements; `/achievements/summary` → stats + grouped cards).

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

## PHASE 2 — DASHBOARD / ADMIN UI (separate app, AFTER the public site ships 15.6)
The backend already exposes a full `/admin/*` CRUD API (auth, every entity, image upload, inquiries inbox)
but there is NO admin frontend yet. Per the handoff the dashboard is a SEPARATE app/subdomain; the public
site only links to it via a discreet footer "Prijava". Decided 2026-06-08: finish + deploy the public site
by 15.6 FIRST, then write a dedicated dashboard plan and build it. Rough scope (its own multi-day project):
- [ ] Scaffold the dashboard app (own repo or subdir) + auth (login/logout, protected routes, session cookie).
- [ ] CRUD UIs per entity: sponsors, archers/roster, articles/news, events, achievements, event-levels, hero,
  club-info (contact fields), club-identity/history (if editable).
- [ ] Image/video upload UI → `/admin/upload` (R2). Inquiries inbox (membership/sponsor/donation) + reply.
- [ ] Invite/accept-invite + forgot/reset password flows. Deploy (its own subdomain + tunnel).

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
