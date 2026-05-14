/**
 * =============================================================================
 * YOUTUBE STORYBOARD CREATOR - SHARED TYPE DEFINITIONS
 * =============================================================================
 *
 * This file contains all the TypeScript types (interfaces and enums) that are
 * shared between the frontend and backend. Think of these as "blueprints" that
 * describe what shape our data should have.
 *
 * WHY SHARE TYPES?
 * When the frontend sends data to the backend (or vice versa), both sides need
 * to agree on what that data looks like. By defining types in one place, we
 * ensure consistency and catch errors at compile time.
 */

// =============================================================================
// ENUMS (Dropdown Options)
// =============================================================================
// Enums are like predefined lists of options. They're used for dropdown menus
// in the UI and ensure only valid values can be selected.

/**
 * SHOT TYPE - How much of the subject is visible in the frame
 *
 * Example: A "Close-Up" shows just a face, while a "Wide Shot" shows
 * the entire room or landscape.
 */
export enum ShotType {
  WIDE_SHOT = 'Wide Shot',               // Shows entire scene/location
  MEDIUM_SHOT = 'Medium Shot',           // Shows subject from waist up
  CLOSE_UP = 'Close-Up',                 // Shows face or small object
  EXTREME_CLOSE_UP = 'Extreme Close-Up', // Shows tiny details (eyes, hands)
  OVER_THE_SHOULDER = 'Over-the-Shoulder', // Camera behind one person looking at another
  POV = 'POV',                           // Point-of-view shot (what character sees)
  TWO_SHOT = 'Two Shot',                 // Two people in frame together
  ESTABLISHING_SHOT = 'Establishing Shot', // Shows where the scene takes place
  INSERT_SHOT = 'Insert Shot',           // Close-up of specific object/detail
  CUTAWAY = 'Cutaway'                    // Brief shot away from main action
}

/**
 * CAMERA ANGLE - The vertical position of the camera relative to the subject
 *
 * Different angles create different emotional effects. A Low Angle makes
 * someone look powerful, while a High Angle makes them look small.
 */
export enum CameraAngle {
  EYE_LEVEL = 'Eye Level',           // Neutral, most common angle
  HIGH_ANGLE = 'High Angle',         // Camera looks down (subject looks smaller/weaker)
  LOW_ANGLE = 'Low Angle',           // Camera looks up (subject looks powerful)
  BIRDS_EYE = "Bird's Eye",          // Directly overhead (like a map view)
  DUTCH_ANGLE = 'Dutch Angle',       // Camera tilted (creates unease/tension)
  OVER_THE_SHOULDER = 'Over-the-Shoulder' // Behind someone's shoulder
}

/**
 * SCENE TYPE - The category/purpose of this footage
 *
 * YouTube videos typically mix different types of footage:
 * - A-Roll: The main content (you talking to camera)
 * - B-Roll: Supporting footage (showing what you're talking about)
 */
export enum SceneType {
  A_ROLL = 'A-Roll/Main Content',    // Primary footage (host speaking, main action)
  B_ROLL = 'B-Roll',                 // Supplementary footage (cutaways, atmosphere)
  INTERVIEW = 'Interview',           // Someone being interviewed
  TRANSITION = 'Transition',         // Brief clips between sections
  TITLE_CARD = 'Title Card'          // Text/graphics on screen
}

/**
 * CAMERA MOVEMENT - How the camera moves during the shot
 */
export enum CameraMovement {
  STATIC = 'Static',         // Camera doesn't move (on tripod)
  PAN = 'Pan',               // Camera rotates left/right (like turning your head)
  TILT = 'Tilt',             // Camera rotates up/down (like nodding)
  ZOOM = 'Zoom',             // Lens zooms in/out (frame changes, camera doesn't move)
  DOLLY = 'Dolly',           // Camera physically moves forward/backward
  TRACKING = 'Tracking'      // Camera follows a moving subject
}

/**
 * TIME OF DAY - When the scene should be filmed
 *
 * Lighting changes dramatically throughout the day, which affects
 * the mood and look of your footage.
 */
