import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import {
  FileVideo,
  Clock,
  Film,
  MapPin,
  Camera,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  formatDuration,
  getSceneTypeBorderColor,
  getStatusColor,
} from '../utils/helpers';
import Timeline from '../components/Timeline';
import type { Storyboard, Scene } from '../types';

export default function SharedStoryboard() {
  const { shareLink } = useParams<{ shareLink: string }>();
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);

  useEffect(() => {
    if (shareLink) {
      api
        .getSharedStoryboard(shareLink)
        .then(setStoryboard)
        .catch((err) => setError(err.message || 'Storyboard not found'))
        .finally(() => setLoading(false));
    }
  }, [shareLink]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !storyboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FileVideo className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Storyboard Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'This storyboard may have been deleted or is not publicly accessible.'}
          </p>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = storyboard.scenes.reduce((sum, s) => sum + s.duration, 0);

  const navigateScene = (direction: 'prev' | 'next') => {
    if (!selectedScene) return;
    const currentIndex = storyboard.scenes.findIndex((s) => s.id === selectedScene.id);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < storyboard.scenes.length) {
      setSelectedScene(storyboard.scenes[newIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/" className="flex items-center gap-2 text-primary-600">
              <FileVideo className="w-6 h-6" />
              <span className="font-semibold">Storyboard Creator</span>
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-500">Shared Storyboard</span>
          </div>
          <h1 className="text-2xl font-bold">{storyboard.title}</h1>
          {storyboard.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {storyboard.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Film className="w-4 h-4" />
              {storyboard.scenes.length} scenes
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      </header>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          <Timeline scenes={storyboard.scenes} targetDuration={storyboard.targetDuration} />
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storyboard.scenes.map((scene) => (
            <div
              key={scene.id}
              onClick={() => setSelectedScene(scene)}
              className={`card p-4 cursor-pointer border-l-4 ${getSceneTypeBorderColor(
                scene.sceneType
              )} hover:shadow-md transition-shadow`}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-gray-500">
                  #{scene.order}
                </span>
                <h3 className="font-medium flex-1 truncate">{scene.title}</h3>
                <span className="text-xs text-gray-500">
                  {formatDuration(scene.duration)}
                </span>
              </div>

              {/* Visual reference */}
              {scene.visualReferences.length > 0 ? (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 overflow-hidden">
                  <img
                    src={scene.visualReferences[0].url}
                    alt={scene.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Description */}
              {scene.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {scene.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                  {scene.shotType}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${getStatusColor(
                    scene.status
                  )}`}
                >
                  {scene.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Scene detail modal */}
      {selectedScene && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedScene(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateScene('prev')}
                  disabled={selectedScene.order === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500">
                  Scene {selectedScene.order} of {storyboard.scenes.length}
                </span>
                <button
                  onClick={() => navigateScene('next')}
                  disabled={selectedScene.order === storyboard.scenes.length}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-xl font-bold mb-2">{selectedScene.title}</h2>

              {/* Visual reference */}
              {selectedScene.visualReferences.length > 0 && (
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 overflow-hidden">
                  <img
                    src={selectedScene.visualReferences[0].url}
                    alt={selectedScene.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {selectedScene.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedScene.description}
                </p>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-xs text-gray-500">Shot Type</span>
                  <p className="font-medium">{selectedScene.shotType}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Camera Angle</span>
                  <p className="font-medium">{selectedScene.cameraAngle}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Duration</span>
                  <p className="font-medium">{formatDuration(selectedScene.duration)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Scene Type</span>
                  <p className="font-medium">{selectedScene.sceneType}</p>
                </div>
              </div>

              {selectedScene.location && (
                <div className="flex items-center gap-2 mb-4 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{selectedScene.location}</span>
                </div>
              )}

              {selectedScene.dialogue && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Dialogue</h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedScene.dialogue}
                  </div>
                </div>
              )}

              {selectedScene.directorNotes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Director Notes</h3>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                    {selectedScene.directorNotes}
                  </div>
                </div>
              )}

              {selectedScene.props.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Props</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScene.props.map((prop, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        {prop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedScene.talent.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Talent</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScene.talent.map((person, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-primary-600 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Create Your Own Storyboards</h2>
          <p className="opacity-90 mb-4">
            Plan your YouTube videos with professional storyboarding tools
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}
