import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { FileVideo, Film, Clock, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { formatDuration } from '../utils/helpers';

export default function Templates() {
  const { templates, fetchTemplates, createStoryboard } = useStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates().finally(() => setLoading(false));
  }, [fetchTemplates]);

  const handleUseTemplate = async (templateId: string, templateName: string) => {
    const storyboard = await createStoryboard({
      title: `New ${templateName}`,
      templateId,
    });
    navigate(`/storyboard/${storyboard.id}`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Delete this custom template?')) {
      await api.deleteTemplate(templateId);
      fetchTemplates();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const systemTemplates = templates.filter((t) => t.isSystem);
  const customTemplates = templates.filter((t) => !t.isSystem);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Start with a pre-built structure for common video types
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Built-in Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemTemplates.map((template) => {
            const totalDuration = template.scenes.reduce(
              (sum, s) => sum + (s.duration || 0),
              0
            );
            return (
              <div key={template.id} className="card p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <FileVideo className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.type}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {template.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Film className="w-4 h-4" />
                    {template.scenes.length} scenes
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(totalDuration)}
                  </span>
                </div>
                <button
                  onClick={() => handleUseTemplate(template.id, template.name)}
                  className="btn btn-primary w-full"
                >
                  Use Template
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {customTemplates.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">My Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTemplates.map((template) => {
              const totalDuration = template.scenes.reduce(
                (sum, s) => sum + (s.duration || 0),
                0
              );
              return (
                <div key={template.id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <FileVideo className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-500">Custom</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Film className="w-4 h-4" />
                      {template.scenes.length} scenes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(totalDuration)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUseTemplate(template.id, template.name)}
                    className="btn btn-primary w-full"
                  >
                    Use Template
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