export enum TimeOfDay {
  MORNING = 'Morning',               // Soft, warm morning light
  AFTERNOON = 'Afternoon',           // Bright, harsh midday light
  EVENING = 'Evening',               // Warm, orange light
  NIGHT = 'Night',                   // Artificial lighting needed
  GOLDEN_HOUR = 'Golden Hour'        // Hour before sunset - best natural light!
}

/**
 * PRIORITY - How important is this scene?
 *
 * Helps you decide what to film first if you're short on time.
 */
export enum Priority {
  LOW = 'Low',               // Nice to have, but can skip if needed
  MEDIUM = 'Medium',         // Should include if possible
  HIGH = 'High',             // Very important to the video
  CRITICAL = 'Critical'      // Video won't work without this
}

/**
 * SCENE STATUS - Production tracking
 *
 * Track which scenes have been filmed and edited.
 */
export enum SceneStatus {
  NOT_STARTED = 'Not Started',   // Haven't filmed yet
  IN_PROGRESS = 'In Progress',   // Currently filming or editing
  COMPLETED = 'Completed',       // Done!
  SKIPPED = 'Skipped'            // Decided not to include
}

/**
 * TEMPLATE TYPE - Pre-made storyboard structures
 *
 * Different video styles have different structures. Templates give
 * you a starting point based on the type of video you're making.
 */
export enum TemplateType {
  TUTORIAL = 'Tutorial',         // How-to videos (intro -> steps -> conclusion)
  VLOG = 'Vlog',                 // Day-in-the-life content
  REVIEW = 'Review',             // Product/service reviews
  INTERVIEW = 'Interview',       // Sit-down interviews
  DOCUMENTARY = 'Documentary',   // Narrative-driven content
  CUSTOM = 'Custom'              // Your own structure
}


// =============================================================================
// DATA INTERFACES (Main Data Structures)
// =============================================================================
// Interfaces describe the "shape" of objects. They're like contracts that
// define what properties an object must have.

/**
 * USER - A registered user of the app
 *
 * Contains basic account information. Passwords are stored separately
 * in the database (never sent to the frontend for security).
 */
export interface User {
  id: string;              // Unique identifier (generated automatically)
  email: string;           // Login email address
  name: string;            // Display name
  avatarUrl?: string;      // Profile picture URL (optional)
  createdAt: Date;         // When they signed up
  updatedAt: Date;         // Last profile update
}

/**
 * VISUAL REFERENCE - An image attached to a scene
 *
 * Reference images help communicate your vision to your team.
 * Could be screenshots, mood boards, or example shots.
 */
export interface VisualReference {
  id: string;              // Unique identifier
  sceneId: string;         // Which scene this belongs to
  url: string;             // Image URL (could be uploaded or external)
  caption?: string;        // Description of what this image represents
  order: number;           // Display order (1st, 2nd, 3rd, etc.)
  createdAt: Date;         // When it was added
}

/**
 * CHECKLIST ITEM - A todo item within a scene
 *
 * Break down complex scenes into smaller tasks.
 * Example: "Get b-roll of coffee machine", "Record voiceover"
 */
export interface ChecklistItem {
  id: string;              // Unique identifier
  text: string;            // The task description
  completed: boolean;      // Is it done?
}

/**
 * SCENE - A single shot/clip in your video
 *
 * This is the heart of the app! Each scene represents one piece of footage
 * you'll film. It contains all the information your crew needs to set up
 * and capture the shot.
 */
export interface Scene {
  id: string;              // Unique identifier
  storyboardId: string;    // Which storyboard this belongs to
  order: number;           // Position in the sequence (1, 2, 3...)

  // REQUIRED FIELDS - Every scene needs these
  title: string;           // Short name (e.g., "Opening Hook")
  description: string;     // What happens in this scene
  shotType: ShotType;      // How much is in frame (Wide, Close-up, etc.)
  cameraAngle: CameraAngle; // Camera position (Eye level, Low angle, etc.)
  duration: number;        // Expected length in SECONDS
  sceneType: SceneType;    // Type of footage (A-Roll, B-Roll, etc.)
  location: string;        // Where to film this
  props: string[];         // Items needed (e.g., ["laptop", "coffee cup"])
  talent: string[];        // People appearing (e.g., ["John", "Sarah"])

