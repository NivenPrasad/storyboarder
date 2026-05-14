/**
 * =============================================================================
 * DATABASE.TS - SQLite Database Setup & Initialization
 * =============================================================================
 *
 * This file sets up our SQLite database - where all the app's data is stored.
 *
 * WHAT IS A DATABASE?
 * A database is like a super-organized filing cabinet. Instead of paper files,
 * it stores data in tables (like spreadsheets). Each table stores one type
 * of thing (users, storyboards, scenes, etc.).
 *
 * WHY SQLite?
 * SQLite is a simple database that stores everything in a single file.
 * Perfect for small-to-medium apps. No separate server needed!
 *
 * TABLES IN THIS DATABASE:
 * - users: Account information (email, password hash, name)
 * - storyboards: Video plans created by users
 * - scenes: Individual shots within a storyboard
 * - visual_references: Images attached to scenes
 * - comments: Feedback on storyboards/scenes
 * - storyboard_collaborators: Who has access to what
 * - storyboard_versions: Version history (snapshots)
 * - templates: Pre-made storyboard structures
 */

// better-sqlite3 is a fast SQLite library for Node.js
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';


// =========================================================================
// DATABASE FILE LOCATION
// =========================================================================

// Where to store the database file
// Can be overridden with DATABASE_PATH environment variable
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/storyboard.db');

// Make sure the data directory exists
// If not, create it (and any parent directories needed)
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}


// =========================================================================
// CREATE DATABASE CONNECTION
// =========================================================================

// Create a new database connection (or open existing one)
const db = new Database(dbPath);

// Enable foreign keys
// Foreign keys enforce relationships between tables
// e.g., if you delete a storyboard, its scenes should also be deleted
db.pragma('foreign_keys = ON');


// =========================================================================
// INITIALIZE DATABASE TABLES
// =========================================================================
/**
 * This function creates all the tables if they don't already exist.
 * Called when the server starts up.
 *
 * SQL EXPLAINED:
 * - CREATE TABLE IF NOT EXISTS: Create table only if it doesn't exist
 * - PRIMARY KEY: Unique identifier for each row
 * - NOT NULL: This field is required
 * - UNIQUE: No two rows can have the same value
 * - DEFAULT: Value to use if not provided
 * - FOREIGN KEY: Links to another table (e.g., user_id links to users.id)
 * - ON DELETE CASCADE: If the parent is deleted, delete children too
 */
