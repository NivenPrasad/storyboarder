import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import {
  X,
  Save,
  Upload,
  Trash2,
  Plus,
  Check,
  Clock,
  MapPin,
  Camera,
  Film,
  Lightbulb,
  Mic,
  Video,
  Users,
  Package,
  Tag,
  FileText,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import {
  ShotType,
  CameraAngle,
  SceneType,
  CameraMovement,
  TimeOfDay,
  Priority,
  SceneStatus,
} from '../types';
import type { Scene, ChecklistItem } from '../types';
import { formatDuration, generateId, calculateReadingTime } from '../utils/helpers';

interface SceneEditorProps {
  scene: Scene;
  onClose: () => void;
}

const shotTypes = Object.values(ShotType);
const cameraAngles = Object.values(CameraAngle);
const sceneTypes = Object.values(SceneType);
const cameraMovements = Object.values(CameraMovement);
const timesOfDay = Object.values(TimeOfDay);
const priorities = Object.values(Priority);
const statuses = Object.values(SceneStatus);

export default function SceneEditor({ scene, onClose }: SceneEditorProps) {
  const { updateScene, addVisualReference, deleteVisualReference } = useStore();

  const [formData, setFormData] = useState({
    title: scene.title,
    description: scene.description,
    shotType: scene.shotType,
    cameraAngle: scene.cameraAngle,
    duration: scene.duration,
    sceneType: scene.sceneType,
    location: scene.location,
    props: scene.props.join(', '),
    talent: scene.talent.join(', '),
    lightingNotes: scene.lightingNotes || '',
    audioNotes: scene.audioNotes || '',
    cameraMovement: scene.cameraMovement || '',
    equipment: (scene.equipment || []).join(', '),
    timeOfDay: scene.timeOfDay || '',
    dialogue: scene.dialogue || '',
    onScreenText: scene.onScreenText || '',
    directorNotes: scene.directorNotes || '',
    priority: scene.priority,
    status: scene.status,
    assignedTo: scene.assignedTo || '',
    tags: scene.tags.join(', '),
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>(scene.checklist);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'script' | 'production'>('details');
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateScene(scene.id, {
        title: formData.title,
        description: formData.description,
        shotType: formData.shotType as ShotType,
        cameraAngle: formData.cameraAngle as CameraAngle,
        duration: formData.duration,
        sceneType: formData.sceneType as SceneType,
        location: formData.location,
        props: formData.props.split(',').map((p) => p.trim()).filter(Boolean),
        talent: formData.talent.split(',').map((t) => t.trim()).filter(Boolean),
        lightingNotes: formData.lightingNotes || undefined,
        audioNotes: formData.audioNotes || undefined,
        cameraMovement: formData.cameraMovement as CameraMovement || undefined,
        equipment: formData.equipment.split(',').map((e) => e.trim()).filter(Boolean),
        timeOfDay: formData.timeOfDay as TimeOfDay || undefined,
        dialogue: formData.dialogue || undefined,
        onScreenText: formData.onScreenText || undefined,
        directorNotes: formData.directorNotes || undefined,
        checklist,
        priority: formData.priority as Priority,
        status: formData.status as SceneStatus,
        assignedTo: formData.assignedTo || undefined,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      onClose();
    } catch (error) {
      console.error('Failed to save scene:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await api.uploadImage(file);
      await addVisualReference(scene.id, url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (refId: string) => {
    await deleteVisualReference(scene.id, refId);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([
      ...checklist,
      { id: generateId(), text: newChecklistItem.trim(), completed: false },
    ]);
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const dialogueReadingTime = calculateReadingTime(formData.dialogue);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">Scene #{scene.order}</span>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
              placeholder="Scene Title"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="btn btn-primary flex items-center gap-2"
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Shot Details
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'script'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Script & Dialogue
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'production'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Production Notes
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                {/* Visual References */}
                <div>
                  <label className="label flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Visual References
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {scene.visualReferences.map((ref) => (
                      <div key={ref.id} className="relative group aspect-video">
                        <img
                          src={ref.url}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDeleteImage(ref.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-video border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-xs text-gray-400 mt-1">Upload</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input resize-none"
                    rows={3}
                    placeholder="Describe this scene..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Shot Type & Camera Angle */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-2">
                      <Film className="w-4 h-4" />
                      Shot Type
                    </label>
                    <select
                      value={formData.shotType}
                      onChange={(e) => setFormData({ ...formData, shotType: e.target.value })}
                      className="input"
                    >
                      {shotTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Camera Angle</label>
                    <select
                      value={formData.cameraAngle}
                      onChange={(e) => setFormData({ ...formData, cameraAngle: e.target.value })}
                      className="input"
                    >
                      {cameraAngles.map((angle) => (
                        <option key={angle} value={angle}>
                          {angle}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration & Scene Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="3600"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      = {formatDuration(formData.duration)}
                    </p>
                  </div>
                  <div>
                    <label className="label">Scene Type</label>
                    <select
                      value={formData.sceneType}
                      onChange={(e) => setFormData({ ...formData, sceneType: e.target.value })}
                      className="input"
                    >
                      {sceneTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Location */}
                <div>
                  <label className="label flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                    placeholder="Where is this scene filmed?"
                    maxLength={100}
                  />
                </div>

                {/* Props */}
                <div>
                  <label className="label flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Props (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.props}
                    onChange={(e) => setFormData({ ...formData, props: e.target.value })}
                    className="input"
                    placeholder="Camera, Tripod, Laptop"
                  />
                </div>

                {/* Talent */}
                <div>
                  <label className="label flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Talent/People (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.talent}
                    onChange={(e) => setFormData({ ...formData, talent: e.target.value })}
                    className="input"
                    placeholder="Host, Guest 1, Guest 2"
                  />
                </div>

                {/* Camera Movement & Time of Day */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Camera Movement
                    </label>
                    <select
                      value={formData.cameraMovement}
                      onChange={(e) => setFormData({ ...formData, cameraMovement: e.target.value })}
                      className="input"
                    >
                      <option value="">None</option>
                      {cameraMovements.map((movement) => (
                        <option key={movement} value={movement}>
                          {movement}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Time of Day</label>
                    <select
                      value={formData.timeOfDay}
                      onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                      className="input"
                    >
                      <option value="">Not specified</option>
                      {timesOfDay.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lighting & Audio Notes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Lighting Notes
                    </label>
                    <input
                      type="text"
                      value={formData.lightingNotes}
                      onChange={(e) => setFormData({ ...formData, lightingNotes: e.target.value })}
                      className="input"
                      placeholder="Natural light, soft box..."
                    />
                  </div>
                  <div>
                    <label className="label flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Audio Notes
                    </label>
                    <input
                      type="text"
                      value={formData.audioNotes}
                      onChange={(e) => setFormData({ ...formData, audioNotes: e.target.value })}
                      className="input"
                      placeholder="Lav mic, ambient..."
                    />
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <label className="label">Equipment (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    className="input"
                    placeholder="Canon R5, 24-70mm, Gimbal"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-6">
              {/* Dialogue */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label flex items-center gap-2 mb-0">
                    <FileText className="w-4 h-4" />
                    Dialogue / Voiceover
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formData.dialogue.length} chars |{' '}
                      {dialogueReadingTime > 0 ? `~${formatDuration(dialogueReadingTime)}` : '0s'}
                    </span>
                    <button
                      onClick={() => setShowTeleprompter(true)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Teleprompter
                    </button>
                  </div>
                </div>
                <textarea
                  value={formData.dialogue}
                  onChange={(e) => setFormData({ ...formData, dialogue: e.target.value })}
                  className="input resize-none font-mono"
                  rows={8}
                  placeholder="Write your script here..."
                />
                <button
                  onClick={() => navigator.clipboard.writeText(formData.dialogue)}
                  className="text-xs text-gray-500 hover:text-gray-700 mt-1"
                >
                  Copy to clipboard
                </button>
              </div>

              {/* On-Screen Text */}
              <div>
                <label className="label">On-Screen Text / Graphics</label>
                <textarea
                  value={formData.onScreenText}
                  onChange={(e) => setFormData({ ...formData, onScreenText: e.target.value })}
                  className="input resize-none"
                  rows={3}
                  placeholder="Lower thirds, titles, call-to-action text..."
                />
              </div>

              {/* Teleprompter Modal */}
              {showTeleprompter && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col">
                  <div className="flex items-center justify-between p-4">
                    <h2 className="text-white text-lg font-semibold">Teleprompter Mode</h2>
                    <button
                      onClick={() => setShowTeleprompter(false)}
                      className="text-white hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                    <p className="text-white text-3xl leading-relaxed max-w-4xl text-center whitespace-pre-wrap">
                      {formData.dialogue || 'No dialogue to display'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'production' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-4">
                {/* Director Notes */}
                <div>
                  <label className="label">Director Notes</label>
                  <textarea
                    value={formData.directorNotes}
                    onChange={(e) => setFormData({ ...formData, directorNotes: e.target.value })}
                    className="input resize-none"
                    rows={4}
                    placeholder="Creative vision, specific instructions..."
                  />
                </div>

                {/* Checklist */}
                <div>
                  <label className="label flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Production Checklist
                  </label>
                  <div className="space-y-2 mb-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700"
                      >
                        <button
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            item.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3" />}
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            item.completed ? 'line-through text-gray-400' : ''
                          }`}
                        >
                          {item.text}
                        </span>
                        <button
                          onClick={() => removeChecklistItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                      className="input flex-1"
                      placeholder="Add checklist item..."
                    />
                    <button onClick={addChecklistItem} className="btn btn-secondary">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Priority & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input"
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="label">Assigned To</label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="input"
                    placeholder="Team member name"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="label flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="input"
                    placeholder="outdoor, action, important"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
