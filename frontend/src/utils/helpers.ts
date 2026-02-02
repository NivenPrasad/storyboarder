import { SceneType } from '../types';

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${secs}s`;
}

export function formatFullDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

export function getSceneTypeColor(sceneType: SceneType | string): string {
  switch (sceneType) {
    case SceneType.A_ROLL:
    case 'A-Roll/Main Content':
      return 'bg-scene-a-roll';
    case SceneType.B_ROLL:
    case 'B-Roll':
      return 'bg-scene-b-roll';
    case SceneType.INTERVIEW:
    case 'Interview':
      return 'bg-scene-interview';
    case SceneType.TRANSITION:
    case 'Transition':
      return 'bg-scene-transition';
    case SceneType.TITLE_CARD:
    case 'Title Card':
      return 'bg-scene-title-card';
    default:
      return 'bg-gray-400';
  }
}

export function getSceneTypeBorderColor(sceneType: SceneType | string): string {
  switch (sceneType) {
    case SceneType.A_ROLL:
    case 'A-Roll/Main Content':
      return 'border-scene-a-roll';
    case SceneType.B_ROLL:
    case 'B-Roll':
      return 'border-scene-b-roll';
    case SceneType.INTERVIEW:
    case 'Interview':
      return 'border-scene-interview';
    case SceneType.TRANSITION:
    case 'Transition':
      return 'border-scene-transition';
    case SceneType.TITLE_CARD:
    case 'Title Card':
      return 'border-scene-title-card';
    default:
      return 'border-gray-400';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'Low':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    case 'Medium':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'High':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    case 'Critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Not Started':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'Skipped':
      return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function calculateReadingTime(text: string, wordsPerMinute = 150): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60);
}

export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
