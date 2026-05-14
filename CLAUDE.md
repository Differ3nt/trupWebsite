# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the website for **TRUP** — a Polish hiking/mountain club. The stack is a full-stack TypeScript monorepo: a React 19 SPA (Vite) and an Express.js API server sharing the same repo.

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

# After schema changes
npm run prisma:generate

# Seed the database
npx prisma db seed
```

There is no test suite.

## Architecture

### Frontend (`src/`)

- **React 19** with React Router v7 (`createBrowserRouter`). All routes are defined in `src/App.tsx`.
- **Tailwind CSS v4** (no config file — uses `@tailwindcss/vite` plugin). Use the `cn()` helper from `src/lib/utils.ts` for conditional classes.
- **Global state** lives in `src/contexts/AppContext.tsx` (`AppProvider`). It exposes: `user`, `role` (`'guest' | 'user' | 'admin'`), `loading`, auth helpers (`loginWithGoogle`, `logout`, `refreshUser`), toast via Sonner, and a confirmation modal system (`confirmAction`).
- **Route protection** is handled by `src/components/ProtectedRoute.tsx`. The Admin panel (`/admin`) checks `role` from context but both `user` and `admin` roles can access it — actual admin operations are enforced server-side.
- Polish URL routes: `/aktualnosci`, `/o-nas`, `/wydarzenia/:id`, `/kalendarz`, `/galeria/:id`, `/wiki/:id`, `/profil`, `/admin`, `/admin/galeria`.

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
| `/api/events` | `server/routes/events.ts` | Events CRUD, participation |
| `/api/albums` | `server/routes/albums.ts` | Photo albums |
| `/api/images` | `server/routes/upload.ts` | Image upload (multer + sharp) |
| `/api/gpx` | `server/routes/gpx.ts` | GPX file upload & analysis |
| `/api/wiki` | `server/routes/wiki.ts` | Wiki articles |
| `/api/news` | `server/routes/news.ts` | News items |
| `/api/stats` | `server/routes/stats.ts` | Aggregate group stats (in-memory cached) |
| `/api/users` | `server/routes/users.ts` | User profile management |
| `/api/search` | `server/routes/search.ts` | Global search |
| `/api/push` | `server/routes/push.ts` | Web Push subscriptions |

### Authentication

- Google OAuth2 flow: `/api/auth/google` → Google consent → `/api/auth/google/callback` → JWT cookie.
- JWT stored in `httpOnly` cookie named `token` (7-day TTL).
- Auth middleware in `server/middleware/auth.ts`: `authenticate` (verifies JWT, attaches `req.userId`/`req.userRole`) and `requireAdmin` (checks `ADMIN` role). Many routes also use `getUserIdFromCookie()` for optional auth (public access shows masked data).
- DB role enum: `USER | ADMIN`. Frontend role string: `'guest' | 'user' | 'admin'`.
- Emergency first-admin grant: `POST /api/auth/make-admin` (only works if no admin exists yet).

### File Storage

- Uploaded files (images and GPX) are stored in the `uploads/` directory at the project root, served as static files at `/uploads/*`.
- Images are processed with **sharp**: originals are resized to max 1920px, thumbnails generated at 400px.
- GPX files parsed with `gpxparser` / `@tmcw/togeojson`; parsing logic in `server/lib/gpxUtils.ts`.
- Stats cache (`server/routes/stats.ts`) is invalidated by calling `invalidateStatsCache()` after GPX approval or event finalisation.

### Key Data Models

- `Event` — has `isDraft`, `isFinalized`, `featured`, `highlighted`, `isExpedition` flags. Sensitive fields (`mapLink`, `mapEmbed`, `gearRequired`, etc.) are stripped for unauthenticated requests.
- `GpxSubmission` — status lifecycle: `PENDING → APPROVED | REJECTED`. `participantIds` is a `String[]` of user IDs for group tracks. `isOfficial` marks the canonical track for an event.
- `EventParticipation` — `status` values used in queries: `'GOING'`.
- `WikiArticle` and `NewsItem` tables are created via raw SQL in `runMigrations()` (not yet in a formal Prisma migration).

## Environment Variables

Required in `.env`:

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLIENT_URL=http://localhost:5173   # frontend origin for CORS + OAuth redirect
PORT=3001                          # optional
```

The Google OAuth callback is hardcoded to `http://localhost:3001/api/auth/google/callback` in `server/routes/auth.ts` — update this for production deployments.
