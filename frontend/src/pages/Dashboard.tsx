import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  Plus,
  MoreVertical,
  Trash2,
  Copy,
  Clock,
  Film,
  FolderOpen,
} from 'lucide-react';
import { formatDuration } from '../utils/helpers';
import CreateStoryboardModal from '../components/CreateStoryboardModal';

export default function Dashboard() {
  const { storyboards, fetchStoryboards, deleteStoryboard, duplicateStoryboard } = useStore();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStoryboards().finally(() => setLoading(false));
  }, [fetchStoryboards]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this storyboard?')) {
      await deleteStoryboard(id);
    }
    setMenuOpen(null);
  };

  const handleDuplicate = async (id: string) => {
    const duplicate = await duplicateStoryboard(id);
    navigate(`/storyboard/${duplicate.id}`);
    setMenuOpen(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Storyboards</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {storyboards.length} {storyboards.length === 1 ? 'storyboard' : 'storyboards'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Storyboard
        </button>
      </div>

      {storyboards.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No storyboards yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first storyboard to start planning your video.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            Create Storyboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {storyboards.map((storyboard) => (
            <div
              key={storyboard.id}
              className="card hover:shadow-md transition-shadow"
            >
              <Link
                to={`/storyboard/${storyboard.id}`}
                className="block p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg truncate pr-4">
                    {storyboard.title}
                  </h3>
                </div>
                {storyboard.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {storyboard.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Film className="w-4 h-4" />
                    {storyboard.scenes?.length || 0} scenes
                  </span>
                  {storyboard.targetDuration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(storyboard.targetDuration)}
                    </span>
                  )}
                </div>
              </Link>
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Updated {new Date(storyboard.updatedAt).toLocaleDateString()}
                </span>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(menuOpen === storyboard.id ? null : storyboard.id);
                    }}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpen === storyboard.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 bottom-full mb-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                        <button
                          onClick={() => handleDuplicate(storyboard.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(storyboard.id)}
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
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateStoryboardModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
