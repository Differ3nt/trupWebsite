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
| Weak CSP (`unsafe-inline`) | MEDIUM | Phase 3 | Nonce-based CSP via SSR |
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
| DB access | Prisma (raw startup SQL) | **Prisma + Prisma Migrate** | Versioned, reviewable, reversible migrations |
| Validation | None | **Zod** | Typed schemas at every API boundary; shared client/server types |
| Server state | `fetch` + AppContext | **TanStack Query (React Query)** | Caching, revalidation, loading/error states |
| UI state | AppContext | Small **Zustand** store (or React context, kept minimal) | Decouple UI state from server state |
| Styling | Tailwind v4 | **Tailwind v4** (unchanged) | Already good; tokens port directly |
| Component variants | Hand-written variant maps + duplicate CSS | **CVA (class-variance-authority)** | One typed source of truth for variants/sizes |
| Icons | `lucide-react` imported ad-hoc | **`lucide-react` via a central registry** | Consistent icon vocabulary; one-file library swap |
| CSP | `unsafe-inline` | **Nonce-based CSP** | Real XSS protection, enabled by SSR |
| Forms | react-hook-form | **react-hook-form + Zod resolver** | Validation shared with the API |
| Images | multer + sharp on Express | **Next.js Route Handler + sharp** | Same processing, integrated |
| Hosting | Self/VPS (tsx) | **VPS or Vercel** (decide Phase 0) | Either works; Vercel simplifies CSP nonces + edge |

**Kept as-is** (well-built, port directly): all `src/components/` UI primitives, Leaflet GPX rendering, sharp image pipeline, watermark logic, gpxUtils parsing, the Tailwind design tokens.

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
| `upload.ts` | 366 | `app/api/images/route.ts` | Keep sharp pipeline; move multer → Next.js `FormData` parsing |
| `users.ts` | 210 | `app/api/users/route.ts` + `[id]/` | Drop local `authenticate`; use shared session helper. Keep owner guards |
| `push.ts` | 130 | `app/api/push/route.ts` | Drop local `authenticate`; keep web-push |
| `wiki.ts` | 124 | `app/api/wiki/route.ts` + `[id]/` | |
| `gpx.ts` | 112 | `app/api/gpx/route.ts` | Drop local `authenticate`; keep gpxUtils parsing |
| `news.ts` | 103 | `app/api/news/route.ts` | |
| `stats.ts` | 59 | `app/api/stats/route.ts` | In-memory cache → React Query cache or `unstable_cache` |
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
| `server/middleware/auth.ts` | `lib/auth.ts` (NextAuth config) + `auth()` session helper |
| `server/middleware/watermark.ts` | `app/uploads/[...path]/route.ts` or kept as a custom server route |

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
│   ├── auth.ts                    # NextAuth config + session helpers
│   ├── gpx.ts
│   ├── cva.ts                     # shared CVA variant helpers (optional)
│   ├── validations/               # Zod schemas, one file per resource
│   │   ├── event.ts
│   │   ├── gpx.ts
│   │   └── ...
│   └── utils.ts                   # cn() etc.
├── prisma/
│   ├── schema.prisma              # reconciled, single source of truth
│   ├── migrations/                # versioned migrations
│   └── seed.ts
├── middleware.ts                  # route protection + CSP nonce
├── public/
└── uploads/                       # (or move to object storage — decide Phase 0)
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
- **User menu:** profile, notifications (bell + dropdown), logout — gated by session; admin entry only shown to admins (the bug we already fixed in the current app — keep it fixed here).
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
- Watermark + sharp pipeline preserved. **Note:** the on-the-fly watermark complicates `next/image`; plan to pre-generate watermarked variants on upload (see §11) and serve them as plain images, or keep a custom image route.
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

- A **dev-only** `/styleguide` route renders every primitive with all variants/sizes, the color tokens, and the icon set. Lighter than Storybook and good enough for a small project — it makes "same style, customisable" verifiable at a glance and onboards future contributors fast.

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

Goal: prove the riskiest pieces work before committing to the full port.

