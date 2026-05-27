# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Workflow Rules

These are non-negotiable process rules. Follow them on every task, every session.

1. **Always work in a branch.** Never commit directly to `main`. Create a descriptive branch (`feat/`, `fix/`, `chore/`) for every change, no matter how small.
2. **Ask before merging to main.** When work is ready, push the branch and tell the user — do not open a PR or merge without explicit approval.
3. **Ask how new features connect.** Before implementing anything that touches existing systems (auth, events, user model, GPX, notifications), ask the user how it should integrate with what's already there. Don't assume.
4. **Keep it simple.** TRUP is a small club site. Avoid over-engineering: no abstractions for hypothetical future requirements, no premature generalization. Three similar lines is better than a premature abstraction.
5. **Prefer modularity.** New backend functionality goes in its own route file. New UI functionality goes in its own component. Keep files focused and small.
6. **No silent scope creep.** If you notice something unrelated that could be improved while doing a task, mention it — don't just fix it.

---

## Project Overview

This is the website for **TRUP** — a Polish hiking/mountain club. The stack is a full-stack TypeScript monorepo: a React 19 SPA (Vite) and an Express.js API server sharing the same repo.

---

## Commands

```bash
# Run both frontend (port 5173) and backend (port 3001) concurrently
npm run dev

# Run frontend or backend independently
npm run dev:client
npm run dev:server

# Type-check (no emitting)
npm run lint

# Production build (frontend only)
npm run build

# Start production server
npm start

# After schema changes
npm run prisma:generate

# Seed the database
npx prisma db seed
```

There is no test suite.

---

## Architecture

### Frontend (`src/`)

- **React 19** with React Router v7 (`createBrowserRouter`). All routes are defined in `src/App.tsx`.
- **Tailwind CSS v4** (no config file — uses `@tailwindcss/vite` plugin). Use the `cn()` helper from `src/lib/utils.ts` for conditional classes.
- **Global state** lives in `src/contexts/AppContext.tsx` (`AppProvider`). It exposes: `user`, `role` (`'guest' | 'user' | 'admin'`), `loading`, auth helpers (`loginWithGoogle`, `logout`, `refreshUser`), `hasHardware(item)`, toast via Sonner (`showToast`), and a confirmation modal system (`confirmAction`).
- **Route protection** is handled by `src/components/ProtectedRoute.tsx`. The Admin panel (`/admin`) checks `role` from context but both `user` and `admin` roles can access it — actual admin operations are enforced server-side.

### Frontend Routes (`src/App.tsx`)

| URL | Component | Status |
|---|---|---|
| `/` | `Home` | Live |
| `/wydarzenia` | `Events` | Live |
| `/wydarzenia/:id` | `EventDetail` | Live |
| `/kalendarz` | `CalendarPage` | Live |
| `/profil` | `Profile` | Live (protected) |
| `/admin` | `Admin` | Live (protected) |
| `/admin/galeria` | `AdminGallery` | Live (protected) |
| `/galeria/:id` | `GalleryDetail` | Live |
| `/aktualnosci` | `News` | Implemented, routed as `<ComingSoon>` |
| `/galeria` | `Gallery` | Implemented, routed as `<ComingSoon>` |
| `/wiki` | `Wiki` | Implemented, routed as `<ComingSoon>` |
| `/wiki/:id` | `WikiArticle` | Implemented, routed as `<ComingSoon>` |
| `/o-nas` | `About` | `<ComingSoon>` |

Pages marked `<ComingSoon>` have fully-functional backend APIs and frontend components — they are just hidden behind the placeholder wrapper for now.

### Frontend Pages (`src/pages/`)

- `Home.tsx` — Featured events showcase
- `Events.tsx` — Event list with filtering/search
- `EventDetail.tsx` — Full event info, RSVP, GPX tracks, maps, participants list
- `Calendar.tsx` — Month calendar view of events
- `Gallery.tsx` — Photo albums list
- `GalleryDetail.tsx` — Album detail with lightbox, skeleton loading
- `AdminGallery.tsx` — Gallery admin: image upload, tagging, ordering
- `Wiki.tsx` — Article list with search and category filtering
- `WikiArticle.tsx` — Individual wiki article display
- `News.tsx` — News timeline with priority ordering
- `Profile.tsx` — User dashboard: equipment list, events attended, GPX submissions
- `Admin.tsx` — Main admin panel: event CRUD, RSVP tracking, GPX approval, event finalization
- `About.tsx` — About page (`<ComingSoon>`)

