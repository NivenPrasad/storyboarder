/**
 * =============================================================================
 * STORYBOARD EDITOR PAGE
 * =============================================================================
 *
 * This is the main editing interface where users create and edit their
 * storyboards. It's the heart of the application!
 *
 * FEATURES:
 * - View all scenes in a grid layout
 * - Drag and drop to reorder scenes
 * - Click to edit scene details
 * - Add/delete/duplicate scenes
 * - Bulk select and delete multiple scenes
 * - View timeline and statistics
 * - Export, share, and manage settings
 *
 * DRAG AND DROP:
 * We use @dnd-kit library for drag and drop. It's accessible and works
 * with both mouse and keyboard. When you drag a scene, it tells us the
 * old position and new position, then we reorder the array.
 */

// React hooks for state and effects
import { useEffect, useState } from 'react';

// React Router hooks for URL parameters and navigation
import { useParams, useNavigate } from 'react-router-dom';

// Global state store
import { useStore } from '../store/useStore';

// Drag and drop library components
import {
  DndContext,                    // Wrapper that enables drag/drop
  closestCenter,                 // Algorithm to detect where to drop
  KeyboardSensor,                // Allow keyboard-based dragging
  PointerSensor,                 // Mouse/touch dragging
  useSensor,                     // Hook to configure sensors
  useSensors,                    // Hook to combine multiple sensors
  DragEndEvent,                  // TypeScript type for drag end event
} from '@dnd-kit/core';

import {
  arrayMove,                     // Helper to reorder array items
  SortableContext,               // Wrapper for sortable items
  sortableKeyboardCoordinates,   // Keyboard navigation config
  verticalListSortingStrategy,   // Sorting strategy (vertical list)
} from '@dnd-kit/sortable';

// Icons from lucide-react (modern icon library)
import {
  Plus,              // + icon for adding scenes
  Settings,          // Gear icon for settings
  Download,          // Download icon for export
  Share2,            // Share icon
  Clock,             // Clock icon for duration
  Film,              // Film icon for scene count
  Trash2,            // Trash icon for delete
  BarChart3,         // Chart icon for statistics
  MessageSquare,     // Chat bubble for comments
  ChevronLeft,       // Back arrow
} from 'lucide-react';

// Child components
import SceneCard from '../components/SceneCard';         // Individual scene card
import SceneEditor from '../components/SceneEditor';     // Modal to edit scene
import Timeline from '../components/Timeline';           // Visual timeline bar
import StoryboardStats from '../components/StoryboardStats'; // Statistics modal
import ExportModal from '../components/ExportModal';     // Export options modal
import ShareModal from '../components/ShareModal';       // Sharing modal
import CommentsPanel from '../components/CommentsPanel'; // Comments sidebar
import StoryboardSettings from '../components/StoryboardSettings'; // Settings modal

// Utility functions
import { formatDuration } from '../utils/helpers';       // Convert seconds to "5m 30s"

// Type definitions for dropdowns
import { ShotType, CameraAngle, SceneType, Priority, SceneStatus } from '../types';


/**
 * STORYBOARD EDITOR COMPONENT
 *
 * Main editing interface for a single storyboard.
 */
