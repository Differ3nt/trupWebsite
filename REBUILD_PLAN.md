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
| Image upload | multer receiving binary in Express | **Presigned URL → R2 direct upload** | Vercel enforces a 4.5 MB request body limit; binary data must never pass through Vercel. Client gets a presigned PUT URL from the API and uploads directly to R2. |
| Image processing | sync sharp in-process | **Cloudflare Worker (async, R2-triggered)** | Vercel Hobby timeout is 10 s; synchronous watermark + resize on large files will 504. R2 event notification triggers a Worker; Vercel is not in the image-processing path. |
| Connection pooler | single persistent pool (Express) | **Prisma Accelerate** (Phase 0, not Phase 5) | Each Vercel function invocation opens a new DB connection; without a pooler, `max_connections` is exhausted during development. Must be live before Phase 1 begins. |
| Hosting | Self/VPS (tsx) | **Vercel** (required — see §11) | VPS + Next.js 15 is a significant operational burden; Vercel is the correct hosting target for this stack |

**Kept as-is** (well-built, port directly): all `src/components/` UI primitives, Leaflet GPX rendering, sharp watermark logic, gpxUtils parsing, the Tailwind design tokens.

---

## 2.1 Serverless Architecture Constraints

Three hard limits of Vercel's serverless infrastructure affect core features. All three are resolved by architectural decisions already incorporated into the phases; they are documented here so the *why* behind the upload and image-processing flows is always clear.

### Constraint A — Vercel 4.5 MB request body limit

Vercel serverless functions reject requests larger than 4.5 MB **before any application code executes** (HTTP 413). The current Express app uses multer to receive image uploads directly — this pattern is incompatible with Vercel. Members may also want to upload high-resolution originals larger than this limit.

**Solution: Presigned URL direct-to-R2 upload**

Upload becomes a two-step process:

1. **`POST /api/images/presign`** — server authenticates the user, validates file type and metadata, generates a short-lived presigned `PUT` URL for the R2 bucket (using `@aws-sdk/s3-request-presigner`), returns `{ presignedUrl, key }`.
2. **Client uploads directly to R2** via the presigned URL — the binary data never passes through a Vercel function.
3. **`POST /api/images/confirm`** — client sends the `key`; server verifies the object exists in R2, creates the DB record, and marks the image as pending processing.

No file-size limit. Vercel only handles small JSON payloads.

### Constraint B — 10-second serverless execution timeout

Vercel Hobby tier enforces a hard 10-second timeout per function invocation. Synchronous `sharp` watermark generation on large images (resize to 1920px + logo composite) will routinely exceed this, returning HTTP 504 with no partial output.

**Solution: Async processing via Cloudflare Worker + R2 event trigger**

1. Original image lands in R2 (uploaded by the browser via presigned URL, zero Vercel involvement).
2. An **R2 event notification** triggers a **Cloudflare Worker**.
3. The Worker reads the original from R2, runs resize + watermark (ported from `watermark.ts` using `@cf-wasm/sharp` or equivalent), writes the processed variant back to R2 under a deterministic key.
4. The Worker calls `POST /api/images/confirm-processed` (an internal Vercel Route Handler) or updates the DB directly via Prisma's HTTP driver, marking the image ready.

The Worker runs at the Cloudflare edge with no timeout limit, independent of Vercel. The existing sharp logic ports directly.

### Constraint C — Database connection exhaustion

Express maintains a single persistent connection pool. In Vercel serverless, each concurrent request can instantiate a new function that opens a fresh TCP connection to the PostgreSQL server. With PostgreSQL's default `max_connections` (typically 100 or lower on a self-hosted Proxmox instance), even routine parallel development requests exhaust the limit, causing `connection refused` errors.

**Solution: Prisma Accelerate in Phase 0, not Phase 5**

This is **not production polish**. Without a pooler, Phase 1 development testing will hit connection exhaustion. It must be running before the first Route Handler is written.

