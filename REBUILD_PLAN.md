# TRUP Website — Rebuild Plan

A holistic, production-grade rewrite of the TRUP club website. This document is the single source of truth for the rebuild. It is detailed on purpose: any Claude session or developer should be able to pick up any phase from this document alone.

**Philosophy:** Done right, not fast. Modularity, simplicity, security. Each phase ends in a working, deployable state. No phase begins without explicit user approval.

---

## 1. Why Rebuild

The current app (React 19 SPA + Express) works, but has structural problems that cannot be fixed with patches:

| Problem | Evidence | Why it can't be patched |
|---|---|---|
| **No real DB migrations** | `runMigrations()` in `server/index.ts` runs 30+ raw `ALTER TABLE IF NOT EXISTS` on every boot | Schema history is invisible; rollbacks impossible; production deploys are a gamble |
| **Schema drift** | `prisma/schema.prisma` is missing fields that `runMigrations()` adds (`imageFocalX/Y`, `plannedDistance/Elevation/Duration`) | The "source of truth" schema lies; `prisma generate` produces wrong types, forcing `as any` casts |
| **Weak CSP** | `scriptSrc: ["'self'", "'unsafe-inline'"]` in `server/index.ts` | `unsafe-inline` defeats XSS protection; removing it needs nonces, which need SSR |
| **No input validation** | No server-side schema validation on any route body | Every POST/PATCH trusts the client; injection and bad-data risk |
| **Auth fragmentation** | 3 route files define their own local `authenticate` that skips `lastLogoutAt` revocation | Security logic is copy-pasted and drifts; logout doesn't fully work |
| **Hand-rolled OAuth** | `auth.ts` does manual `fetch` token exchange "z powodu błędów gaxios" | Missing CSRF `state` param; reinventing a solved problem |
| **Duplicated UI styling** | Button styles exist twice — React `Button` variants AND global `.btn-*` classes in `index.css` | Two sources of truth drift; "same look everywhere" is unenforceable |
| **No SSR / SEO** | Client-only SPA | Event pages can't have Open Graph tags or be crawled; slow first paint |
| **No tests** | "There is no test suite" | Every change is unverified; regressions ship silently |

A rewrite solves all of these at the architecture level instead of band-aiding each one.

### 1.1 Bug Fixes Folded Into the Rewrite

**Decision (2026-05-27):** the current app gets **no interim patches**. Every known bug and security gap is fixed *as part of* the rewrite, in the phase noted below. The current app keeps running unchanged until cutover (§10). This is a deliberate trade-off — see the accepted risk in §12.

| Known issue (tracked in `CLAUDE.md`) | Severity | Fixed in | How |
|---|---|---|---|
| 3 routes bypass session revocation (`gpx.ts`, `push.ts`, `users.ts` local `authenticate`) | HIGH | Phase 1 | Single shared `requireUser()`/`requireAdmin()` helper; no local copies |
| OAuth missing CSRF `state` param | MEDIUM | Phase 0 | NextAuth handles `state`/PKCE automatically |
| Weak CSP (`unsafe-inline`) | MEDIUM | Phase 0 | Nonce infrastructure scaffolded in Phase 0 foundation; Phases 1 and 2 build against it; Phase 3 audits and hardens |
| No server-side input validation | MEDIUM | Phase 1 | Zod schema on every handler |
| Duplicated button styling (component + CSS) | LOW | Phase 2 | One variant source via the design system (§6.2) |
| `prisma.$queryRawUnsafe` fragility | LOW | Phase 3 | Replace with typed Prisma queries |
| `as any` casts (schema drift) | LOW | Phase 0 | Schema reconciliation (§8) makes types honest |
| Raw SQL startup migrations | — | Phase 0 | Prisma Migrate replaces `runMigrations()` |
| Multiple `PrismaClient` instances | — | Phase 1 | Single `lib/prisma.ts` singleton |
| Manual cascade deletes in `users.ts` | — | Phase 0 | `onDelete: Cascade` in schema relations (§9) |

---

## 2. Target Stack

| Layer | Current | Target | Rationale |
|---|---|---|---|
| Framework | React 19 SPA + Express | **Next.js 15 (App Router)** | One framework, SSR, RSC, file-based routing, API routes |
| Auth | Custom JWT + manual OAuth fetch | **NextAuth.js v5 (Auth.js)** | Handles OAuth `state`/PKCE, session management, CSRF for free |
| Auth (⚠ edge caveat) | — | — | NextAuth v5's `auth()` **cannot be called directly in Edge Runtime** (used by `middleware.ts`). Required pattern: split into `auth.config.ts` (providers + JWT callbacks, no DB adapter — safe for edge) and `auth.ts` (full config with Prisma adapter — used in RSCs and Route Handlers only). Middleware imports only `auth.config.ts`. Must be validated in Phase 0. |
| DB access | Prisma (raw startup SQL) | **Prisma + Prisma Migrate** | Versioned, reviewable, reversible migrations |
| Validation | None | **Zod** | Typed schemas at every API boundary; shared client/server types |
| Server state | `fetch` + AppContext | **RSC + Server Actions** | Next.js 15 App Router natively handles server data via RSC and mutations via Server Actions; React Query adds redundant abstraction over what the framework already provides |
| UI state | AppContext | **Zustand** (minimal, UI-only) | Only for pure client UI state: toast queue, modal open/close, mobile drawer. Nothing that the server already owns. |
| Styling | Tailwind v4 | **Tailwind v4** (unchanged) | Already good; tokens port directly |
| Component variants | Hand-written variant maps + duplicate CSS | **CVA (class-variance-authority)** | One typed source of truth for variants/sizes |
| Icons | `lucide-react` imported ad-hoc | **`lucide-react` via a central registry** | Consistent icon vocabulary; one-file library swap |
| CSP | `unsafe-inline` | **Nonce-based CSP** | Real XSS protection, enabled by SSR — scaffolded Phase 0, not deferred |
| Forms | react-hook-form | **react-hook-form + Zod resolver** | Validation shared with the API |
| Client polling | `setInterval` + raw `fetch` | **SWR** (polling use cases only) | ~5 kB; wraps `useSWR('/api/…', { refreshInterval })` for data that must auto-refresh after page load (notification dropdown §14.11). Everything else stays RSC + Server Actions — SWR is not the default. |
| Image upload | multer receiving binary in Express | **Route Handler + `lib/storage.ts`** | Next.js Route Handler receives the multipart body; `lib/storage.ts` writes the file to the local volume. No 3rd-party service; no presigned URL indirection needed on a self-hosted server. |
| Image processing | sync sharp in-process | **sync sharp in Next.js Route Handler** | Self-hosted LXC has no serverless timeout. The existing sharp resize + watermark logic runs synchronously in the same Route Handler that receives the upload. `watermark.ts` middleware ports directly. |
| File storage | `uploads/` directory | **Local volume `/var/lib/trup/uploads/`**, accessed via `lib/storage.ts` | A plain directory on disk. Caddy or a Next.js route handler serves files back. `lib/storage.ts` abstracts all reads/writes — swapping to S3 later is one file. MinIO rejected (no benefit at single-server scale). |
| Connection pooler | single persistent pool (Express) | **Prisma built-in pool** (no extra service) | Next.js on LXC runs as a long-lived Node.js process, not ephemeral serverless functions. Prisma's default connection pool is sufficient; Prisma Accelerate and pgBouncer are not needed. |
| Hosting | Self/VPS (tsx) | **LXC container on Proxmox** + Cloudflare proxy | Long-lived Node.js process; LXC is enough isolation, lighter than a full VM, starts in seconds. Cloudflare is already live on the domain (orange-cloud). See §2.1. |

