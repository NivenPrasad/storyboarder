import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { X, FileVideo, Clock } from 'lucide-react';
import type { Template } from '../types';

interface CreateStoryboardModalProps {
  onClose: () => void;
}

export default function CreateStoryboardModal({ onClose }: CreateStoryboardModalProps) {
  const { createStoryboard, fetchTemplates, templates } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDuration, setTargetDuration] = useState<number | ''>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const storyboard = await createStoryboard({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDuration: targetDuration ? Number(targetDuration) * 60 : undefined,
        templateId: selectedTemplate || undefined,
      });
      navigate(`/storyboard/${storyboard.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create storyboard');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Create New Storyboard</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="label">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="My Awesome Video"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
              rows={3}
              placeholder="Brief description of your video..."
            />
          </div>

          <div>
            <label htmlFor="targetDuration" className="label">
              Target Duration (minutes)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="targetDuration"
                type="number"
                min="1"
                max="180"
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value ? Number(e.target.value) : '')}
                className="input pl-10"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="label">Start from Template</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedTemplate('')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedTemplate === ''
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <FileVideo className="w-5 h-5 mb-1 text-gray-400" />
                <span className="text-sm font-medium">Blank</span>
              </button>
              {templates.filter(t => t.isSystem).map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileVideo className="w-5 h-5 mb-1 text-primary-500" />
                  <span className="text-sm font-medium">{template.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Storyboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