export default function StoryboardEditor() {

  // =========================================================================
  // HOOKS - Get data and functions from various sources
  // =========================================================================

  // Get the storyboard ID from the URL (e.g., /storyboard/abc123 → id="abc123")
  const { id } = useParams<{ id: string }>();

  // Function to programmatically navigate to other pages
  const navigate = useNavigate();

  // Get state and actions from our global store
  const {
    currentStoryboard,      // The storyboard we're editing
    fetchStoryboard,        // Function to load a storyboard
    createScene,            // Function to add a new scene
    reorderScenes,          // Function to change scene order
    bulkDeleteScenes,       // Function to delete multiple scenes
    selectedScenes,         // Array of selected scene IDs
    clearSceneSelection,    // Function to clear selection
    editingScene,           // Scene currently being edited (for modal)
    setEditingScene,        // Function to open/close editor modal
  } = useStore();

  // =========================================================================
  // LOCAL STATE - UI state that doesn't need to be global
  // =========================================================================

  const [loading, setLoading] = useState(true);           // Loading the storyboard?
  const [showExport, setShowExport] = useState(false);    // Show export modal?
  const [showShare, setShowShare] = useState(false);      // Show share modal?
  const [showStats, setShowStats] = useState(false);      // Show stats modal?
  const [showComments, setShowComments] = useState(false);// Show comments panel?
  const [showSettings, setShowSettings] = useState(false);// Show settings modal?

  // =========================================================================
  // DRAG AND DROP SENSORS
  // =========================================================================
  // Configure how drag and drop works

  const sensors = useSensors(
    // Pointer sensor (mouse/touch)
    useSensor(PointerSensor, {
      // Only start dragging after moving 8 pixels
      // This prevents accidental drags when clicking
      activationConstraint: {
        distance: 8,
      },
    }),
    // Keyboard sensor (accessibility)
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // =========================================================================
  // LOAD STORYBOARD ON MOUNT
  // =========================================================================
  // When this component appears, load the storyboard data

  useEffect(() => {
    if (id) {
      fetchStoryboard(id)
        .then(() => setLoading(false))  // Success: stop loading
        .catch(() => {
          navigate('/dashboard');        // Error: go back to dashboard
        });
    }
  }, [id, fetchStoryboard, navigate]);  // Re-run if ID changes


  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handle drag end - When user drops a scene in a new position
   *
   * @param event - Contains info about what was dragged and where
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Only reorder if dropped on a different scene
    if (over && active.id !== over.id && currentStoryboard) {
      // Find the positions of the dragged and dropped items
      const oldIndex = currentStoryboard.scenes.findIndex((s) => s.id === active.id);
      const newIndex = currentStoryboard.scenes.findIndex((s) => s.id === over.id);

      // Create new order array and update
      const newOrder = arrayMove(
        currentStoryboard.scenes.map((s) => s.id),
        oldIndex,
        newIndex
      );

      reorderScenes(newOrder);
    }
  };

  /**
   * Handle add scene - Create a new scene with default values
   */
  const handleAddScene = async () => {
    if (!currentStoryboard) return;

    // Create scene with sensible defaults
    const newScene = await createScene(currentStoryboard.id, {
      title: `Scene ${currentStoryboard.scenes.length + 1}`,  // Auto-number
      description: '',
      shotType: ShotType.MEDIUM_SHOT,           // Most common shot type
      cameraAngle: CameraAngle.EYE_LEVEL,       // Neutral angle
      duration: 30,                              // 30 seconds default
      sceneType: SceneType.A_ROLL,              // Main content
      location: '',
      props: [],
      talent: [],
      checklist: [],
      priority: Priority.MEDIUM,
      status: SceneStatus.NOT_STARTED,
      tags: [],
    });

    // Open the editor for the new scene
    setEditingScene(newScene);
  };

  /**
   * Handle bulk delete - Delete all selected scenes
   */
  const handleBulkDelete = async () => {
    if (selectedScenes.length === 0) return;

    // Confirm before deleting
    if (confirm(`Delete ${selectedScenes.length} selected scenes?`)) {
      await bulkDeleteScenes(selectedScenes);
      clearSceneSelection();
    }
  };


  // =========================================================================
  // LOADING STATE
  // =========================================================================
  // Show spinner while loading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // =========================================================================
  // ERROR STATE
  // =========================================================================
  // Show message if storyboard not found

  if (!currentStoryboard) {
    return (
      <div className="p-8 text-center">
        <p>Storyboard not found</p>
      </div>
    );
  }


  // =========================================================================
  // CALCULATE DERIVED VALUES
  // =========================================================================

  // Total duration of all scenes (in seconds)
  const totalDuration = currentStoryboard.scenes.reduce((sum, s) => sum + s.duration, 0);


  // =========================================================================
  // RENDER THE EDITOR
  // =========================================================================

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* ================================================================= */}
      {/* HEADER - Title, stats, and action buttons */}
      {/* ================================================================= */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">

          {/* Left side: Back button, title, and quick stats */}
          <div className="flex items-center gap-4">
            {/* Back to dashboard button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Title and stats */}
            <div>
              <h1 className="font-semibold text-lg">{currentStoryboard.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {/* Scene count */}
                <span className="flex items-center gap-1">
                  <Film className="w-4 h-4" />
                  {currentStoryboard.scenes.length} scenes
                </span>
                {/* Duration (current / target) */}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(totalDuration)}
                  {currentStoryboard.targetDuration && (
                    <span className="text-gray-400">
                      / {formatDuration(currentStoryboard.targetDuration)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2">

            {/* Bulk selection actions (only visible when scenes are selected) */}
            {selectedScenes.length > 0 && (
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-gray-500">
                  {selectedScenes.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="btn btn-danger text-sm py-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={clearSceneSelection}
                  className="btn btn-secondary text-sm py-1"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Comments button (with count badge) */}
            <button
              onClick={() => setShowComments(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              title="Comments"
            >
              <MessageSquare className="w-5 h-5" />
              {currentStoryboard.comments.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                  {currentStoryboard.comments.length}
                </span>
              )}
            </button>

            {/* Statistics button */}
            <button
              onClick={() => setShowStats(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Statistics"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            {/* Share button */}
            <button
              onClick={() => setShowShare(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Export button */}
            <button
              onClick={() => setShowExport(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Export"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>


      {/* ================================================================= */}
      {/* TIMELINE - Visual progress bar showing scene durations */}
      {/* ================================================================= */}
      <Timeline scenes={currentStoryboard.scenes} targetDuration={currentStoryboard.targetDuration} />


      {/* ================================================================= */}
      {/* MAIN CONTENT - Scene cards grid with drag and drop */}
      {/* ================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {/* DndContext enables drag and drop for everything inside */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* SortableContext provides the list of draggable items */}
          <SortableContext
            items={currentStoryboard.scenes.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {/* Grid of scene cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Render each scene as a draggable card */}
              {currentStoryboard.scenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onEdit={() => setEditingScene(scene)}
                />
              ))}

              {/* Add scene button (always at the end) */}
              <button
                onClick={handleAddScene}
                className="min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
              >
                <Plus className="w-8 h-8" />
                <span>Add Scene</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </div>


      {/* ================================================================= */}
      {/* MODALS - Pop-up dialogs for various actions */}
      {/* ================================================================= */}
      {/* Each modal only renders when its state is true */}

      {/* Scene Editor Modal */}
      {editingScene && (
        <SceneEditor
          scene={editingScene}
          onClose={() => setEditingScene(null)}
        />
      )}

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          storyboardId={currentStoryboard.id}
          storyboardTitle={currentStoryboard.title}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          storyboard={currentStoryboard}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Statistics Modal */}
      {showStats && (
        <StoryboardStats
          storyboardId={currentStoryboard.id}
          onClose={() => setShowStats(false)}
        />
      )}

      {/* Comments Panel (slide-in) */}
      {showComments && (
        <CommentsPanel
          storyboard={currentStoryboard}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <StoryboardSettings
          storyboard={currentStoryboard}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
