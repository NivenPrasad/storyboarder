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

## Project Structure

```
projects/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand state management
│   │   ├── api/             # API client
│   │   ├── utils/           # Helper functions
│   │   └── types.ts         # TypeScript types
│   ├── index.html
│   └── vite.config.ts
│
├── backend/                 # Express backend application
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Auth middleware
│   │   ├── db/              # Database setup
│   │   └── index.ts         # Server entry point
│   └── uploads/             # Uploaded images
│
├── shared/                  # Shared TypeScript types
│   └── src/
│       └── types.ts
│
└── package.json             # Root package.json (workspaces)
```

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