**Kept as-is** (well-built, port directly): all `src/components/` UI primitives, Leaflet GPX rendering, sharp watermark logic (ports to Next.js Route Handler), `watermark.ts` middleware logic, gpxUtils parsing, the Tailwind design tokens.

---

## 2.1 Self-Hosting Infrastructure

All infrastructure decisions are resolved. No items remain "to decide later."

### LXC container on Proxmox

Next.js runs as a long-lived Node.js process in a dedicated **LXC container** on the Proxmox host. A full VM is not needed: Next.js does not require its own kernel, and LXC provides sufficient isolation for a single-tenant club application while using far less RAM and disk and starting in seconds.

Why not a VM: a VM is warranted when the guest needs a different kernel, runs untrusted workloads, or needs live migration. None of those apply here.

### Cloudflare: DNS + proxy (already live)

Cloudflare is already active on the domain (orange-cloud proxy). No Cloudflare setup is needed in Phase 0 — only one verification step remains:

**Verify the origin firewall** accepts inbound HTTP/HTTPS **only from Cloudflare's published IP ranges.** This prevents direct-to-origin requests from bypassing the proxy — which is possible for anyone who learns the home IP via certificate transparency logs or leaked headers. Cloudflare publishes the IP list at a stable URL; a weekly cron refreshes the firewall ruleset automatically.

The free plan covers everything needed at this scale: DNS, reverse proxy, edge TLS, basic WAF, DDoS protection, and "Always Online" cached fallback when the origin is briefly unreachable.

### Local file storage + `lib/storage.ts` abstraction

Uploads (images, GPX) are stored in a plain directory on the LXC container (`/var/lib/trup/uploads/`). Next.js writes files there directly; Caddy or a Next.js route handler serves them back. Zero added services, zero added processes.

**Why not MinIO:** MinIO emulates the S3 API on top of local disk. It is useful when multiple servers share storage or a cloud migration is on the roadmap. Neither applies here. For a single server hosting one app for 50–60 users, MinIO adds a second LXC to maintain, HTTP overhead on every file read, and operational complexity for no observable benefit.

**`lib/storage.ts` is the insurance policy:** every file read/write in the application goes through this module. Its current implementation is a thin `fs` wrapper. If storage ever needs to move (to S3, R2, or anything else), the change is one file — no application-wide refactor.

## 2.2 Operational Security & Backups

### Origin firewall

Cloudflare is the only intended public entry point. The LXC origin firewall allows inbound 80/443 only from Cloudflare's IP ranges. A weekly cron fetches the canonical list and reloads the firewall rules.

### Backup strategy

The user manages the backup destination. The recommended practices for *what* to back up:

- **Database:** nightly `pg_dump --format=custom` (compressed; restores with `pg_restore`).
- **Uploads:** nightly `tar` of `/var/lib/trup/uploads/`.
- **Encryption:** encrypt archives with `age`; the private key lives offline, not on the server.
- **Retention:** 7 daily / 4 weekly / 12 monthly.
- **Restore drills:** quarterly, onto a throwaway LXC. A backup that has never been restored is not a backup.

---

## 3. Guardrails

These apply to every phase:

1. **The production database is sacred.** No data migration, no data loss. We only convert the *schema management method* (raw SQL → Prisma Migrate) via a baseline migration against the existing DB.
2. **No visual redesign.** This is a technical rewrite. The site looks identical when done. The design system (§6) *codifies* the current look — it does not change it.
3. **Each phase is independently deployable.** Never leave the app half-broken between phases. The old app keeps running until the new one fully replaces it (see §10 Cutover).
4. **Branch `rewrite/nextjs`.** All rebuild work lives here. Merge to `main` only after the user approves a completed, verified phase.
5. **Phase gate.** Do not start a phase without the user saying "go" for that phase. Report at the end of each phase with what to verify.
6. **Tests are part of "done."** A feature isn't done until it has at least a smoke test. No more "there is no test suite."
7. **Feature parity is the bar.** The rebuilt site must do everything §14 lists. §14 is the canonical specification — when a phase ports a page or route, check it against §14 and tick the parity box. Nothing in §14 may silently disappear.

---

## 4. Current → Target Inventory

Concrete mapping so nothing is lost in translation.

### 4.1 API routes (Express `server/routes/` → Next.js `app/api/`)

| Current (Express) | Lines | Target (Route Handler) | Notes |
|---|---|---|---|
| `auth.ts` | 245 | **Deleted** — replaced by NextAuth | NextAuth handles Google provider, session, callback, logout |
| `events.ts` | 608 | `app/api/events/route.ts` + `[id]/` | Largest file; split into list / detail / rsvp / finalize handlers |
| `upload.ts` | 366 | `app/api/images/route.ts` (upload + asset variants) | Route Handler receives the multipart body; `lib/storage.ts` writes to the local volume; sharp processes synchronously (resize + watermark). Same logic as current multer handler, ported. |
| `users.ts` | 210 | `app/api/users/route.ts` + `[id]/` | Drop local `authenticate`; use shared session helper. Keep owner guards |
| `push.ts` | 130 | `app/api/push/route.ts` | Drop local `authenticate`; keep web-push |
| `wiki.ts` | 124 | `app/api/wiki/route.ts` + `[id]/` | |
| `gpx.ts` | 112 | `app/api/gpx/route.ts` | Drop local `authenticate`; keep gpxUtils parsing |
| `news.ts` | 103 | `app/api/news/route.ts` | |
| `stats.ts` | 59 | `app/api/stats/route.ts` | In-memory cache → `unstable_cache` (Next.js built-in) |
| `albums.ts` | 49 | `app/api/albums/route.ts` + `[id]/` | |
| `search.ts` | 48 | `app/api/search/route.ts` | |

### 4.2 Frontend pages (`src/pages/` → `app/`)

| Current | Target route | SSR strategy |
|---|---|---|
| `Home.tsx` | `app/page.tsx` | RSC — fetch featured events server-side |
| `Events.tsx` | `app/wydarzenia/page.tsx` | RSC list + client filter island |
| `EventDetail.tsx` | `app/wydarzenia/[id]/page.tsx` | RSC + `generateMetadata` for OG tags |
| `CalendarPage.tsx` | `app/kalendarz/page.tsx` | Client component (interactive) |
| `Profile.tsx` | `app/profil/page.tsx` | Protected; RSC with session |
| `Admin.tsx` | `app/admin/page.tsx` | Protected; mostly client (heavy interactivity) |
| `AdminGallery.tsx` | `app/admin/galeria/page.tsx` | Protected; client |
| `Gallery.tsx` | `app/galeria/page.tsx` | Unhide (currently ComingSoon) |
| `GalleryDetail.tsx` | `app/galeria/[id]/page.tsx` | RSC + lightbox island |
| `Wiki.tsx` | `app/wiki/page.tsx` | Unhide |
| `WikiArticle.tsx` | `app/wiki/[id]/page.tsx` | RSC + `generateMetadata` |
| `News.tsx` | `app/aktualnosci/page.tsx` | Unhide |
| `About.tsx` | `app/o-nas/page.tsx` | Build real content |

### 4.3 Components — port verbatim

All of `src/components/` moves to the new project unchanged except import-path fixes:
UI primitives (`Badge`, `Button`, `Card`, `Checkbox`, `FormField`, `Input`, `Modal`, `Select`, `Skeleton`, `Textarea`, `Tooltip`, `NavItem`, `AuthGate`) and feature components (`ComingSoon`, `ConfirmationModal`, `EventCountdown`, `GpxPreview`, `GpxUploadModal`, `ImageCropper`, `ImageLoader`, `ImagePicker`, `ImagePositionPicker`, `Layout`, `Lightbox`, `MapyLink`, `NewsCard`, `PageHeader`, `PhotoWatermark`, `ProtectedRoute` → replaced by middleware, `ScrollToTop` → Next.js handles). During Phase 2 the primitives are refactored onto the design-system foundation (§6) — same look, unified source.

