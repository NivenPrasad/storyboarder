import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/storyboard.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Storyboards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS storyboards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_duration INTEGER,
      template_type TEXT,
      is_public INTEGER DEFAULT 0,
      share_link TEXT UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Scenes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      storyboard_id TEXT NOT NULL,
      scene_order INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      shot_type TEXT NOT NULL,
      camera_angle TEXT NOT NULL,
      duration INTEGER NOT NULL,
      scene_type TEXT NOT NULL,
      location TEXT NOT NULL,
      props TEXT DEFAULT '[]',
      talent TEXT DEFAULT '[]',
      lighting_notes TEXT,
      audio_notes TEXT,
      camera_movement TEXT,
      equipment TEXT DEFAULT '[]',
      time_of_day TEXT,
      dialogue TEXT,
      on_screen_text TEXT,
      director_notes TEXT,
      checklist TEXT DEFAULT '[]',
      priority TEXT DEFAULT 'Medium',
      status TEXT DEFAULT 'Not Started',
      assigned_to TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE
    )
  `);

  // Visual references table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visual_references (
      id TEXT PRIMARY KEY,
      scene_id TEXT NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      ref_order INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    )
  `);

  // Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      storyboard_id TEXT NOT NULL,
      scene_id TEXT,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Storyboard collaborators table
  db.exec(`
    CREATE TABLE IF NOT EXISTS storyboard_collaborators (
      id TEXT PRIMARY KEY,
      storyboard_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      permission TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(storyboard_id, user_id)
    )
  `);

  // Storyboard versions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS storyboard_versions (
      id TEXT PRIMARY KEY,
      storyboard_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT NOT NULL,
      FOREIGN KEY (storyboard_id) REFERENCES storyboards(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Templates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      scenes TEXT NOT NULL,
      is_system INTEGER DEFAULT 0,
      user_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_storyboards_user_id ON storyboards(user_id);
    CREATE INDEX IF NOT EXISTS idx_scenes_storyboard_id ON scenes(storyboard_id);
    CREATE INDEX IF NOT EXISTS idx_visual_refs_scene_id ON visual_references(scene_id);
    CREATE INDEX IF NOT EXISTS idx_comments_storyboard_id ON comments(storyboard_id);
    CREATE INDEX IF NOT EXISTS idx_collaborators_storyboard ON storyboard_collaborators(storyboard_id);
    CREATE INDEX IF NOT EXISTS idx_collaborators_user ON storyboard_collaborators(user_id);
  `);

  // Insert default system templates
  insertDefaultTemplates();

  console.log('Database initialized successfully');
}

function insertDefaultTemplates() {
  const existingTemplates = db.prepare('SELECT COUNT(*) as count FROM templates WHERE is_system = 1').get() as { count: number };
  if (existingTemplates.count > 0) return;

  const templates = [
    {
      id: 'template-tutorial',
      name: 'Tutorial Video',
      description: 'A structured template for how-to and educational content',
      type: 'Tutorial',
      scenes: JSON.stringify([
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

  const insertTemplate = db.prepare(`
    INSERT OR IGNORE INTO templates (id, name, description, type, scenes, is_system)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const template of templates) {
    insertTemplate.run(template.id, template.name, template.description, template.type, template.scenes, template.is_system);
  }
}

export default db;
