import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/useStore';
import {
  GripVertical,
  MoreVertical,
  Copy,
  Trash2,
  Clock,
  MapPin,
  Camera,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import {
  formatDuration,
  getSceneTypeBorderColor,
  getStatusColor,
  getPriorityColor,
  truncate,
} from '../utils/helpers';
import type { Scene } from '../types';

interface SceneCardProps {
  scene: Scene;
  onEdit: () => void;
}

export default function SceneCard({ scene, onEdit }: SceneCardProps) {
  const { deleteScene, duplicateScene, selectedScenes, toggleSceneSelection } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedScenes.includes(scene.id);

  const handleDelete = async () => {
    if (confirm('Delete this scene?')) {
      await deleteScene(scene.id);
    }
    setMenuOpen(false);
  };

  const handleDuplicate = async () => {
    await duplicateScene(scene.id);
    setMenuOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`scene-card border-l-4 ${getSceneTypeBorderColor(scene.sceneType)} ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded cursor-grab hover:bg-gray-100 dark:hover:bg-gray-700 touch-none"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>

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

        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          #{scene.order}
        </span>

        <h3 className="font-medium flex-1 truncate" onClick={onEdit}>
          {scene.title}
        </h3>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
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

      {/* Visual reference preview */}
      {scene.visualReferences.length > 0 ? (
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
        <div
          className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center cursor-pointer"
          onClick={onEdit}
        >
          <Camera className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Description */}
      {scene.description && (
        <p
          className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 cursor-pointer"
          onClick={onEdit}
        >
          {scene.description}
        </p>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(scene.duration)}
        </span>
        {scene.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {truncate(scene.location, 15)}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
          {scene.shotType}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(scene.status)}`}>
          {scene.status}
        </span>
        {scene.priority !== 'Medium' && (
          <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(scene.priority)}`}>
            {scene.priority}
          </span>
        )}
      </div>
    </div>
  );
}
