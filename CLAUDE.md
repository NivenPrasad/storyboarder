# CLAUDE.md — YouTube Storyboard Creator

This file provides guidance for AI assistants working with this codebase.

## Project Overview

YouTube Storyboard Creator is a full-stack web app for YouTube content creators to plan, organize, and visualize video shoots before production. It supports scene management, shot planning, script writing, team collaboration, and multi-format export.

**Built by:** Extra Masala Studios

---

## Repository Structure

```
projects/
├── frontend/          # React + TypeScript + Vite SPA
├── backend/           # Express + TypeScript REST API
├── shared/            # Shared TypeScript types (consumed by both)
├── package.json       # Root workspace config (npm workspaces)
└── README.md
```

This is an **npm monorepo** with three workspaces. All `npm install` / `npm run` commands should be run from the **root directory**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS (class-based dark mode, custom scene-type colors) |
| State | Zustand (`frontend/src/store/useStore.ts`) |
| Drag & Drop | dnd-kit |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT + bcryptjs |
| File Uploads | Multer (5 MB limit, stored in `backend/uploads/`) |
| PDF Export | PDFKit |

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm (bundled with Node.js)

### Install & Run

```bash
# From the repo root — installs all workspaces
npm install

# Start both servers concurrently
npm run dev
```

| Server | URL |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3001 |

Vite proxies `/api` and `/uploads` requests to the backend, so the frontend always uses relative paths (`/api/...`).

### Individual Workspace Commands

```bash
npm run dev:frontend    # Vite dev server only
npm run dev:backend     # ts-node-dev backend only
npm run build           # shared → backend → frontend (in order)
npm run start           # Run compiled backend (production)
```

---

## Key Conventions

### TypeScript

- Strict mode enabled in all three packages (`"strict": true` in tsconfig).
- `noUnusedLocals` and `noUnusedParameters` are enforced on the frontend.
- All domain enums and interfaces live in **`shared/src/types.ts`** and are imported by both frontend and backend. Do not duplicate type definitions.
- Frontend uses `"moduleResolution": "bundler"` (Vite); backend uses CommonJS output (`"module": "CommonJS"`, `outDir: dist`).

### No Linting / No Tests

There is currently **no ESLint, Prettier, or test framework** configured. TypeScript type-checking is the primary safety net. When adding these tools, configure them at the workspace level and update this file.

### Shared Types — Critical Rule

Always import types from `shared/src/types.ts` (or the re-exported path in `frontend/src/types.ts`). The `frontend/src/types.ts` file re-exports everything from `shared`:

```ts
// frontend/src/types.ts re-exports from shared
export * from '../../shared/src/types';
```

Never define domain types locally in `frontend` or `backend` — put them in `shared`.

### API Client

The singleton `api` object in `frontend/src/api/client.ts` wraps all HTTP calls. It:
- Automatically attaches the JWT `Bearer` token from `localStorage`.
- Throws the parsed JSON error body on non-2xx responses.
- Returns `undefined` for 204 No Content responses.

Always use `api.*` methods from the store or components — do not call `fetch` directly.

### State Management (Zustand)

All application state lives in `frontend/src/store/useStore.ts`. The store is the single source of truth; components read from and dispatch to the store.

State slices:
- `user`, `isAuthenticated`, `isLoading` — auth state
- `storyboards`, `currentStoryboard`, `storyboardStats` — storyboard data
- `templates` — template library
- `darkMode`, `selectedScenes`, `editingScene` — UI state

When adding new features, add state and async action methods to the store rather than keeping local component state for anything that needs to be shared.

### Backend Route Organization

Each resource has its own route file in `backend/src/routes/`:

| File | Prefix |
|---|---|
| `auth.ts` | `/api/auth` |
| `storyboards.ts` | `/api/storyboards` |
| `scenes.ts` | `/api/scenes` |
| `templates.ts` | `/api/templates` |
| `comments.ts` | `/api/comments` |
| `exports.ts` | `/api/export` |
| `uploads.ts` | `/api/uploads` |

Authentication is enforced via JWT middleware in `backend/src/middleware/auth.ts`. Apply it to any route that requires a logged-in user.

### Database

SQLite is initialized on server start via `backend/src/db/database.ts`. The DB file is created automatically in the `backend/` directory. Use `better-sqlite3` synchronous API — no async/await needed for queries.

### File Uploads

Uploaded images are stored under `backend/uploads/` and served as static files at `/uploads/<filename>`. The Multer configuration enforces a 5 MB file size limit. The Multer-specific error handler in `backend/src/index.ts` converts upload errors to structured JSON responses.