- **Recommended: Prisma Accelerate** — Prisma's managed pooler. Replace `DATABASE_URL` with the Accelerate connection string; the Prisma client change is transparent. Free tier: 100k queries/month, 6 pooled connections per database — sufficient for a small club site.
- **Alternative: pgBouncer on the DB host** — more control, free, requires Proxmox admin access. Use transaction-mode pooling (required for serverless, not session mode).

---

## 3. Guardrails

These apply to every phase:

1. **The production database is sacred.** No data migration, no data loss. We only convert the *schema management method* (raw SQL → Prisma Migrate) via a baseline migration against the existing DB.
2. **No visual redesign.** This is a technical rewrite. The site looks identical when done. The design system (§6) *codifies* the current look — it does not change it.
3. **Each phase is independently deployable.** Never leave the app half-broken between phases. The old app keeps running until the new one fully replaces it (see §10 Cutover).
4. **Branch `rewrite/nextjs`.** All rebuild work lives here. Merge to `main` only after the user approves a completed, verified phase.
5. **Phase gate.** Do not start a phase without the user saying "go" for that phase. Report at the end of each phase with what to verify.
6. **Tests are part of "done."** A feature isn't done until it has at least a smoke test. No more "there is no test suite."

---

## 4. Current → Target Inventory

Concrete mapping so nothing is lost in translation.

### 4.1 API routes (Express `server/routes/` → Next.js `app/api/`)