### 4.4 Server libs

| Current | Target |
|---|---|
| `server/lib/prisma.ts` | `lib/prisma.ts` — singleton with global guard for dev hot-reload |
| `server/lib/gpxUtils.ts` | `lib/gpx.ts` — unchanged logic |
| `server/middleware/auth.ts` | `lib/auth.ts` (NextAuth full config) + `lib/auth.config.ts` (edge-safe config) |
| `server/middleware/watermark.ts` | `lib/watermark.ts` — same sharp logic, called from the upload Route Handler. On-the-fly serving can use a Next.js Route Handler at `/uploads/[...path]`. |

---

## 5. Proposed Project Structure

```
trup/
├── app/
│   ├── (public)/                 # public route group
│   │   ├── page.tsx              # Home
│   │   ├── wydarzenia/
│   │   ├── galeria/
│   │   ├── wiki/
│   │   ├── aktualnosci/
│   │   └── o-nas/
│   ├── (protected)/              # gated by middleware
│   │   ├── profil/
│   │   └── admin/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth
│   │   ├── events/
│   │   ├── gpx/
│   │   ├── images/
│   │   └── ...                    # one folder per resource
│   ├── styleguide/                # dev-only living catalog of the design system (§6.14)
│   ├── globals.css                # design tokens (@theme) — single source (§6.1)
│   ├── layout.tsx                 # root layout, CSP nonce injection
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                        # primitives (Button, Card, Input, Badge, Modal, ...)
│   ├── features/                  # feature components (EventCountdown, GpxPreview, ...)
│   ├── layout/                    # Layout shell, Navbar, MobileDrawer, Footer
│   ├── states/                    # EmptyState, ErrorState, loading Skeletons (§6.8)
│   └── icons.ts                   # central icon registry (§6.3)
├── lib/
│   ├── prisma.ts
│   ├── auth.ts                    # NextAuth full config (Prisma adapter) — RSCs and Route Handlers only
│   ├── auth.config.ts             # NextAuth JWT config (no Prisma adapter) — safe for Edge Runtime / middleware.ts
│   ├── gpx.ts
│   ├── storage.ts                 # file read/write abstraction (wraps fs + /var/lib/trup/uploads/)
│   ├── watermark.ts               # sharp watermark logic (ported from server/middleware/watermark.ts)
│   ├── validations/               # Zod schemas, one file per resource
│   │   ├── event.ts
│   │   ├── gpx.ts
│   │   └── ...
│   └── utils.ts                   # cn() etc.
├── prisma/
│   ├── schema.prisma              # reconciled, single source of truth
│   ├── migrations/                # versioned migrations
│   └── seed.ts
├── middleware.ts                  # route protection + CSP nonce (imports auth.config.ts only — never auth.ts)
├── public/
└── uploads/                       # symlink or mount point → /var/lib/trup/uploads/ on the LXC
```

**Modularity rule:** one resource = one folder under `app/api/`, one Zod file under `lib/validations/`, one set of pages. Adding a feature touches a predictable, isolated set of files. Every reusable visual element lives in `components/ui` and is consumed, never re-styled inline.

---

## 6. Design System & Frontend Foundations

The current site already has a strong, consistent visual language — internally call it **"Alpine Brutalism"**: a green-on-dark palette, the Bebas Neue display font, **0px border-radius everywhere**, uppercase tracking-widest labels, and hover effects that invert foreground/background. The goal of this section is to **codify that language into reusable, customisable building blocks** so every future feature looks native without re-inventing styles. We preserve the look; we make it systematic.

Built **at the start of Phase 2**, before any page is ported, so every page consumes the same foundation.

### 6.1 Design tokens (single source of truth)

All tokens live in `app/globals.css` under Tailwind v4 `@theme` (they already do — formalize and document, never hard-code hex in components).

| Token group | Values (current) | Purpose |
|---|---|---|
| Display font | `Bebas Neue` | Headings, hero text, button labels |
| Body font | `Inter` | Body copy, UI text |
| `--color-primary` | `#8ED081` (green) | Primary actions, accents, active states |
| `--color-surface` | `#37392E` (dark olive) | App background |
| `--color-on-surface` | `#f9f9f8` | Default text on surface |
| `--color-surface-variant` / `-dim` / `-container-*` | olive greys | Cards, panels, layered backgrounds |
| `--color-error` | `#ff5252` | Destructive/error |
| `--color-tertiary-container` | `#b63f75` (magenta) | Special highlights (e.g. expedition) |
| `--radius-*` | `0px` everywhere | Signature sharp-corner look — never round |
| Motion | `cubic-bezier(0.4,0,0.2,1)`, `active:scale-95/0.98` | Standard transition + press feedback |

**Rule:** components reference tokens (`bg-primary`, `text-on-surface`), never raw hex. Adding a color = add a token here first.

### 6.2 Button system (unify the two that exist today)

Today buttons are styled **twice**: the React `Button` component (`variant`/`size` maps) *and* a parallel `.btn-primary/.btn-secondary/...` set in `index.css`. The rewrite collapses this into **one** source.

- **Implementation:** `components/ui/Button.tsx` backed by **CVA** for typed, composable variants. Delete the `.btn-*` CSS classes entirely.
- **Keep every current variant** (document its intended use so usage stays consistent):

| Variant | When to use |
|---|---|
| `primary` | The one main call-to-action on a view (green, inverts to white on hover) |
| `secondary` | Neutral actions, "back", blurred-glass look |
| `danger` | Destructive actions (delete, remove) — error-red ring |
| `warning` | Caution / toggle-able states (amber) |
| `outline` | Low-emphasis actions, ring only |
| `ghost` | Minimal actions, nav-adjacent, toolbars |

- **Keep every current size:** `sm`, `md`, `lg`, `icon`.
- **Keep existing props:** `isLoading` (spinner), `leftIcon`/`rightIcon`, `asChild` (Radix `Slot`), plus add `fullWidth`.
- **Customisable, not forked:** pass extra Tailwind via `className` (merged with `cn()` / `tailwind-merge`). New one-off looks are achieved by composing tokens, never by creating a new component.
- Base style stays: `inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all`.

The same CVA pattern is the template for other variant-driven primitives (`Badge`, `Input` states, `Card` elevations).

### 6.3 Icon system (one registry, reused everywhere)

Icons today come from `lucide-react`, imported ad-hoc in ~23 files. Centralize them.

- **`components/icons.ts`** re-exports the curated set under semantic names, so usage is consistent and swapping libraries (or replacing one glyph) is a one-file change.
- **Standard sizes:** 14 (sm / inline), 16–18 (default), 20–24 (lg / headers). `strokeWidth` consistent (lucide default 2).
- **Icon-only buttons must have an `aria-label`** (accessibility, §6.11).
- **Curated vocabulary** (already in use — group by role so the same concept always uses the same glyph):

| Role | Icons |
|---|---|
| Navigation / chrome | `Menu`, `X`, `ChevronLeft/Right`, `ArrowLeft/Right`, `Search`, `Bell`, `User`, `Settings`, `LogOut`, `HelpCircle` |
| Hiking domain | `Mountain`, `Compass`, `Route`, `MapPin`, `Map`, `Calendar`, `Clock`, `TrendingUp`, `Trophy`, `Award`, `Skull` (difficulty), `Zap` |
| Actions | `Plus`, `Upload`, `UploadCloud`, `Download`, `Check`, `CheckCircle2`, `RotateCcw`, `ZoomIn`, `Maximize2`, `Move`, `Lock` |
| Status / feedback | `AlertTriangle`, `ShieldAlert`, `Loader2`, `Star`, `Users`, `UserCheck` |
| Content | `Book`, `BookOpen`, `FileText`, `Tag`, `Grid`, `ExternalLink`, `Phone`, `Mail` |