### Tailwind / Styling

- Dark mode is class-based (`darkMode: 'class'` in `tailwind.config.js`). Toggle by adding/removing `dark` class on `<html>`.
- Custom scene-type color utilities are defined in the Tailwind config for: `a-roll`, `b-roll`, `interview`, `transition`, `title-card`.
- Use Tailwind utility classes exclusively — do not write custom CSS unless unavoidable.

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| PATCH | `/api/auth/me` | Yes | Update profile |

### Storyboards

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/storyboards` | List user's storyboards |
| POST | `/api/storyboards` | Create storyboard |
| GET | `/api/storyboards/:id` | Get storyboard with scenes |
| PATCH | `/api/storyboards/:id` | Update storyboard metadata |
| DELETE | `/api/storyboards/:id` | Delete storyboard |
| POST | `/api/storyboards/:id/duplicate` | Duplicate storyboard |
| POST | `/api/storyboards/:id/share` | Add collaborator |
| DELETE | `/api/storyboards/:id/share/:userId` | Remove collaborator |
| GET | `/api/storyboards/:id/stats` | Get timeline statistics |
| GET | `/api/storyboards/shared/:shareLink` | Public shared view (no auth) |

### Scenes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/scenes` | Create scene |
| GET | `/api/scenes/:id` | Get scene |
| PATCH | `/api/scenes/:id` | Update scene |
| DELETE | `/api/scenes/:id` | Delete scene |
| POST | `/api/scenes/:id/duplicate` | Duplicate scene |
| POST | `/api/scenes/reorder` | Reorder scenes (array of IDs) |
| POST | `/api/scenes/bulk-delete` | Bulk delete scenes |
| POST | `/api/scenes/:id/visual-references` | Add visual reference |
| DELETE | `/api/scenes/:id/visual-references/:refId` | Delete visual reference |

### Export

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/export/:id/pdf` | Download PDF |
| GET | `/api/export/:id/csv` | Download CSV shot list |
| GET | `/api/export/:id/json` | Download JSON backup |
| GET | `/api/export/:id/notion` | Markdown for Notion |
| GET | `/api/export/:id/gdocs` | HTML for Google Docs |
| GET | `/api/export/:id/print` | Print-friendly HTML |

### Health Check

```
GET /api/health → { status: "ok", timestamp: "..." }
```

---

## Domain Model Summary

All types are defined in `shared/src/types.ts`.

### Core Enums

- `ShotType` — Wide Shot, Medium Shot, Close-Up, ECU, OTS, POV, Two Shot, Establishing, Insert, Cutaway
- `CameraAngle` — Eye Level, High Angle, Low Angle, Bird's Eye, Dutch Angle, OTS
- `SceneType` — A-Roll, B-Roll, Interview, Transition, Title Card
- `CameraMovement` — Static, Pan, Tilt, Zoom, Dolly, Tracking
- `TimeOfDay` — Morning, Afternoon, Evening, Night, Golden Hour
- `Priority` — Low, Medium, High, Critical
- `SceneStatus` — Not Started, In Progress, Completed, Skipped
- `TemplateType` — Tutorial, Vlog, Review, Interview, Documentary, Custom

### Primary Entities

- **`Storyboard`** — top-level container; holds `Scene[]`, `Comment[]`, collaborator IDs, sharing settings
- **`Scene`** — a single planned shot; includes shot metadata, script/dialogue, production notes, `VisualReference[]`, `ChecklistItem[]`
- **`Template`** — reusable scene set; system templates have `isSystem: true`
- **`User`** — authenticated user; identified by `id` string (UUID)

---

## Adding New Features — Checklist

1. **Types first** — define new interfaces/enums in `shared/src/types.ts`.
2. **Backend route** — add handler in the appropriate `backend/src/routes/*.ts` file; protect with auth middleware if needed.
3. **API client method** — add the corresponding method to `frontend/src/api/client.ts`.
4. **Store action** — add state fields and async action to `frontend/src/store/useStore.ts`.
5. **UI components** — build in `frontend/src/components/` (reusable) or `frontend/src/pages/` (route-level).
6. **No tests yet** — verify manually; consider adding Vitest when the test suite is introduced.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend server port |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin |

No `.env` file is committed. Set these in your shell or a local `.env` file (add to `.gitignore` if created).

---

## Git Workflow

- Default development branch: `main`
- Feature branches follow the pattern `claude/<feature-name>-<id>` for AI-assisted work.
- Commit messages use conventional prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.
