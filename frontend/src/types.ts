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
  createdAt: string;
  updatedAt: string;
}

export interface VisualReference {
  id: string;
  sceneId: string;
  url: string;
  caption?: string;
  order: number;
  createdAt: string;
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
  title: string;
  description: string;
  shotType: ShotType;
  cameraAngle: CameraAngle;
  duration: number;
  sceneType: SceneType;
  location: string;
  props: string[];
  talent: string[];
  lightingNotes?: string;
  audioNotes?: string;
  cameraMovement?: CameraMovement;
  equipment?: string[];
  timeOfDay?: TimeOfDay;
  dialogue?: string;
  onScreenText?: string;
  directorNotes?: string;
  checklist: ChecklistItem[];
  priority: Priority;
  status: SceneStatus;
  assignedTo?: string;
  tags: string[];
  visualReferences: VisualReference[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  storyboardId: string;
  sceneId?: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Storyboard {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetDuration?: number;
  templateType?: TemplateType;
  scenes: Scene[];
  comments: Comment[];
  isPublic: boolean;
  shareLink?: string;
  collaborators: string[];
  viewers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  scenes: Partial<Scene>[];
  isSystem: boolean;
  userId?: string;
  createdAt: string;
}

export interface StoryboardStats {
  totalDuration: number;
  sceneCount: number;
  sceneTypeBreakdown: Record<string, { count: number; duration: number }>;
  completedScenes: number;
  targetProgress: number;
}

// API types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string>;
}