  // OPTIONAL FIELDS - Extra details when needed
  lightingNotes?: string;      // Lighting setup instructions
  audioNotes?: string;         // Sound requirements (mic type, music, etc.)
  cameraMovement?: CameraMovement; // How camera moves (Pan, Zoom, etc.)
  equipment?: string[];        // Gear needed (tripod, gimbal, drone)
  timeOfDay?: TimeOfDay;       // When to film

  // SCRIPT & DIALOGUE
  dialogue?: string;           // What people say (script)
  onScreenText?: string;       // Text overlays/graphics to add in editing

  // PRODUCTION NOTES
  directorNotes?: string;      // Instructions for the crew
  checklist: ChecklistItem[];  // Tasks to complete for this scene
  priority: Priority;          // How important (Low to Critical)
  status: SceneStatus;         // Progress (Not Started to Completed)
  assignedTo?: string;         // Who's responsible for this scene
  tags: string[];              // Labels for organizing (e.g., ["intro", "outdoors"])

  // VISUAL REFERENCES
  visualReferences: VisualReference[]; // Reference images attached to this scene

  createdAt: Date;             // When scene was created
  updatedAt: Date;             // Last modification
}

/**
 * COMMENT - A note left on a storyboard or scene
 *
 * For team collaboration - leave feedback, ask questions, or make notes.
 */
export interface Comment {
  id: string;              // Unique identifier
  storyboardId: string;    // Which storyboard this is on
  sceneId?: string;        // Specific scene (optional - can be general comment)
  userId: string;          // Who wrote it
  userName: string;        // Author's display name
  content: string;         // The comment text
  createdAt: Date;         // When it was posted
  updatedAt: Date;         // Last edit time
}

/**
 * STORYBOARD VERSION - A snapshot of a storyboard at a point in time
 *
 * Like "version history" in Google Docs. Lets you go back to earlier versions.
 */
export interface StoryboardVersion {
  id: string;              // Unique identifier
  storyboardId: string;    // Which storyboard
  version: number;         // Version number (1, 2, 3...)
  data: string;            // JSON snapshot of the entire storyboard
  createdAt: Date;         // When this version was saved
  createdBy: string;       // Who saved this version
}

/**
 * STORYBOARD - A complete video plan
 *
 * The main container that holds all your scenes. Represents the entire
 * plan for a single YouTube video.
 */
export interface Storyboard {
  id: string;              // Unique identifier
  userId: string;          // Who owns this storyboard
  title: string;           // Video title (e.g., "How to Make Coffee")
  description?: string;    // Video description/summary
  targetDuration?: number; // Goal length in SECONDS (e.g., 600 = 10 minutes)
  templateType?: TemplateType; // Which template was used to create this

  scenes: Scene[];         // All the scenes in this video
  comments: Comment[];     // Feedback and notes

  // SHARING SETTINGS
  isPublic: boolean;       // Can anyone with the link view it?
  shareLink?: string;      // Unique link for sharing (if public)
  collaborators: string[]; // User IDs who can EDIT this storyboard
  viewers: string[];       // User IDs who can only VIEW

  createdAt: Date;         // When storyboard was created
  updatedAt: Date;         // Last modification
}

/**
 * TEMPLATE - A reusable storyboard structure
 *
 * Templates provide starting points for new videos. They include
 * pre-made scenes that you can customize for your specific video.
 */
export interface Template {
  id: string;              // Unique identifier
  name: string;            // Template name (e.g., "Product Review")
  description: string;     // What this template is for
  type: TemplateType;      // Category (Tutorial, Vlog, etc.)
  scenes: Partial<Scene>[]; // Pre-made scenes (Partial means not all fields required)
  isSystem: boolean;       // true = built-in template, false = user-created
  userId?: string;         // Creator's ID (only for user-created templates)
  createdAt: Date;         // When template was created
}


// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================
// These types define the structure of data sent to/from the server.
// "Request" types = data the frontend sends to the backend
// "Response" types = data the backend sends back

/**
 * Request to create a new storyboard
 */