Adding an icon = add it to the registry with a semantic name, then import from there.

### 6.4 Navigation & information architecture

Current nav (`Layout.tsx`): top bar with Home, Wydarzenia, Kalendarz, Galeria, Wiki, Aktualności, O nas, external "Zgłoś problem"; plus notifications bell and user menu; mobile collapses to a `Menu`/`X` drawer.

Plan, formalized:

- **Sitemap / IA** (the canonical tree):
  - Public: `/` · `/wydarzenia` → `/wydarzenia/[id]` · `/kalendarz` · `/galeria` → `/galeria/[id]` · `/wiki` → `/wiki/[id]` · `/aktualnosci` · `/o-nas` · ext. "Zgłoś problem"
  - Auth: `/profil`
  - Admin: `/admin` (tabs: events, RSVP, GPX queue, completion queue, users) · `/admin/galeria`
- **Primary nav component** (`components/layout/Navbar.tsx`): desktop top bar + mobile slide-in drawer. Active link via Next.js `usePathname()` + `aria-current="page"`. Keep the existing `NavItem` + `link-underline` hover.
- **External links:** consistent `target="_blank" rel="noopener noreferrer"` pattern (the "Zgłoś problem" form), visually marked with `ExternalLink`.
- **Breadcrumbs** on detail pages (event, album, wiki article) — a small reusable `Breadcrumbs` component.
- **Admin sub-navigation:** a tabbed layout shared by `/admin` and `/admin/galeria`.
- **User menu:** profile, notifications (bell + dropdown), logout — gated by session; admin entry only shown to admins.
- **Footer:** secondary nav + club info, reusing `link-underline-footer`.
- **Accessibility:** keyboard navigable, focus trap in the mobile drawer, ESC to close, visible focus rings.
- Next.js handles scroll restoration (drops the current `ScrollToTop`).

### 6.5 Layout, responsiveness & breakpoints

- **App shell** (`components/layout/Layout.tsx`): header / main / footer; `PageHeader` hero with focal-point-aware background image (`imageFocalX/Y`).
- **Mobile-first**, standard Tailwind breakpoints (`sm/md/lg/xl`). Document the container max-width and page padding once; reuse via a `Container` wrapper.
- Preserve the modal backdrop behaviour (`body.modal-active` blur/grayscale of `#root`).

### 6.6 Forms

- Primitives: `FormField` (label + error + hint), `Input`, `Select`, `Textarea`, `Checkbox` — all on the same token/variant system.
- **`react-hook-form` + `@hookform/resolvers/zod`**, sharing the exact Zod schema used by the API (§Phase 1) so client and server validate identically.
- Standardize: required markers, inline error display, disabled/loading states, `ImageCropper`/`ImagePicker` for image fields.

### 6.7 Feedback & overlays

- **Toasts:** Sonner via the existing `showToast` helper — standard success / error / info styles.
- **Confirmation:** the existing `confirmAction` + `ConfirmationModal`; **required for every destructive action**.
- **Modal** primitive + **Tooltip** primitive — already exist, keep on the token system.

### 6.8 Loading, empty & error states (standardize the trio)

Every data-driven view must handle all three states with shared components:

- **Loading:** `Skeleton` (exists) + Suspense boundaries for RSC.
- **Empty:** a reusable `EmptyState` (icon + message + optional action) — for "no events", "no photos", empty search.
- **Error:** a reusable `ErrorState` (message + retry) for failed fetches.

This removes ad-hoc per-page handling and guarantees consistent UX.

### 6.9 Imagery & media

- `ImageLoader` (lazy + spinner) for album/gallery photos; `Lightbox` for full-screen viewing; `PageHeader` for hero images.
- Images are uploaded via the Route Handler; `lib/storage.ts` writes to the local volume; sharp processes synchronously. `lib/watermark.ts` handles watermark generation in-process.
- Leaflet maps (`GpxPreview`) stay client-only (dynamic import, no SSR).

### 6.10 Motion & animation

- Keep the current subtle motion: cubic-bezier transitions, press `scale`, hover color-invert, the `progress-shrink` keyframe. `motion` (Framer) is available for richer transitions where warranted.
- **Respect `prefers-reduced-motion`** — disable non-essential animation.

### 6.11 Accessibility (baseline checklist)

- Visible `focus-visible` rings on all interactive elements.
- `aria-label` on every icon-only button; `aria-current` on active nav.
- Sufficient color contrast (verify green `#8ED081` / magenta `#b63f75` on dark surfaces).
- Semantic headings, `alt` text on content images, keyboard operability for modals/drawer.
- Honor reduced-motion.

### 6.12 Theming

- The site is a single dark theme driven entirely by CSS variables — light mode is therefore *possible* later but **out of scope** for the parity rewrite. Keeping tokens centralized (§6.1) leaves the door open.

### 6.13 Content & copy

- UI copy is Polish. Keep it consistent; collect shared/reused labels (nav, buttons, toasts) in a small `lib/strings.ts` so wording is centralized. **Full i18n / multi-language is out of scope** unless explicitly requested.

### 6.14 Living catalog (`/styleguide`)

- A **dev-only** `/styleguide` route renders every primitive with all variants/sizes, the color tokens, and the icon set. Lighter than Storybook and good enough for a small project — it makes "same style, customisable" verifiable at a glance.

### 6.15 Design-system deliverables checklist

- [ ] Tokens documented in `app/globals.css`; no hard-coded hex in components
- [ ] `Button` unified on CVA; `.btn-*` CSS deleted; variants documented
- [ ] `components/icons.ts` registry; all icon imports routed through it
- [ ] `Navbar` + `MobileDrawer` + `Breadcrumbs` + admin tabs + `Footer`, with active states & a11y
- [ ] `EmptyState` + `ErrorState` + skeleton patterns in `components/states/`
- [ ] Form primitives wired to `react-hook-form` + Zod resolver
- [ ] `/styleguide` route showing the whole system
- [ ] Accessibility checklist (§6.11) passing on core flows

---

## 7. Phases

Every phase: branch off `rewrite/nextjs`, build, self-verify, report to user, await approval before next phase.

### Phase 0 — Foundation & De-risking *(needs blessing)*

Goal: prove the riskiest pieces work before committing to the full port. This phase is **intentionally front-loaded with the hardest problems** — CSP architecture, NextAuth edge runtime, and schema baseline — so that every subsequent phase builds on proven ground rather than discovering structural issues mid-port.

1. **Reconcile the schema first** (do this in the *current* repo, see §8) so we baseline from truth.
2. **Verify Cloudflare origin firewall** (see §2.1): confirm the LXC accepts inbound 80/443 only from Cloudflare's published IP ranges. Set up the weekly cron to refresh the allowlist. All infrastructure decisions are already resolved — no further choices deferred.
3. Scaffold Next.js 15 + TypeScript (strict) + Tailwind v4 + App Router in `rewrite/nextjs`.
4. Point Prisma at the **existing production-shaped DB** (a clone/staging copy, never prod directly).
5. `prisma migrate diff` + `prisma migrate resolve` to create a **baseline migration** matching the current DB exactly (no data change).
6. Configure NextAuth v5 with Google provider. Verify full login → session → logout against a test Google account.
7. Render a single trivial page that reads one row from the DB via Prisma in an RSC.
8. **Scaffold nonce-based CSP infrastructure**: generate a per-request nonce in `middleware.ts`, set the `Content-Security-Policy` response header (no `unsafe-inline`), and propagate the nonce to `app/layout.tsx`. Document the nonce propagation pattern — every `<Script>` tag and inline script written in Phases 1 and 2 **must** receive this nonce. Deferring CSP to Phase 3 guarantees expensive backtracking; doing it now means the foundation is correct.
9. **Validate the NextAuth v5 edge-split pattern**: implement `lib/auth.config.ts` (JWT strategy + Google provider, **no Prisma adapter** — Edge Runtime safe) and `lib/auth.ts` (full NextAuth config with Prisma adapter, used in RSCs and API Route Handlers only). `middleware.ts` imports **only** `auth.config.ts`. NextAuth v5 crashes in Edge Runtime when the Prisma adapter is loaded; this split is non-negotiable. Prototype route protection (`/profil` redirects unauthenticated users to `/`) before proceeding.
10. **Verify Prisma connection pool** under the LXC deployment: Next.js on LXC runs as a persistent Node.js process (not ephemeral serverless), so Prisma's built-in pool is sufficient. Confirm the pool size env var (`DATABASE_URL` or `connection_limit`) is appropriate for the Postgres `max_connections` setting and note it in `.env.example`.