export function initializeDatabase() {

  // -------------------------------------------------------------------------
  // USERS TABLE
  // -------------------------------------------------------------------------
  // Stores account information for registered users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,           -- Unique user ID (UUID)
      email TEXT UNIQUE NOT NULL,    -- Login email (must be unique)
      password TEXT NOT NULL,        -- Hashed password (NEVER plain text!)
      name TEXT NOT NULL,            -- Display name
      avatar_url TEXT,               -- Profile picture URL (optional)
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,  -- When they signed up
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP   -- Last profile update
    )
  `);

  // -------------------------------------------------------------------------
  // STORYBOARDS TABLE
  // -------------------------------------------------------------------------
  // Main container for video plans
  db.exec(`
    CREATE TABLE IF NOT EXISTS storyboards (
      id TEXT PRIMARY KEY,           -- Unique storyboard ID (UUID)
      user_id TEXT NOT NULL,         -- Who owns this storyboard
      title TEXT NOT NULL,           -- Video title
      description TEXT,              -- Video description (optional)
      target_duration INTEGER,       -- Goal length in seconds (optional)
      template_type TEXT,            -- Which template was used (optional)
      is_public INTEGER DEFAULT 0,   -- Is it publicly shared? (0=no, 1=yes)
      share_link TEXT UNIQUE,        -- Unique sharing code (if public)
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      -- Link to users table: when user is deleted, their storyboards are too
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // -------------------------------------------------------------------------
  // SCENES TABLE
  // -------------------------------------------------------------------------
  // Individual shots/clips within a storyboard
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,           -- Unique scene ID (UUID)
      storyboard_id TEXT NOT NULL,   -- Which storyboard this belongs to
      scene_order INTEGER NOT NULL,  -- Position in sequence (1, 2, 3...)
      title TEXT NOT NULL,           -- Scene name
      description TEXT NOT NULL,     -- What happens in this scene
      shot_type TEXT NOT NULL,       -- Wide Shot, Close-Up, etc.
      camera_angle TEXT NOT NULL,    -- Eye Level, High Angle, etc.
      duration INTEGER NOT NULL,     -- Length in seconds
      scene_type TEXT NOT NULL,      -- A-Roll, B-Roll, Interview, etc.
      location TEXT NOT NULL,        -- Where to film
      props TEXT DEFAULT '[]',       -- JSON array of props needed
      talent TEXT DEFAULT '[]',      -- JSON array of people in scene
      lighting_notes TEXT,           -- Lighting instructions (optional)
      audio_notes TEXT,              -- Audio requirements (optional)
      camera_movement TEXT,          -- Pan, Zoom, Static, etc. (optional)
      equipment TEXT DEFAULT '[]',   -- JSON array of gear needed
      time_of_day TEXT,              -- Morning, Golden Hour, etc. (optional)
      dialogue TEXT,                 -- Script/what people say (optional)
      on_screen_text TEXT,           -- Text overlays to add (optional)
      director_notes TEXT,           -- Instructions for crew (optional)
      checklist TEXT DEFAULT '[]',   -- JSON array of todo items
      priority TEXT DEFAULT 'Medium', -- Low, Medium, High, Critical
      status TEXT DEFAULT 'Not Started', -- Not Started, In Progress, Completed
      assigned_to TEXT,              -- Who's responsible (optional)
      tags TEXT DEFAULT '[]',        -- JSON array of labels
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      -- When storyboard is deleted, its scenes are deleted too
      FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE
    )
  `);

  // -------------------------------------------------------------------------
  // VISUAL REFERENCES TABLE
  // -------------------------------------------------------------------------
  // Images attached to scenes for reference/inspiration
  db.exec(`
    CREATE TABLE IF NOT EXISTS visual_references (
      id TEXT PRIMARY KEY,           -- Unique reference ID
      scene_id TEXT NOT NULL,        -- Which scene this belongs to
      url TEXT NOT NULL,             -- Image URL
      caption TEXT,                  -- Description of the image (optional)
      ref_order INTEGER NOT NULL,    -- Display order (1, 2, 3...)
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      -- When scene is deleted, its references are deleted too
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    )
  `);

  // -------------------------------------------------------------------------
  // COMMENTS TABLE
  // -------------------------------------------------------------------------
  // Feedback and notes on storyboards/scenes
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,           -- Unique comment ID
      storyboard_id TEXT NOT NULL,   -- Which storyboard
      scene_id TEXT,                 -- Specific scene (optional)
      user_id TEXT NOT NULL,         -- Who wrote it
      user_name TEXT NOT NULL,       -- Author's display name (cached)
      content TEXT NOT NULL,         -- The comment text
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      -- Cascading deletes for all foreign keys
      FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // -------------------------------------------------------------------------
  // STORYBOARD COLLABORATORS TABLE
  // -------------------------------------------------------------------------
  // Tracks who has access to which storyboards (sharing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS storyboard_collaborators (
      id TEXT PRIMARY KEY,           -- Unique record ID
      storyboard_id TEXT NOT NULL,   -- Which storyboard
      user_id TEXT NOT NULL,         -- Who has access
      permission TEXT NOT NULL,      -- 'view' or 'edit'
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      -- Each user can only have one permission level per storyboard
      UNIQUE(storyboard_id, user_id)
    )
  `);

  // -------------------------------------------------------------------------
  // STORYBOARD VERSIONS TABLE
  // -------------------------------------------------------------------------
  // Stores snapshots for version history
  db.exec(`
    CREATE TABLE IF NOT EXISTS storyboard_versions (
      id TEXT PRIMARY KEY,           -- Unique version ID
      storyboard_id TEXT NOT NULL,   -- Which storyboard
      version INTEGER NOT NULL,      -- Version number (1, 2, 3...)
      data TEXT NOT NULL,            -- JSON snapshot of entire storyboard
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL,      -- Who saved this version
      FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // -------------------------------------------------------------------------
  // TEMPLATES TABLE
  // -------------------------------------------------------------------------
  // Pre-made storyboard structures users can start from
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,           -- Unique template ID
      name TEXT NOT NULL,            -- Template name
      description TEXT NOT NULL,     -- What it's for
      type TEXT NOT NULL,            -- Tutorial, Vlog, Review, etc.
      scenes TEXT NOT NULL,          -- JSON array of pre-made scenes
      is_system INTEGER DEFAULT 0,   -- 1=built-in, 0=user-created
      user_id TEXT,                  -- Creator (null for system templates)
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);


  // =========================================================================
  // CREATE INDEXES FOR FASTER QUERIES
  // =========================================================================
  // Indexes are like the index in the back of a book - they help find
  // things faster. Create indexes for columns you frequently search by.
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_storyboards_user_id ON storyboards(user_id);
    CREATE INDEX IF NOT EXISTS idx_scenes_storyboard_id ON scenes(storyboard_id);
    CREATE INDEX IF NOT EXISTS idx_visual_refs_scene_id ON visual_references(scene_id);
    CREATE INDEX IF NOT EXISTS idx_comments_storyboard_id ON comments(storyboard_id);
    CREATE INDEX IF NOT EXISTS idx_collaborators_storyboard ON storyboard_collaborators(storyboard_id);
    CREATE INDEX IF NOT EXISTS idx_collaborators_user ON storyboard_collaborators(user_id);
  `);


  // =========================================================================
  // INSERT DEFAULT TEMPLATES
  // =========================================================================
  // Add built-in templates if they don't exist yet
  insertDefaultTemplates();

  console.log('Database initialized successfully');
}


