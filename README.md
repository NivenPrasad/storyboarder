# YouTube Storyboard Creator

A web-based storyboard creator designed specifically for YouTube content creators to plan, organize, and visualize their video shoots before production.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

### Core Features
- **Scene Management** - Add, reorder (drag-and-drop), duplicate, and delete scenes
- **Shot Planning** - Define shot type, camera angle, duration, scene type, location, props, and talent for each scene
- **Visual References** - Upload reference images for each scene
- **Script & Dialogue** - Write voiceover scripts with character count, reading time estimates, and teleprompter mode
- **Production Notes** - Add director notes, checklists, priority levels, and status tracking
- **Timeline Visualization** - See your video structure at a glance with color-coded scene types

### Collaboration
- Share storyboards via link (public or private)
- Add collaborators with view or edit permissions
- Comment on storyboards and individual scenes

### Templates
Built-in templates to get you started quickly:
- **Tutorial** - For how-to and educational content
- **Vlog** - For personal vlogs and day-in-the-life content
- **Review** - For product reviews and unboxings
- **Interview** - For sit-down interviews
- **Documentary** - For narrative-driven documentary-style content

### Export Options
- **PDF** - Formatted document with all scenes
- **CSV** - Spreadsheet-compatible shot list
- **JSON** - Full data export for backup
- **Markdown** - Import-ready for Notion
- **HTML** - Import-ready for Google Docs
- **Print View** - Printer-friendly layout

### Additional Features
- Dark mode support
- Auto-save
- Responsive design

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| State Management | Zustand |
| Drag & Drop | dnd-kit |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Authentication | JWT + bcrypt |
| File Uploads | Multer |
| PDF Generation | PDFKit |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NivenPrasad/projects.git
   cd projects
   ```

2. **Switch to the feature branch**
   ```bash
   git checkout claude/youtube-storyboard-creator-szKo1
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Open in your browser**
   ```
   http://localhost:5173
   ```

## Project Structure (For Non-Developers)

This section explains what each folder and file does in plain English. Think of the codebase like a building with different rooms, each with a specific purpose.

### The Big Picture

```
youtube-storyboard-creator/
│
├── 📁 frontend/          ← THE WEBSITE (what users see and click)
├── 📁 backend/           ← THE SERVER (stores data, handles logic)
├── 📁 shared/            ← SHARED DEFINITIONS (keeps frontend & backend in sync)
└── 📄 package.json       ← PROJECT SETTINGS (like a table of contents)
```

### Detailed Breakdown

#### 🖥️ FRONTEND (The Website Users See)

```
frontend/
├── 📄 index.html              ← The single HTML page (React fills this in)
├── 📄 vite.config.ts          ← Build tool settings (how to compile the code)
├── 📄 tailwind.config.js      ← Styling settings (colors, fonts, spacing)
│
└── 📁 src/                    ← ALL THE ACTUAL CODE LIVES HERE
    │
    ├── 📄 main.tsx            ← THE STARTING POINT - loads the app
    ├── 📄 App.tsx             ← THE MAIN CONTAINER - sets up pages & routing
    ├── 📄 index.css           ← Global styles (dark mode, colors, etc.)
    │
    ├── 📁 pages/              ← FULL SCREENS (one file = one page)
    │   ├── LoginPage.tsx          → Login/signup screen
    │   ├── Dashboard.tsx          → Home screen with storyboard list
    │   ├── StoryboardEditor.tsx   → Main editing screen (drag-drop scenes)
    │   └── PublicView.tsx         → Read-only view for shared links
    │
    ├── 📁 components/         ← REUSABLE UI PIECES (buttons, cards, panels)
    │   ├── SceneCard.tsx          → One scene card (thumbnail, title, drag handle)
    │   ├── SceneEditor.tsx        → Side panel to edit a scene's details
    │   ├── Timeline.tsx           → Visual timeline bar at bottom
    │   ├── StatsPanel.tsx         → Statistics sidebar (duration, scene count)
    │   ├── ExportModal.tsx        → Popup for downloading/exporting
    │   ├── ShareModal.tsx         → Popup for sharing with others
    │   ├── TemplateSelector.tsx   → Grid of template options
    │   └── Header.tsx             → Top navigation bar
    │
    ├── 📁 store/              ← APP MEMORY (where data lives while app runs)
    │   └── useStore.ts            → Central "brain" - tracks scenes, user, etc.
    │
    ├── 📁 api/                ← TALKS TO THE SERVER
    │   └── client.ts              → Functions to fetch/save data from backend
    │
    └── 📁 utils/              ← HELPER FUNCTIONS
        └── helpers.ts             → Formatting (durations, colors, truncating text)
```

**How to think about it:**
- `pages/` = The different "screens" of the app (like different rooms)
- `components/` = Reusable "furniture" that appears on multiple screens
- `store/` = The app's "memory" (what scenes exist, who's logged in)
- `api/` = The "phone line" to talk to the server

---

#### 🔧 BACKEND (The Server That Stores Everything)