**Exit criteria:** Google login → session → logout works. DB read from RSC works. Schema and DB are in sync via a real Prisma migration. CSP nonce infrastructure in place with no `unsafe-inline` from day one. Protected route redirects unauthenticated users correctly via `auth.config.ts` in middleware. Cloudflare origin firewall verified. Prisma pool documented. Nothing else exists yet.

**Effort: ~3–4 sessions** (was 1–2; the CSP scaffold, NextAuth edge validation, and baseline migration each carry real uncertainty; this is the highest-risk phase).

### Phase 1 — API Layer

1. Port each Express route to a Next.js Route Handler (see §4.1 mapping). Start with read-only (`events` list, `albums`, `stats`), then mutations. Budget roughly one session per major route file.
2. Write a Zod schema for every request body and query param in `lib/validations/`.
3. Create one shared session/authorization helper (`requireUser()`, `requireAdmin()`, `requireOwnerSafe()`) — used by **every** handler. No local auth copies, ever.
4. Port owner-protection and self-demotion guards from `users.ts`.
5. Re-implement rate limiting via Next.js middleware (or Vercel's built-in rate limiting).
6. **Implement the upload Route Handler** (see §4.1 mapping): Route Handler receives the multipart body, authenticates the user, validates file type, calls `lib/storage.ts` to write the file to the local volume, runs sharp resize + watermark synchronously via `lib/watermark.ts`, and creates the DB record. Mirror the current `upload.ts` behaviour — original + thumbnail + watermarked variants. Port `upload-asset` and `upload-simple` variants.
7. All mutations use **Server Actions** where appropriate; Route Handlers for external API consumers. No React Query — the framework handles caching.
8. Smoke test: hit every endpoint with valid + invalid payloads; invalid must be rejected by Zod with a 400.

**Exit criteria:** Every API endpoint responds correctly and rejects bad input. Verified against the still-running old frontend if practical, or via a request test script.

**Effort: ~7–10 sessions** (was 3–4; `events.ts` alone is 608 lines; every endpoint needs Zod, server-action wiring, and payload tests; the original estimate was optimistic by roughly 2×).

### Phase 2 — Frontend Migration

1. **Build the design-system foundation first** (§6): tokens, unified `Button` (CVA, deletes `.btn-*`), icon registry, layout/nav components, state components (`EmptyState`, `ErrorState`), `/styleguide`. Everything below consumes it — do not skip this step.
2. Move remaining `components/` over; fix imports; confirm they render in `/styleguide`.
3. Convert pages per §4.2. Public read pages become RSC; interactive pages (Admin, Calendar) stay client components with `'use client'`.
4. Replace `AppContext` server-data fetching with **RSC + Server Actions**. Keep a minimal Zustand store for pure UI state only (toast queue, modal open/close, mobile drawer). For data that must **auto-refresh after page load without navigation** — specifically the notification dropdown (§14.11, 60 s interval) — use **SWR** (`useSWR('/api/…', { refreshInterval: 60000 })`). This is the *only* permitted client-side polling library; RSC + Server Actions covers everything else. **Do not introduce React Query** — its richer feature set addresses problems TRUP doesn't have.
5. Replace `ProtectedRoute` with `middleware.ts` route protection (already scaffolded in Phase 0).
6. Port toast (Sonner) and the `confirmAction`/`ConfirmationModal` system into the Zustand store.
7. Verify every live page visually matches the old site, including on mobile.

**Exit criteria:** All currently-live pages work and look identical in Next.js. Auth-gated pages redirect correctly. `/styleguide` shows the full system.

**Effort: ~6–8 sessions** (was 4–5; design-system foundation first, then 13 pages; slightly faster than Phase 1 because there is no React Query to wrangle).

### Phase 3 — Security Hardening

At this point the nonce-based CSP is already in place (Phase 0). This phase audits and hardens it rather than establishing it.

1. **Audit the CSP**: verify every `<Script>` tag and inline handler added in Phases 1–2 carries the Phase 0 nonce; tighten `imgSrc`, `connectSrc`, and `frameSrc` allowlists to exact values (not wildcards); run a CSP evaluation tool (e.g. securityheaders.com) against staging.
2. Confirm NextAuth's automatic OAuth `state`/PKCE is active (replaces the current missing CSRF param).
3. Audit every `prisma.$queryRawUnsafe` from the old `events.ts`/`search.ts`; replace with typed Prisma queries. Only keep raw SQL where Prisma genuinely cannot express the query, and only with the parameterized `$queryRaw` tagged template — never `Unsafe`.
4. Add startup env validation with Zod (`@t3-oss/env-nextjs` or a hand-rolled `lib/env.ts`) — app refuses to start with missing or malformed env vars.
5. Set HSTS, secure cookie flags, and the full security header set via `next.config.ts` headers.
6. Security review of the branch diff (`/security-review`).

**Exit criteria:** CSP audit clean; no `unsafe-inline`; no `$queryRawUnsafe`; env validated at boot; security review passing.

**Effort: ~2–3 sessions** (was 1–2; now audit-only since the foundation was established in Phase 0).

### Phase 4 — Feature Completion

1. Unhide and finish the ComingSoon pages: `/galeria`, `/aktualnosci`, `/wiki`, `/o-nas` (backends already exist from Phase 1).
2. Build real `/o-nas` content with the user.
3. Add `generateMetadata` / Open Graph tags to event, gallery, and wiki detail pages (enabled by SSR).
4. Add `error.tsx` and `not-found.tsx`.

**Exit criteria:** No ComingSoon wrappers remain. Shared event links show rich social previews.

**Effort: ~3–4 sessions** (was 1–2; unlocking 4 hidden pages + real `/o-nas` content is more than half a session each).

### Phase 5 — Production Readiness & Cutover

1. **Structured logging**: replace `console.error`/`console.log` with `pino`. Write JSON log lines to `/var/log/trup/app.log`; configure `logrotate` for rotation at 100 MB, retention 14 days. No Loki or Grafana — log volume is low enough that `tail -f` and `grep` are sufficient for ad-hoc debugging. `pino` supports transports, so switching output destination later is a one-line config change.
2. Error monitoring (Sentry — Next.js integration).
3. ~~DB connection pooling~~ — **already done in Phase 0**. Verify under production load.
4. CI pipeline (GitHub Actions): lint + typecheck + smoke tests run on every PR automatically.
5. Verify `uploads/` is fully present on the LXC local volume and `lib/storage.ts` serves all images correctly through the new app. Confirm the backup strategy is active (§2.2): nightly pg_dump + tar, encrypted with age, retention schedule in place.
6. Execute the cutover plan (§10).

**Exit criteria:** New app live in production, old app retired, monitoring green.

**Effort: ~3–4 sessions + a maintenance window for cutover** (was 1–2).

**Total realistic estimate: ~24–33 sessions** across all phases. The original 13–17 estimate did not account for the complexity of porting a 600-line Express route into typed Route Handlers + Server Actions + Zod, nor for the Phase 0 infrastructure work. Plan for the high end; anything under 30 sessions is ahead of schedule.

---

## 8. Schema Reconciliation (do BEFORE Phase 0)

`prisma/schema.prisma` does not match what `runMigrations()` actually creates. Before baselining, the schema must tell the truth. Fields present in `runMigrations()` but missing/needing verification in `schema.prisma`:

- `Event.imageFocalX`, `Event.imageFocalY` (DOUBLE PRECISION, default 50)
- `Event.plannedDistance`, `Event.plannedElevation`, `Event.plannedDuration` (DOUBLE PRECISION)
- `WikiArticle` — `runMigrations()` creates it without `tags`/`authorName`/`updatedAt` defaults that the schema declares; reconcile column-by-column
- Confirm `User.lastLogoutAt` exists in both (added recently)

**Procedure:**
1. Introspect the real DB: `prisma db pull` into a scratch schema.
2. Diff against the committed `schema.prisma`.
3. Make `schema.prisma` match reality exactly (add the missing fields).
4. `prisma migrate diff` to confirm zero drift.
5. This reconciled schema becomes the Phase 0 baseline.

This step alone is valuable even if the rewrite stalls — it makes the current app's types honest and removes the `as any` casts.

---

## 9. Data Model Notes for the Rewrite

Carry these domain rules into the new schema (with proper Prisma relations + `onDelete: Cascade` instead of manual cascade deletes in `users.ts`):

- `User`: `role` USER/ADMIN, `status` ACTIVE/INACTIVE/FLAGGED, `lastLogoutAt` for revocation. `OWNER_EMAIL` env protects one account. **Add `onDelete: Cascade`** to `EventParticipation`, `GpxSubmission`, `Notification`, `PushSubscription` relations so deleting a user is one operation, not five.
- `Event`: planned vs actual stats, `isDraft`/`isFinalized` lifecycle, focal point, sensitive-field stripping for unauthenticated requests (move this into a single `serializeEvent(event, viewer)` function, not scattered per-route).
- `GpxSubmission`: `PENDING → APPROVED/REJECTED`; `participantIds String[]`; `isOfficial`; `order`/`label`.
- `EventParticipation`: `status: 'GOING'`, `attended` set on finalization.
- `WikiArticle`/`NewsItem`: now proper Prisma models with real migrations (no more raw `CREATE TABLE`).

---

## 10. Cutover Plan

User has accepted downtime, so we use a clean swap (not blue-green):

1. Freeze writes on the old app (maintenance banner).
2. Take a full DB backup (`pg_dump`).
3. Point the new app at the production DB; run `prisma migrate deploy` (baseline already applied — should be a no-op or only new migrations).
4. Verify `uploads/` files are fully present on the LXC local volume.
5. Smoke test the new app against prod data on the staging LXC before switching traffic.
6. Switch Cloudflare DNS / proxy to point at the new LXC.
7. Keep the old app deployable for 1–2 weeks as instant rollback.
8. Remove the old app once stable.

**Rollback:** DNS back to old LXC + restore DB from backup if a migration went wrong. Because we kept the old app, rollback is minutes, not hours.

---

## 11. Open Decisions (resolve in Phase 0 with user)

| Decision | Answer | Notes |
|---|---|---|
| Hosting | **LXC container on Proxmox** | Next.js runs as a long-lived Node.js process; LXC is sufficient isolation, lighter and faster than a full VM. Cloudflare proxy is already live on the domain. See §2.1. |
| File storage | **Local volume `/var/lib/trup/uploads/`** via `lib/storage.ts` | Single-server app; no need for S3/R2/MinIO at this scale. The abstraction layer (§2.1) makes a future migration a one-file change. |
| Image upload method | **Direct to Next.js Route Handler** | No 4.5 MB serverless limit on self-hosted LXC. Multipart body received by the handler; `lib/storage.ts` writes to disk. Simpler than presigned URLs. |
| Image processing | **Sync sharp in the Route Handler** | No 10 s serverless timeout on LXC. `lib/watermark.ts` runs synchronously at upload time — same behaviour as the current Express app. |
| Connection pooler | **Prisma built-in pool** (no extra service) | LXC is persistent; no per-invocation connection churn. Prisma's default pool is sufficient. Document `connection_limit` in `.env.example`. |
| Client-side polling | **SWR** (scoped to polling only) | Used only where data must refresh post-load without navigation (notification dropdown, §14.11). RSC + Server Actions is the default for everything else. React Query rejected as overkill. |
| Logging | **pino → rotated file** | JSON lines to `/var/log/trup/app.log`; `logrotate` for rotation + retention. Loki + Grafana rejected at this scale — `grep` is sufficient. pino supports transports for a future Loki migration. |
| Backups | **User-managed destination** | Recommended: nightly pg_dump + tar, encrypted with age, 7/4/12 retention, quarterly restore drills. Destination is user's own setup. See §2.2. |
| State management | **RSC + Server Actions** (SWR for polling) | See §2 and Phase 2. |
| Light mode | **Dark only** for parity | CSS variable tokens leave the door open later without any rework. |
| `@google/genai` dependency | **Audit and drop if unused** | This package is in `package.json` but its usage is unclear. Unused dependencies increase attack surface. |
| Repo strategy | **New branch `rewrite/nextjs`** | Keeps full git history; easy to compare old and new. |

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema drift causes bad baseline | Medium | High | §8 reconciliation before Phase 0; baseline against a DB *clone* first |
| NextAuth v5 crashes in Edge Runtime with Prisma adapter | High | High | **Phase 0 must validate the `auth.config` split before any other phase starts** — see Phase 0 step 9 |
| NextAuth Google OAuth config differs from current manual flow | Medium | Medium | Phase 0 de-risks this first, against a test account |
| `events.ts` (608 lines) hides edge cases | High | Medium | Port incrementally, endpoint by endpoint, with payload tests; ~1 session per major file |
| `$queryRawUnsafe` queries hard to reproduce in Prisma | Medium | Low | Keep parameterized `$queryRaw` tagged template as fallback; never `Unsafe` |
| Origin IP exposure bypasses Cloudflare proxy | Medium | Medium | **Fixed by design**: origin firewall allows inbound 80/443 from Cloudflare IPs only (§2.1, Phase 0 step 2); weekly cron refreshes the allowlist |
| Disk fills up with uploads on LXC | Low | Medium | Monitor `/var/lib/trup/uploads/`; set up a `df` alert. `lib/storage.ts` makes storage quotas easy to enforce if needed. |
| CSP written before nonce infrastructure | Was HIGH | Phase 0 | **Fixed by design**: CSP scaffold moved to Phase 0; every subsequent phase builds on the correct foundation |
| React Query added to App Router project | Was MEDIUM | — | **Removed from plan**: RSC + Server Actions + SWR (polling only) covers all cases with minimal extra dependency |
| Serverless upload/processing limits | N/A | — | **Not applicable**: self-hosted LXC has no 4.5 MB body limit and no 10 s function timeout |
| Duplicated button styling causes visual drift | Low | Low | Unified on one CVA source in Phase 2; `.btn-*` CSS deleted |
| Scope creep into redesign | Medium | High | Guardrail §3.2 — design system *codifies*, never changes, the look |
| Lost uploads during cutover | Low | High | Verify full `/var/lib/trup/uploads/` presence on new LXC before DNS switch (§10); backup taken immediately before cutover |
| **Live app stays vulnerable during rewrite** (session-revocation bypass unpatched) | Certain | Medium | **Accepted** per §1.1. If the site goes fully public before cutover, revisit and patch the HIGH issue in the current app as the one exception to the no-interim-patches rule. |

---

## 13. Definition of Done (whole project)

- [ ] **Every item in the §14 feature specification works identically** (the parity bar)
- [ ] All current live pages work identically in Next.js
- [ ] All ComingSoon pages unhidden and functional
- [ ] Every API endpoint validates input with Zod; mutations use Server Actions
- [ ] Single shared auth helper; zero local `authenticate` copies
- [ ] `lib/auth.config.ts` (edge-safe) and `lib/auth.ts` (full) correctly split; middleware uses only the config
- [ ] Design system codified: unified `Button` (CVA), icon registry, tokens, nav, state components, `/styleguide`
- [ ] No duplicated styling; no hard-coded hex in components; `.btn-*` CSS deleted
- [ ] CSP has no `unsafe-inline`; nonce propagated correctly to all scripts
- [ ] Real Prisma migrations; `runMigrations()` deleted
- [ ] `schema.prisma` is the honest single source of truth; no `as any`
- [ ] Owner protection + session revocation enforced everywhere
- [ ] Env validated at boot; app refuses to start with missing vars
- [ ] Accessibility baseline (§6.11) passing on core flows
- [ ] Smoke tests in CI (lint + typecheck + key flows on every PR via GitHub Actions)
- [ ] Error monitoring (Sentry) + structured logging (`pino` → rotated file via `logrotate`) in production
- [ ] Uploads verified on LXC local volume; `lib/storage.ts` serves all files correctly
- [ ] Backup strategy active: nightly pg_dump + tar, age-encrypted, retention schedule running (§2.2)
- [ ] Old app retired after stable cutover

---

## 14. Feature Specification (parity checklist)

This is the **canonical inventory of everything the live site does today**, captured from a full read of every page, component, and route. The rebuild is not "done" until every item here works identically. Organized so each phase can tick off the parts it owns. Polish UI labels are preserved verbatim.

### 14.1 Cross-cutting concepts (apply everywhere)

- **Roles:** `guest` (not logged in), `user` (logged in; `ACTIVE` = full member, `INACTIVE` = limited), `admin`. DB enum is `USER | ADMIN`; status is `ACTIVE | INACTIVE | FLAGGED`.
- **Three-layer visibility:** guest masking → inactive-user filtering → admin full access. A guest sees masked/limited data; an inactive user sees full data **only for events they participate in**; an admin always sees everything.
- **Auth:** Google OAuth → session. `AuthGate` component wraps login-required content with a prompt. Owner account (`OWNER_EMAIL`) can never be demoted/deleted; no user can demote/delete themselves.
- **Toasts (Sonner):** success / error / info; **delete actions offer a 6-second UNDO**.
- **Confirmation modal:** title + message + variant (danger/primary/warning), confirm/discard/cancel; used for deletes, dirty-form guards, role changes.
- **Dirty-form guards:** Profile and Admin event creator block navigation (React Router `useBlocker` + browser `beforeunload`) when there are unsaved changes; compare via serialized state; hardware arrays compared order-insensitively.

### 14.2 Home (`/`)

- Hero: TRUP logo + title + tagline "Robimy to czego innym się nie chce"; animated scroll-to-explore indicator.
- **Animated stat counters** (Framer Motion, 0→target over ~2.5s when scrolled into view): expeditions, total distance (km), total elevation (m), total time in mountains (h), active members. From `GET /api/stats`.
- **Aktualności** (news) section behind `AuthGate`; cumulative pagination in groups of 3 ("show more"); skeleton while loading; empty state links to events. From `GET /api/news`.
- **Nasze Osiągnięcia** (achievements): 3-col grid of highlighted past events; renders only if any exist. From `GET /api/events/highlighted`.
- Three slanted content strips: GÓRY, PLANSZÓWKI, LUDZIE (image overlays).
- Contact footer: Instagram, Facebook, Discord, Newsletter buttons.

### 14.3 Events list (`/wydarzenia`)

- Entire list behind `AuthGate`. Active members see all published; admins also see drafts; inactive users see only events they participate in.
- Filters: "Wszystkie", "GÓRY", "INTEGRACJA", "KULTURA".
- Event cards: focal-point hero image, type badge, countdown+date (hidden when archived), title over gradient, 2-line description snippet, location, difficulty stars (GÓRY only), spots counter or registered count, status dot (animated pulse if spots free, red "BRAK MIEJSC" when full, hidden if no limit).
- Two sections: **Nadchodzące** (upcoming) and **Archiwalne** (past; grayscale, desaturate on hover); archived section only if any exist.
- From `GET /api/events`.

### 14.4 Event detail (`/wydarzenia/:id`)

- Hero: title, difficulty stars (GÓRY), distance/elevation/duration badges; countdown if upcoming; spots widget (or "WYPRAWA ROZLICZONA" if finalized).
- **Sticky sidebar** (smart sticking based on viewport vs sidebar height):
  - RSVP button — **disabled/grayed if the user is missing any `gearCritical` item** (gating applies before RSVP, not after).
  - Notification button (bell + day count).
  - TLDR metadata tiles: date (→ calendar), location (→ map if present), difficulty (GÓRY), meeting point, organizer.
  - Equipment: "Wymagany" (critical, red) + "Sugerowany" (recommended, orange); items sorted owned-first; help tooltip legend.
  - Participants grid (avatars + status indicators); login wall for guests.
  - Completed routes section — only if finalized.
- Main: Markdown description; weather / transport / meeting-point-with-embed sections (each only if provided); map/GPX section — official GPX tracks with preview + distance/elevation/duration, embeds (Google Maps / Mapy.cz / fallback link), participant avatars per track.
- **Two modals:** Status ("Idę" GOING / "Zainteresowany" INTERESTED; "Rezygnuję z wyprawy" if already RSVP'd) and Notifications (none / 1 / 2 / 3 / 7 / 14 / 30 days, options filtered to ≤ days-until-event).
- Participant display: not finalized → all GOING+INTERESTED; finalized → only `attended=true` (guests); admin/creator always see all.
- Guest gets masked event (no `mapLink`, `mapEmbed`, `gearRequired`, `gearCritical`, `transport`).
- From `GET /api/events/:id`, `POST /api/events/:id/rsvp`, `PATCH /api/events/:id/attendance` (admin).

### 14.5 Calendar (`/kalendarz`)

- Public. Month grid (Monday-start), prev/next nav, today highlighted; `?date=` initializes the month.
- Events as blocks colored by type (GÓRY=primary, INTEGRACJA=yellow, other=gray); multi-day events span cells, title+location shown only on start day; blocks link to detail; legend at bottom; padding days from adjacent months grayed.
- From `GET /api/events`.

### 14.6 Profile (`/profil`, protected)

- **Overview tab:** avatar (hover-to-upload via `upload-simple`, cropped 400×400), name/nickname/email, stats sidebar (expeditions attended, distance, elevation, time), "Ready for more?" CTA → calendar, upcoming expeditions, **"Do Rozliczenia"** (past unfinalized GÓRY events the user joined, with "Wgraj GPX" button), past expeditions history grid (image+date, type, title, attendee count + location, distance/elevation for GÓRY if GPX approved).
- **Settings tab:** full name, nickname (optional), email (read-only, Google-synced), phone (optional), **hardware checkboxes (20 items)**, save, logout.
- Dirty-form guard with discard/save confirmation.
- Pending-settlement filter: `dateStart < today AND not finalized AND type=GÓRY AND not draft`.
- Stats sum approved GPX where user is submitter or in `participantIds`. `formatTime` → days/hours/minutes.
- From `GET /api/auth/me`, `GET /api/events`, `PATCH /api/users/me`, `POST /api/images/upload-simple`, `POST /api/gpx/upload`.

### 14.7 Gallery (`/galeria`) + detail (`/galeria/:id`)

- List: header "Archiwum Wizualne"; guests see a "Prywatna Galeria" lock banner and **only the first album**; logged-in users see all + "PEŁNY ALBUM" button; 2×4 thumbnail preview per album (title, location, year, image count); skeleton loader; empty state "Archiwum jest puste".
- Detail: back button, header (year, title, location, expandable description "Pokaż więcej"), "Dodaj swoje ujęcia" (non-guests), responsive photo grid with lazy-load skeletons + hover magnify, **Lightbox** (large image, prev/next, count, close, album title).
- From `GET /api/albums`, `GET /api/albums/:id`.

### 14.8 News (`/aktualnosci`) + Wiki (`/wiki`, `/wiki/:id`)

- News: header "Aktualności"; behind `AuthGate`; CTA → events; timeline cards (icon by type, date/category badge, title, description, type-specific "learn more"). From `GET /api/news`.
- Wiki list: header "Baza Wiedzy"; search; category cards (icon, name, count, sorted by count); article list (category badge, tag badges, title, date) filtered live by title/category/tags; empty state. **Guests see first 100 chars only**; logged-in see full.
- Wiki article: back button, header (category, title, date/author/tags), Markdown (GFM + line breaks), feedback CTA (email). Guest truncation + login prompt.
- From `GET /api/wiki`, `GET /api/wiki/:id`.
- *(All four routed as `<ComingSoon>` today — Phase 4 unhides them.)*

### 14.9 Admin panel (`/admin`, protected)

- Sidebar sections: Kreator wydarzeń, Rozliczenia (finalization queue), Wyślij powiadomienie, database lists (Wydarzenia, Wiedza, Aktualności, Grafiki → `/admin/galeria`), Członkowie, Kalendarz link.
- **Bootstrap banner** "Zostań Administratorem" only when `user.role==='user'` → `POST /api/auth/make-admin`.
- **Event creator form:** title (req), category (GÓRY/INTEGRACJA/KULTURA), start (req)/end dates, spots checkbox+number; **GÓRY-only**: difficulty picker (1–5 hover stars), organizer, planned distance/elevation/duration, location (req), map link, map embed (iframe), meeting point name+link/embed, transport, weather, description (Markdown), **equipment selector with 3-state toggle** (none → "Warto mieć"/required → "Trzeba mieć"/critical → none), image picker + focal-point picker. Non-GÓRY: simplified (organizer, location, map, description, image). Buttons: "Opublikuj Wydarzenie" / "Zapisz Szkic".
- **Event ID auto-generated** `YYYY_NN_TYPE_CODE`; `plannedDuration` hours→minutes.
- **Event list tab:** drafts (edit/delete, draft badge) + published (star=featured toggle, trophy=highlighted toggle, edit, refresh/re-finalize, delete). Edit mode pre-fills form; button text switches Opublikuj/Zapisz Zmiany/Zaktualizuj Szkic.
- **Completion/GPX queue:** past unfinalized events; GPX route management (prioritize/order, edit label, assign participants, official flag); finalize button.
- **Finalize flow** (`POST /api/events/:id/finalize`): reset all `attended=false` → set `attended=true` for selected → update GPX rows with route data + `APPROVED` → set `isFinalized`, `actualDistance/Elevation/Duration`.
- **News tab:** create (title, content, type, image), list+delete, toggle featured for event/article (`POST /api/news/toggle`).
- **Wiki tab:** editor (title, content, category, tags, author), list edit/delete.
- **User management:** table (name, email, status, role, actions); status toggle ACTIVE/INACTIVE; role toggle ADMIN/USER; delete; owner protected, self-change blocked; sorted status then name.
- **Push broadcast:** message textarea → `POST /api/push/send` to all subscriptions.
- Dirty-form guard on tab switch. Delete offers UNDO.
- APIs: events CRUD + `/featured` + `/admin/completion-queue` + `/finalize`, gpx `/queue` + status, wiki CRUD, news CRUD + toggle, users list/status/role/delete, push send, make-admin.

### 14.10 Admin gallery (`/admin/galeria`, protected)

- Header "Baza Grafik"; search (tag/name); multi-file upload (spinner while uploading); 8-col image grid (grayscale→hover color, resolution badge on hover, maximize+edit overlay, name+≤2 tags).
- Detail modal: large preview, edit name, tags (comma-separated → trimmed, empties filtered), save, stats (resolution, file size via byte→KB/MB), delete, "Pełny rozmiar" link. Images sorted `createdAt` DESC. Delete UNDO.
- From `GET /api/images/all`, `GET /api/images/search`, `POST /api/images/upload-asset`, `PUT /api/images/:id`, `DELETE /api/images/:id`.

### 14.11 Layout / global chrome

- Fixed navbar with backdrop blur, scroll-style change, **ResizeObserver overflow → switch to mobile menu** (<1024px); logo, nav links, right actions.
- **iOS PWA banner** (dismissible) prompting add-to-home-screen for notifications.
- Mobile slide-in menu (nav + profile/logout + admin link if admin); body scroll locked when open; overlays close on route change.
- **Notification dropdown:** last 20, unread count badge, mark-read on click, individual dismiss, **auto-refresh every 60s**. From `GET /api/push`, `PATCH /api/push/:id/read`, `DELETE /api/push/:id`.
- Footer: branding, Instagram/Facebook/Kontakt/Prywatność, copyright year.
- Guest sees "Zaloguj się"; logged-in see profile + notifications (+ admin link if admin).

### 14.12 Backend behaviors that must be preserved

- **Events list** filtering by role (drafts for admin, participation-only for inactive), `goingCount`/`userStatus`/featured flags, sorted ASC by `dateStart`.
- **`/featured`** returns 6 upcoming featured (home news), **`/highlighted`** returns 6 achievements, both DESC.
- **RSVP rules:** statuses GOING/INTERESTED/null; reject past-dated events; enforce spot limits (block GOING when full unless upgrading from INTERESTED); null status removes the participation row; `notifyDaysBefore` stored separately.
- **GPX upload:** parse distance/elevation/duration (manual duration override), status `PENDING`; admin queue + approve/reject; **approval/rejection invalidates stats cache**.
- **Image pipeline (sharp):** originals JPEG 90%, thumbnails WebP, avatar cropped 400×400, asset uploads keep format; TRUP watermark applied at upload time via `lib/watermark.ts`. Same outputs as the current app — processing stays in-process on the LXC.
- **Push:** subscribe stores endpoint+keys; send broadcasts and **auto-cleans `410 Gone`** subscriptions.
- **Stats** (cached): expeditions = count of published GÓRY; distance/elevation/duration = sum of approved GPX; members = ACTIVE users. **Invalidated on** finalize, user-status change, GPX approve/reject.
- **Search** (min 3 chars): ACTIVE users (≤10), events by title/id (≤10), albums by title/description (≤10); unified results with type/url/description.
- **News**: ordered priority DESC then createdAt DESC; joins event/article data; toggle adds/removes featured.
- **Users `/auth/me`**: profile + participations (with full event + participants) + GPX + computed personal stats.

### 14.13 Per-phase parity ownership

- **Phase 1** ports and verifies §14.12 (all backend behaviors) + the API contracts in §14.2–14.11.
- **Phase 2** ports and verifies the UI of §14.2–14.7, §14.9–14.11 (live pages) against the old site.
- **Phase 4** unhides and verifies §14.8 (News, Wiki, Gallery were `<ComingSoon>`).
- Final sign-off: every subsection of §14 demonstrably works in the new app.

---

*Maintained alongside `CLAUDE.md`. Update this file as phases complete or decisions change. Phase 0 does not begin until the user gives explicit approval.*