### Frontend Components (`src/components/`)

**UI primitives:** `Badge`, `Button`, `Card`, `Checkbox`, `FormField`, `Input`, `Modal`, `Select`, `Skeleton`, `Textarea`, `Tooltip`, `NavItem`, `AuthGate`

**Feature components:**
- `ComingSoon` — Placeholder for unreleased pages
- `ConfirmationModal` — Reusable confirm dialog (driven by `confirmAction` in context)
- `EventCountdown` — Live countdown timer to event start
- `GpxPreview` — GPX track map preview (Leaflet)
- `GpxUploadModal` — GPX file upload & metadata form
- `ImageCropper` — Client-side image cropping
- `ImageLoader` — Lazy-loading image with spinner (use for album photos)
- `ImagePicker` — Image selection UI
- `ImagePositionPicker` — Focal point picker for event header images (sets `imageFocalX`/`imageFocalY`)
- `Layout` — App shell with navigation
- `Lightbox` — Full-screen image viewer with navigation and download progress
- `MapyLink` — Mapy.cz link renderer
- `NewsCard` — News item card
- `PageHeader` — Hero header with focal-point-aware background image
- `PhotoWatermark` — Client-side watermark preview
- `ProtectedRoute` — Auth gate for protected routes
- `ScrollToTop` — Scroll restoration on route change

### Backend (`server/`)

- **Express** server on port 3001 (configurable via `PORT` env var). Entry point is `server/index.ts`.
- **Prisma** ORM with PostgreSQL. Schema in `prisma/schema.prisma`.
- **Startup migration** — `runMigrations()` in `server/index.ts` runs raw `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements on every server start. This is intentional dev-mode behaviour to avoid formal Prisma migrations during rapid iteration. When adding new columns to the schema, also add the corresponding `ALTER TABLE` guard in `runMigrations()`.
- Each route file creates its own `new PrismaClient()` instance (current pattern — do not consolidate without testing).
- Complex list queries (events with participant counts, user status) use `prisma.$queryRawUnsafe()` with parameterised values for performance.

### API Routes

| Prefix | File | Purpose |
|---|---|---|
| `/api/auth` | `server/routes/auth.ts` | Google OAuth2 + JWT session |
| `/api/events` | `server/routes/events.ts` | Events CRUD, RSVP, featured/highlighted flags, event finalization |
| `/api/albums` | `server/routes/albums.ts` | Photo albums list & detail |
| `/api/images` | `server/routes/upload.ts` | Image upload (multer + sharp), tagging, deletion |
| `/api/gpx` | `server/routes/gpx.ts` | GPX file upload, parsing, approval workflow |
| `/api/wiki` | `server/routes/wiki.ts` | Wiki article CRUD |
| `/api/news` | `server/routes/news.ts` | News/announcements CRUD with priority ordering |
| `/api/stats` | `server/routes/stats.ts` | Aggregate group stats (in-memory cached) |
| `/api/users` | `server/routes/users.ts` | User profile management, user list |
| `/api/search` | `server/routes/search.ts` | Global search (users, events, albums — min 3 chars) |
| `/api/push` | `server/routes/push.ts` | Web Push subscriptions and notifications |

### Authentication

- Google OAuth2 flow: `/api/auth/google` → Google consent → `/api/auth/google/callback` → JWT cookie.
- JWT stored in `httpOnly` cookie named `token` (7-day TTL).
- Auth middleware in `server/middleware/auth.ts`:
  - `authenticate` — verifies JWT, attaches `req.userId`/`req.userRole`; checks `lastLogoutAt` to invalidate revoked sessions
  - `requireAdmin` — checks `ADMIN` role (403 if not)
  - `getUserIdFromCookie()` — returns `userId` from JWT cookie or `null` (for optional auth)
  - `getUserFromCookie()` — returns `{ userId, role }` or `null`
- Many routes use `getUserIdFromCookie()` for optional auth — public access shows masked/limited data.
- DB role enum: `USER | ADMIN`. Frontend role string: `'guest' | 'user' | 'admin'`.
- Emergency first-admin grant: `POST /api/auth/make-admin` (only works if no admin exists yet).
- The OAuth callback URL is set via the `CALLBACK_URL` environment variable (defaults to `http://localhost:3001/api/auth/google/callback`). Update `CALLBACK_URL` for production deployments.
- **Owner protection**: `OWNER_EMAIL` env var designates a permanent owner account that cannot be demoted or deleted by any admin.

