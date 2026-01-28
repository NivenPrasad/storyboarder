import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Clock, Film, CheckCircle, PieChart } from 'lucide-react';
import { formatDuration, getSceneTypeColor } from '../utils/helpers';

interface StoryboardStatsProps {
  storyboardId: string;
  onClose: () => void;
}

export default function StoryboardStats({ storyboardId, onClose }: StoryboardStatsProps) {
  const { fetchStoryboardStats, storyboardStats, currentStoryboard } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStoryboardStats(storyboardId).finally(() => setLoading(false));
  }, [storyboardId, fetchStoryboardStats]);

  if (loading || !storyboardStats) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const sceneTypes = Object.entries(storyboardStats.sceneTypeBreakdown);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Storyboard Statistics
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Film className="w-6 h-6 mx-auto mb-2 text-primary-500" />
              <p className="text-2xl font-bold">{storyboardStats.sceneCount}</p>
              <p className="text-sm text-gray-500">Scenes</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary-500" />
              <p className="text-2xl font-bold">{formatDuration(storyboardStats.totalDuration)}</p>
              <p className="text-sm text-gray-500">Total Duration</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{storyboardStats.completedScenes}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>

          {/* Target progress */}
          {currentStoryboard?.targetDuration && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Target Progress</span>
                <span className="font-medium">{storyboardStats.targetProgress}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    storyboardStats.targetProgress >= 100
                      ? 'bg-green-500'
                      : storyboardStats.targetProgress >= 80
                      ? 'bg-yellow-500'
                      : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(100, storyboardStats.targetProgress)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatDuration(storyboardStats.totalDuration)} of{' '}
                {formatDuration(currentStoryboard.targetDuration)} target
              </p>
            </div>
          )}

          {/* Scene type breakdown */}
          <div>
            <h3 className="text-sm font-medium mb-3">Scene Type Breakdown</h3>
            <div className="space-y-3">
              {sceneTypes.map(([type, data]) => {
                const percentage = Math.round(
                  (data.duration / storyboardStats.totalDuration) * 100
                );
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${getSceneTypeColor(type)}`}></div>
                        {type}
                      </span>
                      <span className="text-gray-500">
                        {data.count} scenes ({formatDuration(data.duration)})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getSceneTypeColor(type)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion rate */}
          <div>
            <h3 className="text-sm font-medium mb-2">Completion Rate</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${
                      storyboardStats.sceneCount > 0
                        ? (storyboardStats.completedScenes / storyboardStats.sceneCount) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium">
                {storyboardStats.sceneCount > 0
                  ? Math.round(
                      (storyboardStats.completedScenes / storyboardStats.sceneCount) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