| Current (Express) | Lines | Target (Route Handler) | Notes |
|---|---|---|---|
| `auth.ts` | 245 | **Deleted** — replaced by NextAuth | NextAuth handles Google provider, session, callback, logout |
| `events.ts` | 608 | `app/api/events/route.ts` + `[id]/` | Largest file; split into list / detail / rsvp / finalize handlers |
| `upload.ts` | 366 | `app/api/images/presign/route.ts` + `app/api/images/confirm/route.ts` | Binary data never touches Vercel. `presign` authenticates + returns R2 presigned URL; `confirm` creates DB record + enqueues processing. Watermark runs in a Cloudflare Worker. |
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
| `server/middleware/watermark.ts` | **Cloudflare Worker** (separate deployment) — logic ports directly to Worker runtime using `@cf-wasm/sharp` |

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
└── uploads/                       # local only in dev; Cloudflare R2 in production (see §11)
```

**Cloudflare Worker** (separate deployment, outside this repo):
```
trup-image-worker/
├── src/index.ts                   # R2 event handler: read original → resize + watermark → write variant → confirm to API
└── wrangler.toml                  # R2 bucket binding + event trigger config
```
The Worker is a small, independent project. It has one job: receive an R2 upload event, process the image, write the result back. It never touches auth or business logic.

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
- Images are uploaded directly to R2 via presigned URLs (see §2.1). The Cloudflare Worker handles async watermark generation; the Next.js app only stores and serves R2 URLs — it never processes binary image data.
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
2. Confirm hosting (Vercel) and file storage (Cloudflare R2 for production) — see §11. No decisions deferred.
3. Scaffold Next.js 15 + TypeScript (strict) + Tailwind v4 + App Router in `rewrite/nextjs`.
4. Point Prisma at the **existing production-shaped DB** (a clone/staging copy, never prod directly).
5. `prisma migrate diff` + `prisma migrate resolve` to create a **baseline migration** matching the current DB exactly (no data change).
6. Configure NextAuth v5 with Google provider. Verify full login → session → logout against a test Google account.
7. Render a single trivial page that reads one row from the DB via Prisma in an RSC.
8. **Scaffold nonce-based CSP infrastructure**: generate a per-request nonce in `middleware.ts`, set the `Content-Security-Policy` response header (no `unsafe-inline`), and propagate the nonce to `app/layout.tsx`. Document the nonce propagation pattern — every `<Script>` tag and inline script written in Phases 1 and 2 **must** receive this nonce. Deferring CSP to Phase 3 guarantees expensive backtracking; doing it now means the foundation is correct.
9. **Validate the NextAuth v5 edge-split pattern**: implement `lib/auth.config.ts` (JWT strategy + Google provider, **no Prisma adapter** — Edge Runtime safe) and `lib/auth.ts` (full NextAuth config with Prisma adapter, used in RSCs and API Route Handlers only). `middleware.ts` imports **only** `auth.config.ts`. NextAuth v5 crashes in Edge Runtime when the Prisma adapter is loaded; this split is non-negotiable. Prototype route protection (`/profil` redirects unauthenticated users to `/`) before proceeding.
10. **Set up database connection pooler** (see §2.1 Constraint C): configure Prisma Accelerate (recommended — replace `DATABASE_URL` with Accelerate connection string) or pgBouncer on the DB host in transaction mode. Verify that a burst of 20 parallel requests does not exhaust `max_connections`. This **must be live before Phase 1 begins** — without it, parallel Route Handler development will hit connection exhaustion and produce misleading errors.

**Exit criteria:** Google login → session → logout works. DB read from RSC works. Schema and DB are in sync via a real Prisma migration. CSP nonce infrastructure in place with no `unsafe-inline` from day one. Protected route redirects unauthenticated users correctly via `auth.config.ts` in middleware. 20 parallel requests complete without connection errors. Nothing else exists yet.

**Effort: ~3–4 sessions** (was 1–2; the CSP scaffold, NextAuth edge validation, and baseline migration each carry real uncertainty; this is the highest-risk phase).

### Phase 1 — API Layer

1. Port each Express route to a Next.js Route Handler (see §4.1 mapping). Start with read-only (`events` list, `albums`, `stats`), then mutations. Budget roughly one session per major route file.
2. Write a Zod schema for every request body and query param in `lib/validations/`.
3. Create one shared session/authorization helper (`requireUser()`, `requireAdmin()`, `requireOwnerSafe()`) — used by **every** handler. No local auth copies, ever.
4. Port owner-protection and self-demotion guards from `users.ts`.
5. Re-implement rate limiting via Next.js middleware (or Vercel's built-in rate limiting).
6. **Implement the presigned-URL upload flow** (see §2.1 Constraint A): `POST /api/images/presign` (authenticate + return R2 presigned URL) and `POST /api/images/confirm` (verify object in R2, create DB record). Delete the old multer-based upload path entirely. Also set up and deploy the Cloudflare Worker for async watermark processing (see §5 Worker structure).
7. All mutations use **Server Actions** where appropriate; Route Handlers for external API consumers. No React Query — the framework handles caching.
8. Smoke test: hit every endpoint with valid + invalid payloads; invalid must be rejected by Zod with a 400.

**Exit criteria:** Every API endpoint responds correctly and rejects bad input. Verified against the still-running old frontend if practical, or via a request test script.

**Effort: ~7–10 sessions** (was 3–4; `events.ts` alone is 608 lines; every endpoint needs Zod, server-action wiring, and payload tests; the original estimate was optimistic by roughly 2×).

### Phase 2 — Frontend Migration

1. **Build the design-system foundation first** (§6): tokens, unified `Button` (CVA, deletes `.btn-*`), icon registry, layout/nav components, state components (`EmptyState`, `ErrorState`), `/styleguide`. Everything below consumes it — do not skip this step.
2. Move remaining `components/` over; fix imports; confirm they render in `/styleguide`.
3. Convert pages per §4.2. Public read pages become RSC; interactive pages (Admin, Calendar) stay client components with `'use client'`.
4. Replace `AppContext` server-data fetching with **RSC + Server Actions**. Keep a minimal Zustand store for pure UI state only (toast queue, modal open/close, mobile drawer) — these are the only things the server doesn't already own. **Do not introduce React Query**: Next.js 15's RSC + `unstable_cache` + Server Actions covers the same ground with zero extra dependency.
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

1. Structured logging (replace `console.error`/`console.log` with a logger — `pino`).
2. Error monitoring (Sentry — Next.js integration).
3. ~~DB connection pooling~~ — **already done in Phase 0**. Verify under production load.
4. CI pipeline on Vercel: lint + typecheck + smoke tests run on every PR automatically.
5. Verify `uploads/` fully migrated to Cloudflare R2 and Cloudflare Worker processing is confirmed working end-to-end.
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
4. Verify `uploads/` files are fully synced to Cloudflare R2.
5. Smoke test the new app against prod data on a Vercel preview URL.
6. Switch DNS to the Vercel production deployment.
7. Keep the old app deployable for 1–2 weeks as instant rollback.
8. Remove the old app once stable.

**Rollback:** DNS back to old app + restore DB from backup if a migration went wrong. Because we kept the old app, rollback is minutes, not hours.

---

## 11. Open Decisions (resolve in Phase 0 with user)

| Decision | Answer | Notes |
|---|---|---|
| Hosting | **Vercel** (required) | VPS self-hosting of Next.js 15 is a significant operational burden: manual `standalone` build, custom `sharp` compilation, manual ISR cache invalidation, no built-in image optimization CDN, PM2 management. This contradicts "done right, not fast." If budget becomes a concern, Vercel's hobby tier is free for low traffic. If data-residency ever requires self-hosting, the correct response is to reconsider the framework (Remix or SvelteKit are deployment-agnostic); not to fight Next.js's Vercel coupling. |
| File storage | **Cloudflare R2** (required) | Vercel's ephemeral filesystem does not persist between deployments. Cloudflare R2 is S3-compatible with a generous free tier and works well with Cloudflare CDN for serving images. |
| Image upload method | **Presigned URL → R2 direct** | Vercel 4.5 MB body limit makes server-side upload reception impossible for large photos. Client receives a presigned PUT URL and uploads directly to R2 (see §2.1 Constraint A). |
| Image processing | **Cloudflare Worker (async, R2-triggered)** | Vercel 10 s timeout rules out synchronous sharp processing. R2 event notification triggers a Worker which does resize + watermark asynchronously (see §2.1 Constraint B). |
| Connection pooler | **Prisma Accelerate** (Phase 0) | Serverless connection exhaustion kills development, not just production. Prisma Accelerate free tier is sufficient; pgBouncer on the DB host is the alternative (see §2.1 Constraint C). |
| State management | **RSC + Server Actions** (no React Query) | Already decided; see §2 and Phase 2. |
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
| Vercel 4.5 MB body limit blocks image uploads | Certain | High | **Fixed by design**: presigned URL → R2 direct upload (§2.1 Constraint A); binary data never passes through Vercel |
| Vercel 10 s timeout kills sharp processing | Certain | High | **Fixed by design**: async Cloudflare Worker triggered by R2 event (§2.1 Constraint B); Vercel not in image-processing path |
| DB connection exhaustion during development | Certain | High | **Fixed by design**: Prisma Accelerate (or pgBouncer) configured in Phase 0 step 10 — before Phase 1 begins |
| CSP written before nonce infrastructure | Was HIGH | Phase 0 | **Fixed by design**: CSP scaffold moved to Phase 0; every subsequent phase builds on the correct foundation |
| React Query added to App Router project | Was MEDIUM | — | **Removed from plan**: RSC + Server Actions + `unstable_cache` covers the same surface with zero extra dependency |
| Self-hosting Next.js on VPS | Removed | — | **Removed from plan**: operational complexity exceeds the budget for a small club site. Vercel is required. |
| Duplicated button styling causes visual drift | Low | Low | Unified on one CVA source in Phase 2; `.btn-*` CSS deleted |
| Scope creep into redesign | Medium | High | Guardrail §3.2 — design system *codifies*, never changes, the look |
| Lost uploads during cutover | Low | High | Full R2 sync verified before DNS switch (§10) |
| **Live app stays vulnerable during rewrite** (session-revocation bypass unpatched) | Certain | Medium | **Accepted** per §1.1. If the site goes fully public before cutover, revisit and patch the HIGH issue in the current app as the one exception to the no-interim-patches rule. |

---

## 13. Definition of Done (whole project)

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
- [ ] Smoke tests in CI (lint + typecheck + key flows on every PR via Vercel)
- [ ] Error monitoring (Sentry) + structured logging (`pino`) in production
- [ ] Uploads migrated to Cloudflare R2; watermarked variants pre-generated
- [ ] Old app retired after stable cutover

---

*Maintained alongside `CLAUDE.md`. Update this file as phases complete or decisions change. Phase 0 does not begin until the user gives explicit approval.*