1. **Reconcile the schema first** (do this in the *current* repo, see §8) so we baseline from truth.
2. Decide hosting (Vercel vs VPS) and file storage (local `uploads/` vs S3-compatible object storage). Recommendation in §11.
3. Scaffold Next.js 15 + TypeScript (strict) + Tailwind v4 + App Router in `rewrite/nextjs`.
4. Point Prisma at the **existing production-shaped DB** (a clone/staging copy, never prod directly).
5. `prisma migrate diff` + `prisma migrate resolve` to create a **baseline migration** matching the current DB exactly (no data change).
6. Configure NextAuth v5 with Google provider. Verify full login → session → logout against a test Google account.
7. Render a single trivial page that reads one row from the DB via Prisma in an RSC.

**Exit criteria:** Can log in with Google, see a session, read from DB, log out. Schema and DB are in sync via a real migration. Nothing else exists yet.

**Effort:** ~1–2 focused sessions. This is the highest-uncertainty phase.

### Phase 1 — API Layer

1. Port each Express route to a Next.js Route Handler (see §4.1 mapping). Start with read-only (`events` list, `albums`, `stats`), then mutations.
2. Write a Zod schema for every request body and query param in `lib/validations/`.
3. Create one shared session/authorization helper (`requireUser()`, `requireAdmin()`, `requireOwnerSafe()`) — used by **every** handler. No local auth copies, ever.
4. Port owner-protection and self-demotion guards from `users.ts`.
5. Re-implement rate limiting (Next.js middleware or hosting-level).
6. Port watermark image serving.
7. Smoke test: hit every endpoint with valid + invalid payloads; invalid must be rejected by Zod with 400.

**Exit criteria:** Every API endpoint responds correctly and rejects bad input. Verified against the still-running old frontend if practical, or via a test script.

**Effort:** ~3–4 sessions (events.ts alone is 608 lines).

### Phase 2 — Frontend Migration

1. **Build the design-system foundation first** (§6): tokens, unified `Button` (CVA), icon registry, layout/nav components, state components, `/styleguide`. Everything below consumes it.
2. Move remaining `components/` over; fix imports; confirm they render in the `/styleguide`.
3. Convert pages per §4.2. Public read pages become RSC; interactive pages (Admin, Calendar) stay client components.
4. Replace `AppContext` data-fetching with TanStack Query hooks; keep a thin Zustand store for pure UI state (toasts, modals, confirm dialog).
5. Replace `ProtectedRoute` with `middleware.ts` route protection.
6. Port toast (Sonner) and the confirmation-modal system.
7. Verify every live page visually matches the old site.

**Exit criteria:** All currently-live pages work and look identical in Next.js. Auth-gated pages redirect correctly. `/styleguide` shows the full system.

**Effort:** ~4–5 sessions (includes the design-system foundation).

### Phase 3 — Security Hardening

1. **Nonce-based CSP**: generate a per-request nonce in `middleware.ts`, inject into CSP header and every inline script tag. Remove `unsafe-inline` entirely.
2. Confirm NextAuth's automatic OAuth `state`/PKCE is active (replaces the missing CSRF param).
3. Audit every `prisma.$queryRawUnsafe` from the old `events.ts`/`search.ts`; replace with typed Prisma queries unless a measured perf need justifies raw SQL (then use parameterized `$queryRaw` tagged template, never `Unsafe`).
4. Add startup env validation with Zod (`@t3-oss/env-nextjs` or a hand-rolled `lib/env.ts`) — app refuses to boot with missing/invalid env.
5. Set secure cookie flags, HSTS, and the rest of the Helmet header set as Next.js headers.
6. Security review of the diff (`/security-review`).

**Exit criteria:** CSP has no `unsafe-inline`; env validated at boot; no `$queryRawUnsafe`; security review clean.

**Effort:** ~1–2 sessions.

### Phase 4 — Feature Completion

1. Unhide and finish the ComingSoon pages: `/galeria`, `/aktualnosci`, `/wiki`, `/o-nas` (backends already exist).
2. Build real `/o-nas` content with the user.
3. Add `generateMetadata` / Open Graph tags to event, gallery, and wiki detail pages (now possible with SSR).
4. Add `error.tsx` and `not-found.tsx`.

**Exit criteria:** No ComingSoon wrappers remain. Shared event links show rich previews.

**Effort:** ~1–2 sessions.

### Phase 5 — Production Readiness & Cutover

