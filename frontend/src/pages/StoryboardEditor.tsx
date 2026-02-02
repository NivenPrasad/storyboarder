import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Plus,
  Settings,
  Download,
  Share2,
  Clock,
  Film,
  Trash2,
  BarChart3,
  MessageSquare,
  ChevronLeft,
} from 'lucide-react';
import SceneCard from '../components/SceneCard';
import SceneEditor from '../components/SceneEditor';
import Timeline from '../components/Timeline';
import StoryboardStats from '../components/StoryboardStats';
import ExportModal from '../components/ExportModal';
import ShareModal from '../components/ShareModal';
import CommentsPanel from '../components/CommentsPanel';
import StoryboardSettings from '../components/StoryboardSettings';
import { formatDuration } from '../utils/helpers';
import { ShotType, CameraAngle, SceneType, Priority, SceneStatus } from '../types';

export default function StoryboardEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentStoryboard,
    fetchStoryboard,
    createScene,
    reorderScenes,
    bulkDeleteScenes,
    selectedScenes,
    clearSceneSelection,
    editingScene,
    setEditingScene,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (id) {
      fetchStoryboard(id)
        .then(() => setLoading(false))
        .catch(() => {
          navigate('/dashboard');
        });
    }
  }, [id, fetchStoryboard, navigate]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && currentStoryboard) {
      const oldIndex = currentStoryboard.scenes.findIndex((s) => s.id === active.id);
      const newIndex = currentStoryboard.scenes.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(
        currentStoryboard.scenes.map((s) => s.id),
        oldIndex,
        newIndex
      );

      reorderScenes(newOrder);
    }
  };

  const handleAddScene = async () => {
    if (!currentStoryboard) return;

    const newScene = await createScene(currentStoryboard.id, {
      title: `Scene ${currentStoryboard.scenes.length + 1}`,
      description: '',
      shotType: ShotType.MEDIUM_SHOT,
      cameraAngle: CameraAngle.EYE_LEVEL,
      duration: 30,
      sceneType: SceneType.A_ROLL,
      location: '',
      props: [],
      talent: [],
      checklist: [],
      priority: Priority.MEDIUM,
      status: SceneStatus.NOT_STARTED,
      tags: [],
    });

    setEditingScene(newScene);
  };

  const handleBulkDelete = async () => {
    if (selectedScenes.length === 0) return;
    if (confirm(`Delete ${selectedScenes.length} selected scenes?`)) {
      await bulkDeleteScenes(selectedScenes);
      clearSceneSelection();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!currentStoryboard) {
    return (
      <div className="p-8 text-center">
        <p>Storyboard not found</p>
      </div>
    );
  }

  const totalDuration = currentStoryboard.scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-lg">{currentStoryboard.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Film className="w-4 h-4" />
                  {currentStoryboard.scenes.length} scenes
                </span>
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

          <div className="flex items-center gap-2">
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
            <button
              onClick={() => setShowStats(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Statistics"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Export"
            >
              <Download className="w-5 h-5" />
            </button>
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

      {/* Timeline */}
      <Timeline scenes={currentStoryboard.scenes} targetDuration={currentStoryboard.targetDuration} />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentStoryboard.scenes.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentStoryboard.scenes.map((scene) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  onEdit={() => setEditingScene(scene)}
                />
              ))}

              {/* Add scene button */}
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

      {/* Modals */}
      {editingScene && (
        <SceneEditor
          scene={editingScene}
          onClose={() => setEditingScene(null)}
        />
      )}

      {showExport && (
        <ExportModal
          storyboardId={currentStoryboard.id}
          storyboardTitle={currentStoryboard.title}
          onClose={() => setShowExport(false)}
        />
      )}

      {showShare && (
        <ShareModal
          storyboard={currentStoryboard}
          onClose={() => setShowShare(false)}
        />
      )}

      {showStats && (
        <StoryboardStats
          storyboardId={currentStoryboard.id}
          onClose={() => setShowStats(false)}
        />
      )}

      {showComments && (
        <CommentsPanel
          storyboard={currentStoryboard}
          onClose={() => setShowComments(false)}
        />
      )}

      {showSettings && (
        <StoryboardSettings
          storyboard={currentStoryboard}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
