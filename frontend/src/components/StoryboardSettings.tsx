import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, Trash2, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import type { Storyboard } from '../types';

interface StoryboardSettingsProps {
  storyboard: Storyboard;
  onClose: () => void;
}

export default function StoryboardSettings({ storyboard, onClose }: StoryboardSettingsProps) {
  const { updateStoryboard, deleteStoryboard } = useStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState(storyboard.title);
  const [description, setDescription] = useState(storyboard.description || '');
  const [targetDuration, setTargetDuration] = useState<number | ''>(
    storyboard.targetDuration ? Math.round(storyboard.targetDuration / 60) : ''
  );
  const [saving, setSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStoryboard(storyboard.id, {
        title,
        description: description || undefined,
        targetDuration: targetDuration ? Number(targetDuration) * 60 : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        'Are you sure you want to delete this storyboard? This action cannot be undone.'
      )
    ) {
      await deleteStoryboard(storyboard.id);
      navigate('/dashboard');
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) return;

    setCreatingTemplate(true);
    try {
      await api.createTemplateFromStoryboard(
        storyboard.id,
        templateName.trim(),
        `Custom template based on "${storyboard.title}"`
      );
      setTemplateName('');
      alert('Template created successfully!');
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template');
    } finally {
      setCreatingTemplate(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Storyboard Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="label">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Storyboard title"
            />
          </div>

          {/* Description */}
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
              placeholder="Brief description..."
            />
          </div>

          {/* Target Duration */}
          <div>
            <label htmlFor="targetDuration" className="label flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Target Duration (minutes)
            </label>
            <input
              id="targetDuration"
              type="number"
              min="1"
              max="180"
              value={targetDuration}
              onChange={(e) => setTargetDuration(e.target.value ? Number(e.target.value) : '')}
              className="input"
              placeholder="10"
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {/* Divider */}
          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Save as Template */}
          <div>
            <label className="label">Save as Template</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="input flex-1"
                placeholder="Template name"
              />
              <button
                onClick={handleCreateTemplate}
                className="btn btn-secondary"
                disabled={creatingTemplate || !templateName.trim()}
              >
                {creatingTemplate ? 'Creating...' : 'Create'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Save this storyboard structure as a reusable template
            </p>
          </div>

          {/* Divider */}
          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Delete */}
          <div>
            <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>
            <button
              onClick={handleDelete}
              className="btn btn-danger w-full flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Storyboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