### Middleware (`server/middleware/`)

- **`auth.ts`** — JWT authentication (see Authentication section above).
- **`watermark.ts`** — Intercepts requests to `/uploads` and overlays the TRUP logo (white, 90% opacity, drop shadow) onto served images on-the-fly. Watermarked versions are cached in a `.wm-cache` directory alongside originals. Original files on disk are never modified. GPX and other non-image files pass through untouched. Sizing: 15% of image width for originals, 18% for thumbnails.

### File Storage

- Uploaded files (images and GPX) are stored in the `uploads/` directory at the project root.
- Images at `/uploads/*` are served via the watermark middleware (see above).
- Images are processed with **sharp** on upload: originals resized to max 1920px, thumbnails at 400px.
- Event header images support a **focal point** (`imageFocalX`, `imageFocalY` on `Event`), set via the `ImagePositionPicker` component. The `PageHeader` component uses these values for CSS `object-position`.
- GPX files are parsed with `gpxparser` / `@tmcw/togeojson`; parsing logic in `server/lib/gpxUtils.ts`.
- Stats cache (`server/routes/stats.ts`) is invalidated by calling `invalidateStatsCache()` after GPX approval or event finalisation.

### Key Data Models

**`User`** — `role` (USER/ADMIN), `status` (ACTIVE/INACTIVE/FLAGGED), `lastLogoutAt` (used for session revocation). `OWNER_EMAIL` env var designates an undeletable/undemotable owner.

**`Event`** — has `isDraft`, `isFinalized`, `featured`, `highlighted`, `isExpedition` flags. Sensitive fields (`mapLink`, `mapEmbed`, `gearRequired`, `meetingPoint*`, etc.) are stripped for unauthenticated requests. Key fields:
- `imageFocalX`, `imageFocalY` — focal point for header image CSS positioning
- `plannedDistance`, `plannedElevation`, `plannedDuration` — pre-event estimates
- `actualDistance`, `actualElevation`, `actualDuration` — filled in after finalization
- `gearCritical` — subset of `gearRequired` that is mandatory
- `meetingPointName`, `meetingPointLink`, `meetingPointEmbed` — meeting point details
- `organizer`, `transport`, `weatherInfo` — trip logistics

**`GpxSubmission`** — status lifecycle: `PENDING → APPROVED | REJECTED`. `participantIds` is a `String[]` of user IDs for group tracks. `isOfficial` marks the canonical track for an event. `order` and `label` control display ordering.

**`EventParticipation`** — `status` values used in queries: `'GOING'`. `attended` (boolean) is set during event finalization.

**`WikiArticle`** and **`NewsItem`** — tables created via raw SQL in `runMigrations()` (not in a formal Prisma migration). `NewsItem` has a `priority` int for ordering and supports linking to events/articles via `eventId`/`articleId`.

**`Notification`** — in-app user notifications (type defaults to `'SYSTEM'`). Linked to `PushSubscription` for Web Push delivery.

**`Image`** — images have a many-to-many relation with `Tag`. `albumId` is nullable (images can exist outside albums as assets).

### Admin Features

The `/admin` route (`Admin.tsx`) covers:
- Event creation, editing, draft/publish toggle
- Attendance tracking and RSVP management
- GPX submission review queue and approval
- **Event finalization queue** at `GET /api/events/admin/completion-queue` — lists finalized events needing post-event data entry (actual stats, track approval)
- User management (activate/deactivate, promote/demote, delete — with owner + self-demotion guards)

---

## Environment Variables

