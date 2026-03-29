/**
 * =============================================================================
 * SCENE CARD COMPONENT
 * =============================================================================
 *
 * This component displays a single scene as a card in the storyboard editor.
 * Each card shows a preview of the scene and can be:
 * - Dragged to reorder
 * - Clicked to edit
 * - Selected for bulk actions
 * - Duplicated or deleted via menu
 *
 * STRUCTURE:
 * - Drag handle (grip icon on the left)
 * - Selection checkbox
 * - Scene number
 * - Title
 * - Options menu (duplicate/delete)
 * - Visual reference image (or placeholder)
 * - Description preview
 * - Meta info (duration, location)
 * - Tags (shot type, status, priority)
 */

// Drag and drop hook from @dnd-kit
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Global state store
import { useStore } from '../store/useStore';

// Icons
import {
  GripVertical,     // Drag handle icon
  MoreVertical,     // Three dots menu icon
  Copy,             // Duplicate icon
  Trash2,           // Delete icon
  Clock,            // Duration icon
  MapPin,           // Location icon
  Camera,           // Placeholder for missing image
  Check,            // Checkmark for selection
} from 'lucide-react';

// React hooks
import { useState } from 'react';

// Utility functions for formatting and colors
import {
  formatDuration,           // Convert seconds to "5m 30s"
  getSceneTypeBorderColor,  // Get left border color based on scene type
  getStatusColor,           // Get background color for status badge
  getPriorityColor,         // Get background color for priority badge
  truncate,                 // Shorten long text with "..."
} from '../utils/helpers';

// Type definition for Scene
import type { Scene } from '../types';


/**
 * Props interface - defines what data this component receives
 */
interface SceneCardProps {
  scene: Scene;          // The scene data to display
  onEdit: () => void;    // Function to call when user wants to edit
}


/**
 * SCENE CARD COMPONENT
 *
 * A draggable card representing a single scene in the storyboard.
 */
export default function SceneCard({ scene, onEdit }: SceneCardProps) {

  // =========================================================================
  // HOOKS
  // =========================================================================

  // Get functions from the global store
  const { deleteScene, duplicateScene, selectedScenes, toggleSceneSelection } = useStore();

  // Local state for the options menu
  const [menuOpen, setMenuOpen] = useState(false);

  // =========================================================================
  // DRAG AND DROP SETUP
  // =========================================================================
  // useSortable provides everything needed for drag and drop functionality

  const {
    attributes,      // Accessibility attributes for the drag handle
    listeners,       // Event listeners for drag interactions
    setNodeRef,      // Ref to attach to the draggable element
    transform,       // Current position transform (during drag)
    transition,      // Smooth animation transition
    isDragging,      // Is this card currently being dragged?
  } = useSortable({ id: scene.id });

  // Apply transform and transition as inline styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if this scene is currently selected (for bulk actions)
  const isSelected = selectedScenes.includes(scene.id);


  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Delete this scene (with confirmation)
   */
  const handleDelete = async () => {
    if (confirm('Delete this scene?')) {
      await deleteScene(scene.id);
    }
    setMenuOpen(false);
  };

  /**
   * Create a copy of this scene
   */
  const handleDuplicate = async () => {
    await duplicateScene(scene.id);
    setMenuOpen(false);
  };


  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div
      ref={setNodeRef}           // Attach the drag/drop ref
      style={style}              // Apply drag transform
      className={`scene-card border-l-4 ${getSceneTypeBorderColor(scene.sceneType)} ${
        isDragging ? 'opacity-50 shadow-lg' : ''   // Fade when dragging
      } ${isSelected ? 'ring-2 ring-primary-500' : ''}`}  // Highlight when selected
    >

      {/* ================================================================= */}
      {/* HEADER - Drag handle, checkbox, title, menu */}
      {/* ================================================================= */}
      <div className="flex items-center gap-2 mb-3">

        {/* Drag Handle - Click and drag to reorder */}
        <button
          {...attributes}    // Accessibility attributes
          {...listeners}     // Drag event listeners
          className="p-1 rounded cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700 touch-none"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>

        {/* Selection Checkbox - For bulk actions */}
        <button
          onClick={() => toggleSceneSelection(scene.id)}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
          }`}
        >
          {isSelected && <Check className="w-3 h-3" />}
        </button>

        {/* Scene Number */}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          #{scene.order}
        </span>

        {/* Scene Title - Click to edit */}
        <h3 className="font-medium flex-1 truncate" onClick={onEdit}>
          {scene.title}
        </h3>

        {/* Options Menu (duplicate, delete) */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <>
              {/* Invisible overlay to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              {/* Menu content */}
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                <button
                  onClick={handleDuplicate}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>


      {/* ================================================================= */}
      {/* VISUAL REFERENCE - Image preview or placeholder */}
      {/* ================================================================= */}
      {scene.visualReferences.length > 0 ? (
        // Show the first attached image
        <div
          className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden cursor-pointer"
          onClick={onEdit}
        >
          <img
            src={scene.visualReferences[0].url}
            alt={scene.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        // Show camera icon placeholder when no image
        <div
          className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center cursor-pointer"
          onClick={onEdit}
        >
          <Camera className="w-8 h-8 text-gray-400" />
        </div>
      )}


      {/* ================================================================= */}
      {/* DESCRIPTION - Preview of scene description */}
      {/* ================================================================= */}
      {scene.description && (
        <p
          className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 cursor-pointer"
          onClick={onEdit}
        >
          {scene.description}
        </p>
      )}


      {/* ================================================================= */}
      {/* META INFO - Duration and location */}
      {/* ================================================================= */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        {/* Duration */}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(scene.duration)}
        </span>
        {/* Location (if set) */}
        {scene.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {truncate(scene.location, 15)}
          </span>
        )}
      </div>


      {/* ================================================================= */}
      {/* TAGS - Shot type, status, priority badges */}
      {/* ================================================================= */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Shot type (always shown) */}
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
          {scene.shotType}
        </span>
        {/* Status badge with color */}
        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(scene.status)}`}>
          {scene.status}
        </span>
        {/* Priority badge (only shown if not Medium - Medium is default) */}
        {scene.priority !== 'Medium' && (
          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(scene.priority)}`}>
            {scene.priority}
          </span>
        )}
      </div>
    </div>
  );
}
