// Enums for dropdown fields
export enum ShotType {
  WIDE_SHOT = 'Wide Shot',
  MEDIUM_SHOT = 'Medium Shot',
  CLOSE_UP = 'Close-Up',
  EXTREME_CLOSE_UP = 'Extreme Close-Up',
  OVER_THE_SHOULDER = 'Over-the-Shoulder',
  POV = 'POV',
  TWO_SHOT = 'Two Shot',
  ESTABLISHING_SHOT = 'Establishing Shot',
  INSERT_SHOT = 'Insert Shot',
  CUTAWAY = 'Cutaway'
}

export enum CameraAngle {
  EYE_LEVEL = 'Eye Level',
  HIGH_ANGLE = 'High Angle',
  LOW_ANGLE = 'Low Angle',
  BIRDS_EYE = "Bird's Eye",
  DUTCH_ANGLE = 'Dutch Angle',
  OVER_THE_SHOULDER = 'Over-the-Shoulder'
}

export enum SceneType {
  A_ROLL = 'A-Roll/Main Content',
  B_ROLL = 'B-Roll',
  INTERVIEW = 'Interview',
  TRANSITION = 'Transition',
  TITLE_CARD = 'Title Card'
}

export enum CameraMovement {
  STATIC = 'Static',
  PAN = 'Pan',
  TILT = 'Tilt',
  ZOOM = 'Zoom',
  DOLLY = 'Dolly',
  TRACKING = 'Tracking'
}

export enum TimeOfDay {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  EVENING = 'Evening',
  NIGHT = 'Night',
  GOLDEN_HOUR = 'Golden Hour'
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum SceneStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  SKIPPED = 'Skipped'
}

export enum TemplateType {
  TUTORIAL = 'Tutorial',
  VLOG = 'Vlog',
  REVIEW = 'Review',
  INTERVIEW = 'Interview',
  DOCUMENTARY = 'Documentary',
  CUSTOM = 'Custom'
}

// Main data interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VisualReference {
  id: string;
  sceneId: string;
  url: string;
  caption?: string;
  order: number;
  createdAt: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Scene {
  id: string;
  storyboardId: string;
  order: number;

  // Required fields
  title: string;
  description: string;
  shotType: ShotType;
  cameraAngle: CameraAngle;
  duration: number; // in seconds
  sceneType: SceneType;
  location: string;
  props: string[];
  talent: string[];

  // Optional fields
  lightingNotes?: string;
  audioNotes?: string;
  cameraMovement?: CameraMovement;
  equipment?: string[];
  timeOfDay?: TimeOfDay;

  // Script & Dialogue
  dialogue?: string;
  onScreenText?: string;

  // Production Notes
  directorNotes?: string;
  checklist: ChecklistItem[];
  priority: Priority;
  status: SceneStatus;
  assignedTo?: string;
  tags: string[];

  // Visual References
  visualReferences: VisualReference[];

  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  storyboardId: string;
  sceneId?: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryboardVersion {
  id: string;
  storyboardId: string;
  version: number;
  data: string; // JSON snapshot of storyboard at this version
  createdAt: Date;
  createdBy: string;
}

export interface Storyboard {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDuration?: number; // in seconds
  templateType?: TemplateType;

  scenes: Scene[];
  comments: Comment[];

  // Sharing
  isPublic: boolean;
  shareLink?: string;
  collaborators: string[]; // user IDs with edit access
  viewers: string[]; // user IDs with view-only access

  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  scenes: Partial<Scene>[];
  isSystem: boolean; // true for built-in templates
  userId?: string; // for custom templates
  createdAt: Date;
}

// API Request/Response types
export interface CreateStoryboardRequest {
  title: string;
  description?: string;
  targetDuration?: number;
  templateId?: string;
}

export interface UpdateStoryboardRequest {
  title?: string;
  description?: string;
  targetDuration?: number;
  isPublic?: boolean;
}

export interface CreateSceneRequest {
  storyboardId: string;
  title: string;
  description: string;
  shotType: ShotType;
  cameraAngle: CameraAngle;
  duration: number;
  sceneType: SceneType;
  location: string;
  props?: string[];
  talent?: string[];
  order?: number;
}

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

export interface ReorderScenesRequest {
  storyboardId: string;
  sceneIds: string[];
}

export interface CreateCommentRequest {
  storyboardId: string;
  sceneId?: string;
  content: string;
}

export interface ShareStoryboardRequest {
  email: string;
  permission: 'view' | 'edit';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Utility types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string>;
}

// Timeline statistics
export interface StoryboardStats {
  totalDuration: number;
  sceneCount: number;
  sceneTypeBreakdown: Record<SceneType, { count: number; duration: number }>;
  completedScenes: number;
  targetProgress: number; // percentage towards target duration
}