export interface CreateStoryboardRequest {
  title: string;               // Required: Video title
  description?: string;        // Optional: Video description
  targetDuration?: number;     // Optional: Target length in seconds
  templateId?: string;         // Optional: Start from a template
}

/**
 * Request to update an existing storyboard
 */
export interface UpdateStoryboardRequest {
  title?: string;              // New title (if changing)
  description?: string;        // New description (if changing)
  targetDuration?: number;     // New target duration (if changing)
  isPublic?: boolean;          // Toggle public sharing
}

/**
 * Request to create a new scene
 */
export interface CreateSceneRequest {
  storyboardId: string;        // Which storyboard to add this to
  title: string;               // Scene name
  description: string;         // What happens
  shotType: ShotType;          // Shot framing
  cameraAngle: CameraAngle;    // Camera position
  duration: number;            // Length in seconds
  sceneType: SceneType;        // A-Roll, B-Roll, etc.
  location: string;            // Filming location
  props?: string[];            // Items needed
  talent?: string[];           // People in scene
  order?: number;              // Position (auto-assigned if not provided)
}

/**
 * Request to update a scene (all fields optional - only send what's changing)
 */
export interface UpdateSceneRequest {
  title?: string;
  description?: string;
  shotType?: ShotType;
  cameraAngle?: CameraAngle;
  duration?: number;
  sceneType?: SceneType;
  location?: string;
  props?: string[];
  talent?: string[];
  lightingNotes?: string;
  audioNotes?: string;
  cameraMovement?: CameraMovement;
  equipment?: string[];
  timeOfDay?: TimeOfDay;
  dialogue?: string;
  onScreenText?: string;
  directorNotes?: string;
  checklist?: ChecklistItem[];
  priority?: Priority;
  status?: SceneStatus;
  assignedTo?: string;
  tags?: string[];
  order?: number;
}

/**
 * Request to reorder scenes (drag and drop)
 */
export interface ReorderScenesRequest {
  storyboardId: string;        // Which storyboard
  sceneIds: string[];          // New order of scene IDs
}

/**
 * Request to create a comment
 */
export interface CreateCommentRequest {
  storyboardId: string;        // Which storyboard
  sceneId?: string;            // Which scene (optional for general comments)
  content: string;             // The comment text
}

/**
 * Request to share a storyboard with someone
 */
export interface ShareStoryboardRequest {
  email: string;               // Email of person to share with
  permission: 'view' | 'edit'; // What can they do?
}

/**
 * Response after successful login/registration
 */
export interface AuthResponse {
  user: User;                  // User's profile info
  token: string;               // JWT token for authentication
}

/**
 * Login request
 */
export interface LoginRequest {
  email: string;               // User's email
  password: string;            // User's password
}

/**
 * Registration request
 */
export interface RegisterRequest {
  email: string;               // Email to register
  password: string;            // Chosen password
  name: string;                // Display name
}


// =============================================================================
// UTILITY TYPES
// =============================================================================
// Helper types used throughout the application

/**
 * Paginated response wrapper
 *
 * When fetching large lists (like all storyboards), we "paginate" the results
 * to avoid loading everything at once. This wrapper includes pagination info.
 */
export interface PaginatedResponse<T> {
  data: T[];                   // The actual items for this page
  total: number;               // Total number of items across all pages
  page: number;                // Current page number (1, 2, 3...)
  pageSize: number;            // Items per page
  totalPages: number;          // Total number of pages
}

/**
 * Standard API error response
 */
export interface ApiError {
  message: string;             // Human-readable error message
  code: string;                // Error code (e.g., "NOT_FOUND", "UNAUTHORIZED")
  details?: Record<string, string>; // Additional error info (optional)
}

/**
 * Statistics about a storyboard
 *
 * Calculated values shown in the stats panel - helps you understand
 * your video's structure at a glance.
 */
export interface StoryboardStats {
  totalDuration: number;       // Total video length in seconds
  sceneCount: number;          // Number of scenes
  sceneTypeBreakdown: Record<SceneType, { count: number; duration: number }>;
  // ^ How much of each scene type (e.g., "60 seconds of B-Roll")
  completedScenes: number;     // How many scenes are marked complete
  targetProgress: number;      // Percentage towards target duration (0-100)
}