Required in `.env`:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLIENT_URL=http://localhost:5173      # frontend origin for CORS + OAuth redirect
CALLBACK_URL=http://localhost:3001/api/auth/google/callback  # Google OAuth callback
OWNER_EMAIL=...                       # email of the permanent owner account (cannot be deleted/demoted)
PORT=3001                             # optional
```

Optional (Web Push notifications):

```
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:...
```

If `VAPID_*` variables are not set, push notification endpoints will still register but sending will fail silently.

---

## Architectural Principles

These are guiding principles for all future development on this project, current stack or rewrite.

- **One concern per file.** Route files own their endpoints. Components own their UI. Don't let logic bleed across boundaries.
- **Security at the boundary.** Validate and sanitize at the API boundary (user input, external data). Trust internal code. Don't re-validate data that never left the server.
- **Shared auth middleware, always.** Never define a local `authenticate` function inside a route file. Always import from `server/middleware/auth.ts`. Local copies silently break session revocation, rate-limiting, and any future security additions.
- **Explicit over implicit.** Pass data down explicitly. Avoid magic globals. Make the data flow readable.
- **Ask before you add complexity.** If a feature requires a new pattern, a new dependency, or touches core data models, discuss with the user before implementing. The cost of an unnecessary abstraction is higher than the cost of a short conversation.
- **Small commits, clear messages.** Each commit should do one thing. Commit message should say what changed and why (not just what).

---

## Known Issues & Security Debt

Track active bugs and technical debt here. Update this list when issues are fixed or discovered.

**Last reviewed: 2026-05-27**

### Security Issues

1. **Three routes bypass session revocation** *(HIGH — fix before going public)*
   - `server/routes/gpx.ts`, `server/routes/push.ts`, and `server/routes/users.ts` each define their own local `authenticate` function. These functions do NOT check `lastLogoutAt`, meaning a user who logged out can still use old JWT tokens to access these endpoints.
   - **Fix**: Replace all three local `authenticate` functions with the shared middleware from `server/middleware/auth.ts`.

2. **OAuth flow missing CSRF state parameter** *(MEDIUM)*
   - The Google OAuth redirect at `GET /api/auth/google` does not generate or verify a `state` parameter. This is vulnerable to CSRF attacks on the OAuth flow.
   - **Fix**: Generate a random `state` value, store it in a short-lived cookie, verify it in the callback.

### Technical Debt

3. **`prisma.$queryRawUnsafe()` usage** — Some event list queries use raw SQL with parameterized values. This is safe as written but fragile. Audit before adding new query variants.

4. **`as any` casts for `lastLogoutAt`** — Since `prisma generate` can't run in dev without a DB connection, the `lastLogoutAt` field uses `as any` type casts. Running `npm run prisma:generate` with DB access will resolve these.

5. **Raw SQL startup migrations** — `runMigrations()` in `server/index.ts` runs `ALTER TABLE IF NOT EXISTS` on every start instead of using Prisma's migration system. This works but is the wrong pattern for production and makes schema history invisible.

6. **Multiple PrismaClient instances** — Each route file imports from `server/lib/prisma.ts` which should export a singleton, but this should be verified to confirm connection pooling is not a problem under load.

---

## Master Rewrite Plan

The full, detailed rebuild plan lives in **`REBUILD_PLAN.md`** at the project root. Read it before starting any rewrite work. Summary:

- **Goal**: holistic, production-grade rewrite to **Next.js 15 App Router + NextAuth.js v5 + Prisma Migrate + Zod**. Done right, not fast.
- **Six phases (0–5)**: Foundation/de-risking → API layer → Frontend → Security hardening → Feature completion → Production & cutover. Each phase is independently deployable and gated on explicit user approval.
- **Hard prerequisite**: reconcile `prisma/schema.prisma` with `runMigrations()` (they have drifted) before any baseline migration — see `REBUILD_PLAN.md` §7.
- **Guardrails**: production DB is sacred (no data loss), no visual redesign, work in branch `rewrite/nextjs`, merge to main only after user approval, tests are part of "done".
- **Phase 0 requires explicit user blessing before any code is written.**

---

## CLAUDE.md Self-Update

This file should be kept up to date as the codebase evolves. Two mechanisms exist for this:

### `/sync-context` command

Run `/sync-context` at any time to trigger a review of recent git history and update this file. The command lives at `.claude/commands/sync-context.md`.

What it does:
1. Reads `git log` since CLAUDE.md was last touched
2. Identifies new routes, components, schema changes, and bug fixes
3. Updates the relevant sections of this file in-place
4. Commits the update on the current branch

### SessionStart hook

A `SessionStart` hook in `.claude/settings.json` checks whether CLAUDE.md is more than one day older than the latest commit. If it is stale, it prints a reminder to run `/sync-context` at the start of the session.

### What to record here

When updating this file, always update:
- New routes in the API Routes table
- New components in the Frontend Components list
- New frontend routes in the Frontend Routes table
- New environment variables in the Environment Variables section
- Newly discovered bugs in Known Issues
- Resolved bugs (mark them as fixed with date, then remove after the next session)
- Any new architectural patterns introduced

Do NOT record:
- Commit hashes or PR numbers (they rot)
- Names of specific past bugs or features fixed (use git log for that)
- Implementation details that belong in code comments