1. Structured logging (replace `console.error`/`console.log` with a logger — `pino`).
2. Error monitoring (Sentry).
3. DB connection pooling verified (Prisma + pgBouncer or hosting equivalent).
4. CI: lint + typecheck + smoke tests on every PR.
5. Move uploads to object storage if decided in Phase 0.
6. Execute the cutover plan (§10).

**Exit criteria:** New app in production, old app retired, monitoring green.

**Effort:** ~1–2 sessions + a maintenance window for cutover.

**Total rough estimate:** ~13–17 focused sessions across all phases. The user has accepted downtime, which removes the hardest constraint (zero-downtime migration).

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
3. Point the new app at the production DB; run `prisma migrate deploy` (baseline already applied, should be a no-op or only new migrations).
4. Migrate `uploads/` if moving to object storage; otherwise the new app reads the same directory.
5. Smoke test the new app against prod data on a staging URL.
6. Switch DNS / reverse proxy to the new app.
7. Keep the old app deployable for 1–2 weeks as instant rollback.
8. Remove the old app once stable.

**Rollback:** DNS back to old app + restore DB from backup if a migration went wrong. Because we kept the old app, rollback is minutes, not hours.

---

## 11. Open Decisions (resolve in Phase 0 with user)

| Decision | Options | Recommendation |
|---|---|---|
| Hosting | VPS (self-managed) vs Vercel | **Vercel** — simplest CSP nonce + edge + CI story for a small site; VPS only if cost or data-residency requires it |
| File storage | Local `uploads/` vs S3-compatible (R2/S3) | **Object storage (Cloudflare R2)** — local disk doesn't survive serverless; if staying on a VPS, local is fine |
| Image serving/watermark | On-the-fly (current) vs pre-generated on upload | **Pre-generate watermarked variants on upload** — cheaper per-request, plays nicer with CDN and `next/image` |
| Light mode | Single dark theme vs add light | **Dark only** for parity; tokens leave it open later |
| `@google/genai` dependency | Currently present — used? | Audit usage; drop if unused to shrink surface |
| Repo strategy | New branch vs new repo | **New branch `rewrite/nextjs`** — keeps history, easy to compare |

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema drift causes bad baseline | Medium | High | §8 reconciliation before Phase 0; baseline against a DB *clone* first |
| NextAuth Google config differs from current OAuth | Medium | Medium | Phase 0 de-risks this first, against a test account |
| `events.ts` (608 lines) hides edge cases | High | Medium | Port incrementally, endpoint by endpoint, with payload tests |
| `$queryRawUnsafe` queries hard to reproduce in Prisma | Medium | Low | Keep parameterized raw query as fallback where Prisma can't express it |
| Watermark middleware doesn't translate to serverless | Medium | Medium | Pre-generate variants on upload (see §11) |
| Duplicated button styling causes visual drift | Medium | Low | Unify on one CVA source; delete `.btn-*` CSS (§6.2) |
| Scope creep into redesign | Medium | High | Guardrail §3.2 — design system *codifies*, never changes, the look |
| Lost uploads during cutover | Low | High | Backup + verified copy before DNS switch (§10) |
| **Live app stays vulnerable during rewrite** (session-revocation bug unpatched until cutover) | Certain | Medium | **Accepted** per §1.1. Mitigation: keep the rewrite moving; if the site goes fully public before cutover, revisit and patch the HIGH issue in the current app as an exception |

---

## 13. Definition of Done (whole project)

- [ ] All current live pages work identically in Next.js
- [ ] All ComingSoon pages unhidden and functional
- [ ] Every API endpoint validates input with Zod
- [ ] Single shared auth helper; zero local `authenticate` copies
- [ ] Design system codified: unified `Button`, icon registry, tokens, nav, state components, `/styleguide`
- [ ] No duplicated styling; no hard-coded hex in components
- [ ] CSP has no `unsafe-inline`
- [ ] Real Prisma migrations; `runMigrations()` deleted
- [ ] `schema.prisma` is the honest single source of truth; no `as any`
- [ ] Owner protection + session revocation enforced everywhere
- [ ] Env validated at boot
- [ ] Accessibility baseline (§6.11) passing on core flows
- [ ] Smoke tests in CI (lint + typecheck + key flows)
- [ ] Error monitoring + structured logging in production
- [ ] Old app retired after stable cutover

---

*Maintained alongside `CLAUDE.md`. Update this file as phases complete or decisions change. Phase 0 does not begin until the user gives explicit approval.*
