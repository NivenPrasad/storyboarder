import { getSceneTypeColor, formatDuration } from '../utils/helpers';
import type { Scene } from '../types';

interface TimelineProps {
  scenes: Scene[];
  targetDuration?: number;
}

export default function Timeline({ scenes, targetDuration }: TimelineProps) {
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const maxDuration = targetDuration || totalDuration || 1;

  return (
    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500">Timeline</span>
        <span className="text-xs text-gray-400">|</span>
        <span className="text-xs font-medium">{formatDuration(totalDuration)}</span>
        {targetDuration && (
          <>
            <span className="text-xs text-gray-400">/</span>
            <span className="text-xs text-gray-500">{formatDuration(targetDuration)} target</span>
          </>
        )}
      </div>
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
        {scenes.map((scene) => {
          const width = (scene.duration / maxDuration) * 100;
          return (
            <div
              key={scene.id}
              className={`h-full ${getSceneTypeColor(scene.sceneType)} border-r border-white/20 last:border-r-0 transition-all hover:opacity-80`}
              style={{ width: `${Math.max(width, 0.5)}%` }}
              title={`${scene.title} (${formatDuration(scene.duration)})`}
            />
          );
        })}
        {targetDuration && totalDuration < targetDuration && (
          <div
            className="h-full bg-gray-300 dark:bg-gray-600"
            style={{ width: `${((targetDuration - totalDuration) / maxDuration) * 100}%` }}
          />
        )}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-scene-a-roll"></div>
          <span>A-Roll</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-scene-b-roll"></div>
          <span>B-Roll</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-scene-interview"></div>
          <span>Interview</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-scene-transition"></div>
          <span>Transition</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-scene-title-card"></div>
          <span>Title</span>
        </div>
      </div>
    </div>
  );
}
