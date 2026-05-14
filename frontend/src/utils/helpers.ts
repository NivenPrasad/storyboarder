/**
 * =============================================================================
 * HELPERS.TS - UTILITY FUNCTIONS
 * =============================================================================
 *
 * This file contains helper functions used throughout the application.
 * These are small, reusable functions that do specific tasks like:
 * - Formatting durations (60 seconds -> "1m")
 * - Getting colors for different scene types
 * - Truncating long text
 * - Generating IDs
 *
 * WHY SEPARATE THESE?
 * By putting common functions in one place:
 * 1. We avoid duplicating code
 * 2. Changes only need to be made in one place
 * 3. Functions can be tested independently
 */

import { SceneType } from '../types';


// =============================================================================
// DURATION FORMATTING
// =============================================================================

/**
 * Format duration in seconds to a short string
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string like "30s", "2m", or "2m 30s"
 *
 * Examples:
 *   formatDuration(30)  -> "30s"
 *   formatDuration(60)  -> "1m"
 *   formatDuration(90)  -> "1m 30s"
 *   formatDuration(120) -> "2m"
 */
export function formatDuration(seconds: number): string {
  // If less than a minute, just show seconds
  if (seconds < 60) {
    return `${seconds}s`;
  }

  // Calculate minutes and remaining seconds
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  // If exactly on the minute, don't show ":00"
  if (secs === 0) {
    return `${mins}m`;
  }

  // Show both minutes and seconds
  return `${mins}m ${secs}s`;
}


/**
 * Format duration with hours for longer videos
 *
 * @param seconds - Duration in seconds
 * @returns Formatted string like "1h 30m 15s"
 *
 * Examples:
 *   formatFullDuration(3665) -> "1h 1m 5s"
 *   formatFullDuration(7200) -> "2h"
 *   formatFullDuration(0)    -> "0s"
 */
export function formatFullDuration(seconds: number): string {
  // Calculate hours, minutes, seconds
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Build the string, only including non-zero parts
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}


// =============================================================================
// SCENE TYPE COLORS
// =============================================================================
// Different scene types get different colors to make them easy to identify

/**
 * Get the background color class for a scene type (used in timeline)
 *
 * @param sceneType - The scene type (A-Roll, B-Roll, etc.)
 * @returns Tailwind CSS class for background color
 */
export function getSceneTypeColor(sceneType: SceneType | string): string {
  switch (sceneType) {
    case SceneType.A_ROLL:
    case 'A-Roll/Main Content':
      return 'bg-scene-a-roll';      // Purple - main content
    case SceneType.B_ROLL:
    case 'B-Roll':
      return 'bg-scene-b-roll';      // Teal - supporting footage
    case SceneType.INTERVIEW:
    case 'Interview':
      return 'bg-scene-interview';   // Blue - interview segments
    case SceneType.TRANSITION:
    case 'Transition':
      return 'bg-scene-transition';  // Orange - transitions
    case SceneType.TITLE_CARD:
    case 'Title Card':
      return 'bg-scene-title-card';  // Pink - title cards
    default:
      return 'bg-gray-400';          // Gray - fallback
  }
}


/**
 * Get the border color class for a scene type (used on scene cards)
 *
 * @param sceneType - The scene type
 * @returns Tailwind CSS class for border color
 */
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


// =============================================================================
// PRIORITY COLORS
// =============================================================================
// Priority levels get different colors to indicate urgency

/**
 * Get the color classes for a priority badge
 *
 * @param priority - Priority level (Low, Medium, High, Critical)
 * @returns Tailwind CSS classes for background and text color
 */
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


// =============================================================================
// STATUS COLORS
// =============================================================================
// Scene statuses get different colors to show progress

/**
 * Get the color classes for a status badge
 *
 * @param status - Status (Not Started, In Progress, Completed, Skipped)
 * @returns Tailwind CSS classes for background and text color
 */
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


// =============================================================================
// TEXT UTILITIES
// =============================================================================

/**
 * Calculate how long it takes to read a piece of text (for dialogue)
 *
 * @param text - The text to measure
 * @param wordsPerMinute - Reading speed (default 150 for speaking)
 * @returns Duration in seconds
 *
 * Example:
 *   calculateReadingTime("Hello world how are you", 150) -> 2 seconds
 */
export function calculateReadingTime(text: string, wordsPerMinute = 150): number {
  if (!text) return 0;
  // Count words by splitting on whitespace
  const words = text.trim().split(/\s+/).length;
  // Calculate seconds (round up)
  return Math.ceil((words / wordsPerMinute) * 60);
}


/**
 * Truncate text to a maximum length with ellipsis
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length (including "...")
 * @returns Truncated text
 *
 * Examples:
 *   truncate("Hello World", 5)      -> "He..."
 *   truncate("Hi", 5)               -> "Hi"
 *   truncate("Hello World", 100)    -> "Hello World"
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}


// =============================================================================
// CSS UTILITIES
// =============================================================================

/**
 * Combine class names, filtering out falsy values
 *
 * This is useful for conditionally applying classes.
 *
 * @param classes - Array of class names (can include false/undefined)
 * @returns Combined class string
 *
 * Example:
 *   classNames('btn', isActive && 'btn-active', 'text-lg')
 *   // If isActive is false: "btn text-lg"
 *   // If isActive is true: "btn btn-active text-lg"
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}


// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate a random ID string
 *
 * Creates a short random string for temporary IDs.
 * Note: For real IDs, the backend uses UUIDs.
 *
 * @returns Random string like "k3j8f2n9m1p"
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}


// =============================================================================
// DEBOUNCE
// =============================================================================

/**
 * Create a debounced version of a function
 *
 * Debouncing prevents a function from being called too frequently.
 * It waits until the user stops triggering the function for a
 * specified time before actually calling it.
 *
 * COMMON USE CASE: Search input
 * Without debounce: Every keystroke triggers a search
 * With debounce: Search only happens after user stops typing for 300ms
 *
 * @param func - The function to debounce
 * @param wait - How long to wait (in milliseconds)
 * @returns Debounced function
 *
 * Example:
 *   const debouncedSearch = debounce((term) => searchAPI(term), 300);
 *   input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    // Clear any existing timeout
    clearTimeout(timeout);
    // Set a new timeout
    timeout = setTimeout(() => func(...args), wait);
  };
}