// =========================================================================
// DEFAULT TEMPLATES
// =========================================================================
/**
 * Inserts the built-in storyboard templates.
 * Only runs if there are no system templates yet.
 *
 * Each template includes pre-made scenes that give users a starting point.
 */
function insertDefaultTemplates() {
  // Check if templates already exist
  const existingTemplates = db.prepare('SELECT COUNT(*) as count FROM templates WHERE is_system = 1').get() as { count: number };
  if (existingTemplates.count > 0) return; // Already have templates

  // Define the built-in templates
  const templates = [
    {
      id: 'template-tutorial',
      name: 'Tutorial Video',
      description: 'A structured template for how-to and educational content',
      type: 'Tutorial',
      scenes: JSON.stringify([
        // Each object represents a pre-made scene
        { title: 'Hook/Introduction', description: 'Grab attention and preview what viewers will learn', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 15, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Problem Statement', description: 'Explain the problem this tutorial solves', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Step 1', description: 'First step of the tutorial', shotType: 'Close-Up', cameraAngle: 'Eye Level', duration: 60, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Step 1 B-Roll', description: 'Supporting footage for step 1', shotType: 'Insert Shot', cameraAngle: 'High Angle', duration: 10, sceneType: 'B-Roll', location: '', props: [], talent: [] },
        { title: 'Step 2', description: 'Second step of the tutorial', shotType: 'Close-Up', cameraAngle: 'Eye Level', duration: 60, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Step 3', description: 'Third step of the tutorial', shotType: 'Close-Up', cameraAngle: 'Eye Level', duration: 60, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Summary & CTA', description: 'Recap key points and call to action', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] }
      ]),
      is_system: 1
    },
    {
      id: 'template-vlog',
      name: 'Vlog',
      description: 'A dynamic template for personal vlogs and day-in-the-life content',
      type: 'Vlog',
      scenes: JSON.stringify([
        { title: 'Intro/Hook', description: 'Exciting moment or preview of the vlog', shotType: 'Wide Shot', cameraAngle: 'Eye Level', duration: 10, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Morning Routine', description: 'Start of day establishing shots', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 45, sceneType: 'A-Roll/Main Content', location: 'Home', props: [], talent: [] },
        { title: 'Morning B-Roll', description: 'Coffee, breakfast, getting ready', shotType: 'Insert Shot', cameraAngle: 'High Angle', duration: 15, sceneType: 'B-Roll', location: 'Home', props: [], talent: [] },
        { title: 'Main Activity 1', description: 'First main activity of the day', shotType: 'Wide Shot', cameraAngle: 'Eye Level', duration: 120, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Activity 1 B-Roll', description: 'Supporting footage', shotType: 'Cutaway', cameraAngle: 'Eye Level', duration: 20, sceneType: 'B-Roll', location: '', props: [], talent: [] },
        { title: 'Transition', description: 'Moving to next location', shotType: 'Wide Shot', cameraAngle: 'Eye Level', duration: 10, sceneType: 'Transition', location: '', props: [], talent: [] },
        { title: 'Main Activity 2', description: 'Second main activity', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 120, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Outro/Reflection', description: 'Wrap up thoughts and call to action', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] }
      ]),
      is_system: 1
    },
    {
      id: 'template-review',
      name: 'Product Review',
      description: 'A comprehensive template for product reviews and unboxings',
      type: 'Review',
      scenes: JSON.stringify([
        { title: 'Hook', description: 'Quick verdict or exciting feature preview', shotType: 'Close-Up', cameraAngle: 'Eye Level', duration: 10, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Intro', description: 'Introduce the product and context', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Unboxing', description: 'Open and reveal product contents', shotType: 'Close-Up', cameraAngle: 'High Angle', duration: 60, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Product Glamour Shots', description: 'Beautiful B-roll of the product', shotType: 'Close-Up', cameraAngle: 'Eye Level', duration: 20, sceneType: 'B-Roll', location: '', props: [], talent: [] },
        { title: 'Features Overview', description: 'Explain key features and specs', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 90, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Feature Demos', description: 'Show features in action', shotType: 'Close-Up', cameraAngle: 'Eye Level', duration: 60, sceneType: 'B-Roll', location: '', props: [], talent: [] },
        { title: 'Pros', description: 'Discuss positive aspects', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 45, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Cons', description: 'Discuss negative aspects', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 45, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Final Verdict', description: 'Summary and recommendation', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] }
      ]),
      is_system: 1
    },
    {
      id: 'template-interview',
      name: 'Interview',
      description: 'A professional template for sit-down interviews',
      type: 'Interview',
      scenes: JSON.stringify([
        { title: 'Intro/Context', description: 'Set the scene and introduce the guest', shotType: 'Wide Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Guest Introduction', description: 'Guest introduces themselves', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 45, sceneType: 'Interview', location: '', props: [], talent: [] },
        { title: 'Question 1', description: 'Opening question', shotType: 'Over-the-Shoulder', cameraAngle: 'Eye Level', duration: 120, sceneType: 'Interview', location: '', props: [], talent: [] },
        { title: 'Cutaway/B-Roll', description: 'Supporting footage or nodding shots', shotType: 'Cutaway', cameraAngle: 'Eye Level', duration: 10, sceneType: 'B-Roll', location: '', props: [], talent: [] },
        { title: 'Question 2', description: 'Follow-up question', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 120, sceneType: 'Interview', location: '', props: [], talent: [] },
        { title: 'Question 3', description: 'Deep dive question', shotType: 'Close-Up', cameraAngle: 'Eye Level', duration: 120, sceneType: 'Interview', location: '', props: [], talent: [] },
        { title: 'Lightning Round', description: 'Quick fire questions', shotType: 'Two Shot', cameraAngle: 'Eye Level', duration: 60, sceneType: 'Interview', location: '', props: [], talent: [] },
        { title: 'Closing/Thanks', description: 'Thank guest and wrap up', shotType: 'Two Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] }
      ]),
      is_system: 1
    },
    {
      id: 'template-documentary',
      name: 'Documentary',
      description: 'A narrative-driven template for documentary-style content',
      type: 'Documentary',
      scenes: JSON.stringify([
        { title: 'Cold Open', description: 'Dramatic opening moment', shotType: 'Wide Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Title Card', description: 'Documentary title and intro text', shotType: 'Wide Shot', cameraAngle: 'Eye Level', duration: 5, sceneType: 'Title Card', location: '', props: [], talent: [] },
        { title: 'Context/Background', description: 'Set up the story and background', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 60, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Historical B-Roll', description: 'Archive footage or photos', shotType: 'Insert Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'B-Roll', location: '', props: [], talent: [] },
        { title: 'Expert Interview 1', description: 'First expert perspective', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 90, sceneType: 'Interview', location: '', props: [], talent: [] },
        { title: 'Location Establishing', description: 'Key location shots', shotType: 'Establishing Shot', cameraAngle: "Bird's Eye", duration: 15, sceneType: 'B-Roll', location: '', props: [], talent: [] },
        { title: 'Main Narrative 1', description: 'First act of the story', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 120, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Supporting B-Roll', description: 'Footage supporting the narrative', shotType: 'Cutaway', cameraAngle: 'Eye Level', duration: 30, sceneType: 'B-Roll', location: '', props: [], talent: [] },
        { title: 'Expert Interview 2', description: 'Second expert perspective', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 90, sceneType: 'Interview', location: '', props: [], talent: [] },
        { title: 'Main Narrative 2', description: 'Second act - conflict/challenge', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 120, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Resolution', description: 'Story conclusion', shotType: 'Wide Shot', cameraAngle: 'Eye Level', duration: 60, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] },
        { title: 'Closing Thoughts', description: 'Final reflections and takeaways', shotType: 'Medium Shot', cameraAngle: 'Eye Level', duration: 30, sceneType: 'A-Roll/Main Content', location: '', props: [], talent: [] }
      ]),
      is_system: 1
    }
  ];

  // Prepare the insert statement (more efficient than running separate queries)
  const insertTemplate = db.prepare(`
    INSERT OR IGNORE INTO templates (id, name, description, type, scenes, is_system)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Insert each template
  for (const template of templates) {
    insertTemplate.run(template.id, template.name, template.description, template.type, template.scenes, template.is_system);
  }
}


// Export the database connection for use in other files
export default db;