```
backend/
├── 📁 src/                    ← ALL SERVER CODE
│   │
│   ├── 📄 index.ts            ← THE STARTING POINT - launches the server
│   │
│   ├── 📁 db/                 ← DATABASE SETUP
│   │   └── database.ts            → Creates tables, connects to SQLite
│   │
│   ├── 📁 middleware/         ← SECURITY CHECKPOINTS
│   │   └── auth.ts                → Verifies users are logged in
│   │
│   └── 📁 routes/             ← API ENDPOINTS (different "services")
│       ├── auth.ts                → Login, signup, logout
│       ├── storyboards.ts         → Create, read, update, delete storyboards
│       ├── scenes.ts              → Create, read, update, delete scenes
│       ├── templates.ts           → Get pre-made templates
│       ├── comments.ts            → Add/view comments
│       ├── exports.ts             → Generate PDF, CSV, JSON files
│       └── uploads.ts             → Handle image uploads
│
├── 📁 data/                   ← WHERE THE DATABASE FILE LIVES
│   └── storyboards.db             → The actual SQLite database file
│
└── 📁 uploads/                ← WHERE UPLOADED IMAGES ARE STORED
    └── (user uploaded files)
```

**How to think about it:**
- `routes/` = Different "services" the server offers (like departments in a company)
- `middleware/` = Security guards that check if you're allowed in
- `db/` = The filing cabinet where everything is permanently stored

---

#### 📋 SHARED (Keeps Everyone on the Same Page)

```
shared/
└── 📁 src/
    └── 📄 types.ts            ← DEFINITIONS OF ALL DATA STRUCTURES
                                  (What a "Scene" looks like, what a "User" contains)
                                  Both frontend and backend use these same definitions
```

**Why does this exist?**
When the frontend sends a "Scene" to the backend, both need to agree on what fields a Scene has (title, duration, shot type, etc.). This file is the "contract" they both follow.

---

### How Data Flows (The Journey of a Scene)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   USER                                                                  │
│     │                                                                   │
│     │ 1. Clicks "Add Scene"                                            │
│     ▼                                                                   │
│   FRONTEND (React)                                                      │
│     │                                                                   │
│     │ 2. Sends request to backend                                      │
│     ▼                                                                   │
│   BACKEND (Express)                                                     │
│     │                                                                   │
│     │ 3. Validates & saves to database                                 │
│     ▼                                                                   │
│   DATABASE (SQLite)                                                     │
│     │                                                                   │
│     │ 4. Confirms save                                                 │
│     ▼                                                                   │
│   BACKEND                                                               │
│     │                                                                   │
│     │ 5. Returns new scene data                                        │
│     ▼                                                                   │
│   FRONTEND                                                              │
│     │                                                                   │
│     │ 6. Updates screen with new scene                                 │
│     ▼                                                                   │
│   USER sees new scene card appear!                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### File Naming Conventions

| Pattern | Meaning | Example |
|---------|---------|---------|
| `*.tsx` | React component (UI code) | `SceneCard.tsx` |
| `*.ts` | Plain TypeScript (logic, no UI) | `helpers.ts` |
| `use*.ts` | React hook (reusable logic) | `useStore.ts` |
| `*.css` | Styles | `index.css` |
| `index.ts` | Main entry point of a folder | `backend/src/index.ts` |

---

### Key Concepts for Non-Developers

| Term | Plain English |
|------|---------------|
| **Component** | A reusable piece of UI (like a LEGO brick) |
| **State** | Data the app is currently holding in memory |
| **Route** | A URL path (`/dashboard`, `/login`) |
| **API Endpoint** | A URL the frontend calls to get/save data |
| **Props** | Data passed from a parent component to a child |
| **Hook** | A reusable chunk of logic (starts with `use`) |
| **TypeScript** | JavaScript with type checking (catches errors early) |
| **JWT Token** | A secure "ticket" proving you're logged in |

## Usage

### Creating a Storyboard

1. Sign up or log in
2. Click "New Storyboard" on the dashboard
3. Enter a title and optionally select a template
4. Start adding scenes!

### Editing Scenes

Click on any scene card to open the editor with three tabs:
- **Shot Details** - Camera settings, location, props, talent
- **Script & Dialogue** - Voiceover text with teleprompter mode
- **Production Notes** - Director notes, checklists, status

### Reordering Scenes

Simply drag and drop scene cards to reorder them. The timeline will update automatically.

### Sharing

1. Click the Share icon in the storyboard editor
2. Toggle "Public" to allow anyone with the link to view
3. Or invite specific collaborators by email

### Exporting

1. Click the Download icon in the storyboard editor
2. Choose your preferred format
3. The file will download automatically

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login |
| GET | `/api/storyboards` | List user's storyboards |
| POST | `/api/storyboards` | Create storyboard |
| GET | `/api/storyboards/:id` | Get storyboard details |
| PATCH | `/api/storyboards/:id` | Update storyboard |
| DELETE | `/api/storyboards/:id` | Delete storyboard |
| POST | `/api/scenes` | Create scene |
| PATCH | `/api/scenes/:id` | Update scene |
| DELETE | `/api/scenes/:id` | Delete scene |
| POST | `/api/scenes/reorder` | Reorder scenes |
| GET | `/api/templates` | List templates |
| GET | `/api/export/:id/pdf` | Export as PDF |
| GET | `/api/export/:id/csv` | Export as CSV |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only the frontend |
| `npm run dev:backend` | Start only the backend |
| `npm run build` | Build for production |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

Built for YouTube creators by Extra Masala Studios.

---

**Happy Storyboarding!** 🎬
