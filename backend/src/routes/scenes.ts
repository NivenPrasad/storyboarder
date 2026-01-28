import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

interface DbScene {
  id: string;
  storyboard_id: string;
  scene_order: number;
  title: string;
  description: string;
  shot_type: string;
  camera_angle: string;
  duration: number;
  scene_type: string;
  location: string;
  props: string;
  talent: string;
  lighting_notes: string | null;
  audio_notes: string | null;
  camera_movement: string | null;
  equipment: string;
  time_of_day: string | null;
  dialogue: string | null;
  on_screen_text: string | null;
  director_notes: string | null;
  checklist: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

interface DbVisualRef {
  id: string;
  scene_id: string;
  url: string;
  caption: string | null;
  ref_order: number;
  created_at: string;
}

function transformScene(scene: DbScene): any {
  const visualRefs = db.prepare(`
    SELECT * FROM visual_references WHERE scene_id = ? ORDER BY ref_order ASC
  `).all(scene.id) as DbVisualRef[];

  return {
    id: scene.id,
    storyboardId: scene.storyboard_id,
    order: scene.scene_order,
    title: scene.title,
    description: scene.description,
    shotType: scene.shot_type,
    cameraAngle: scene.camera_angle,
    duration: scene.duration,
    sceneType: scene.scene_type,
    location: scene.location,
    props: JSON.parse(scene.props || '[]'),
    talent: JSON.parse(scene.talent || '[]'),
    lightingNotes: scene.lighting_notes,
    audioNotes: scene.audio_notes,
    cameraMovement: scene.camera_movement,
    equipment: JSON.parse(scene.equipment || '[]'),
    timeOfDay: scene.time_of_day,
    dialogue: scene.dialogue,
    onScreenText: scene.on_screen_text,
    directorNotes: scene.director_notes,
    checklist: JSON.parse(scene.checklist || '[]'),
    priority: scene.priority,
    status: scene.status,
    assignedTo: scene.assigned_to,
    tags: JSON.parse(scene.tags || '[]'),
    visualReferences: visualRefs.map(ref => ({
      id: ref.id,
      sceneId: ref.scene_id,
      url: ref.url,
      caption: ref.caption,
      order: ref.ref_order,
      createdAt: ref.created_at
    })),
    createdAt: scene.created_at,
    updatedAt: scene.updated_at
  };
}

function checkStoryboardAccess(storyboardId: string, userId: string | undefined, requireEdit = false): boolean {
  const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ?').get(storyboardId) as any;

  if (!storyboard) {
    return false;
  }

  if (storyboard.user_id === userId) {
    return true;
  }

  if (storyboard.is_public && !requireEdit) {
    return true;
  }

  if (userId) {
    const permission = requireEdit ? 'edit' : ['view', 'edit'];
    const query = Array.isArray(permission)
      ? `SELECT permission FROM storyboard_collaborators WHERE storyboard_id = ? AND user_id = ? AND permission IN (?, ?)`
      : `SELECT permission FROM storyboard_collaborators WHERE storyboard_id = ? AND user_id = ? AND permission = ?`;
    const params = Array.isArray(permission)
      ? [storyboardId, userId, ...permission]
      : [storyboardId, userId, permission];

    const collab = db.prepare(query).get(...params);
    if (collab) {
      return true;
    }
  }

  return false;
}

// Create scene
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const {
      storyboardId, title, description, shotType, cameraAngle, duration,
      sceneType, location, props, talent, lightingNotes, audioNotes,
      cameraMovement, equipment, timeOfDay, dialogue, onScreenText,
      directorNotes, checklist, priority, status, assignedTo, tags, order
    } = req.body;

    if (!storyboardId || !title || !description || !shotType || !cameraAngle || duration === undefined || !sceneType || location === undefined) {
      return res.status(400).json({ message: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    if (!checkStoryboardAccess(storyboardId, req.userId, true)) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const sceneId = uuidv4();
    const now = new Date().toISOString();

    // Get the next order number if not provided
    let sceneOrder = order;
    if (sceneOrder === undefined) {
      const maxOrder = db.prepare('SELECT MAX(scene_order) as max_order FROM scenes WHERE storyboard_id = ?').get(storyboardId) as { max_order: number | null };
      sceneOrder = (maxOrder.max_order || 0) + 1;
    } else {
      // Shift existing scenes to make room
      db.prepare(`
        UPDATE scenes SET scene_order = scene_order + 1 WHERE storyboard_id = ? AND scene_order >= ?
      `).run(storyboardId, sceneOrder);
    }

    db.prepare(`
      INSERT INTO scenes (
        id, storyboard_id, scene_order, title, description, shot_type, camera_angle,
        duration, scene_type, location, props, talent, lighting_notes, audio_notes,
        camera_movement, equipment, time_of_day, dialogue, on_screen_text,
        director_notes, checklist, priority, status, assigned_to, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sceneId, storyboardId, sceneOrder, title, description, shotType, cameraAngle,
      duration, sceneType, location,
      JSON.stringify(props || []),
      JSON.stringify(talent || []),
      lightingNotes || null, audioNotes || null, cameraMovement || null,
      JSON.stringify(equipment || []),
      timeOfDay || null, dialogue || null, onScreenText || null,
      directorNotes || null,
      JSON.stringify(checklist || []),
      priority || 'Medium', status || 'Not Started', assignedTo || null,
      JSON.stringify(tags || []),
      now, now
    );

    // Update storyboard updated_at
    db.prepare('UPDATE storyboards SET updated_at = ? WHERE id = ?').run(now, storyboardId);

    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(sceneId) as DbScene;
    res.status(201).json(transformScene(scene));
  } catch (error) {
    console.error('Create scene error:', error);
    res.status(500).json({ message: 'Failed to create scene', code: 'SERVER_ERROR' });
  }
});

// Get scene
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id) as DbScene | undefined;

    if (!scene) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    if (!checkStoryboardAccess(scene.storyboard_id, req.userId)) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    res.json(transformScene(scene));
  } catch (error) {
    console.error('Get scene error:', error);
    res.status(500).json({ message: 'Failed to get scene', code: 'SERVER_ERROR' });
  }
});

// Update scene
router.patch('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id) as DbScene | undefined;

    if (!scene) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    if (!checkStoryboardAccess(scene.storyboard_id, req.userId, true)) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: any[] = [];

    const fieldMappings: Record<string, string> = {
      title: 'title',
      description: 'description',
      shotType: 'shot_type',
      cameraAngle: 'camera_angle',
      duration: 'duration',
      sceneType: 'scene_type',
      location: 'location',
      lightingNotes: 'lighting_notes',
      audioNotes: 'audio_notes',
      cameraMovement: 'camera_movement',
      timeOfDay: 'time_of_day',
      dialogue: 'dialogue',
      onScreenText: 'on_screen_text',
      directorNotes: 'director_notes',
      priority: 'priority',
      status: 'status',
      assignedTo: 'assigned_to'
    };

    const jsonFields = ['props', 'talent', 'equipment', 'checklist', 'tags'];

    for (const [key, column] of Object.entries(fieldMappings)) {
      if (req.body[key] !== undefined) {
        updates.push(`${column} = ?`);
        params.push(req.body[key]);
      }
    }

    for (const field of jsonFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(JSON.stringify(req.body[field]));
      }
    }

    if (updates.length === 0) {
      return res.json(transformScene(scene));
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(req.params.id);

    db.prepare(`UPDATE scenes SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // Update storyboard updated_at
    db.prepare('UPDATE storyboards SET updated_at = ? WHERE id = ?').run(now, scene.storyboard_id);

    const updated = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id) as DbScene;
    res.json(transformScene(updated));
  } catch (error) {
    console.error('Update scene error:', error);
    res.status(500).json({ message: 'Failed to update scene', code: 'SERVER_ERROR' });
  }
});

// Delete scene
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id) as DbScene | undefined;

    if (!scene) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    if (!checkStoryboardAccess(scene.storyboard_id, req.userId, true)) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    db.prepare('DELETE FROM scenes WHERE id = ?').run(req.params.id);

    // Reorder remaining scenes
    db.prepare(`
      UPDATE scenes SET scene_order = scene_order - 1
      WHERE storyboard_id = ? AND scene_order > ?
    `).run(scene.storyboard_id, scene.scene_order);

    // Update storyboard updated_at
    db.prepare('UPDATE storyboards SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), scene.storyboard_id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete scene error:', error);
    res.status(500).json({ message: 'Failed to delete scene', code: 'SERVER_ERROR' });
  }
});

// Duplicate scene
router.post('/:id/duplicate', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id) as DbScene | undefined;

    if (!scene) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    if (!checkStoryboardAccess(scene.storyboard_id, req.userId, true)) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    const newSceneId = uuidv4();
    const now = new Date().toISOString();
    const newOrder = scene.scene_order + 1;

    // Shift scenes after this one
    db.prepare(`
      UPDATE scenes SET scene_order = scene_order + 1
      WHERE storyboard_id = ? AND scene_order > ?
    `).run(scene.storyboard_id, scene.scene_order);

    // Insert duplicate
    db.prepare(`
      INSERT INTO scenes (
        id, storyboard_id, scene_order, title, description, shot_type, camera_angle,
        duration, scene_type, location, props, talent, lighting_notes, audio_notes,
        camera_movement, equipment, time_of_day, dialogue, on_screen_text,
        director_notes, checklist, priority, status, assigned_to, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newSceneId, scene.storyboard_id, newOrder,
      `${scene.title} (Copy)`, scene.description, scene.shot_type, scene.camera_angle,
      scene.duration, scene.scene_type, scene.location, scene.props, scene.talent,
      scene.lighting_notes, scene.audio_notes, scene.camera_movement, scene.equipment,
      scene.time_of_day, scene.dialogue, scene.on_screen_text, scene.director_notes,
      scene.checklist, scene.priority, 'Not Started', scene.assigned_to, scene.tags,
      now, now
    );

    // Copy visual references
    const visualRefs = db.prepare('SELECT * FROM visual_references WHERE scene_id = ?').all(scene.id) as DbVisualRef[];
    for (const ref of visualRefs) {
      db.prepare(`
        INSERT INTO visual_references (id, scene_id, url, caption, ref_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), newSceneId, ref.url, ref.caption, ref.ref_order, now);
    }

    // Update storyboard updated_at
    db.prepare('UPDATE storyboards SET updated_at = ? WHERE id = ?').run(now, scene.storyboard_id);

    const newScene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(newSceneId) as DbScene;
    res.status(201).json(transformScene(newScene));
  } catch (error) {
    console.error('Duplicate scene error:', error);
    res.status(500).json({ message: 'Failed to duplicate scene', code: 'SERVER_ERROR' });
  }
});

// Reorder scenes
router.post('/reorder', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { storyboardId, sceneIds } = req.body;

    if (!storyboardId || !sceneIds || !Array.isArray(sceneIds)) {
      return res.status(400).json({ message: 'storyboardId and sceneIds are required', code: 'MISSING_FIELDS' });
    }

    if (!checkStoryboardAccess(storyboardId, req.userId, true)) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const now = new Date().toISOString();

    // Update scene orders
    const updateOrder = db.prepare('UPDATE scenes SET scene_order = ?, updated_at = ? WHERE id = ? AND storyboard_id = ?');

    for (let i = 0; i < sceneIds.length; i++) {
      updateOrder.run(i + 1, now, sceneIds[i], storyboardId);
    }

    // Update storyboard updated_at
    db.prepare('UPDATE storyboards SET updated_at = ? WHERE id = ?').run(now, storyboardId);

    res.json({ message: 'Scenes reordered successfully' });
  } catch (error) {
    console.error('Reorder scenes error:', error);
    res.status(500).json({ message: 'Failed to reorder scenes', code: 'SERVER_ERROR' });
  }
});

// Bulk delete scenes
router.post('/bulk-delete', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { storyboardId, sceneIds } = req.body;

    if (!storyboardId || !sceneIds || !Array.isArray(sceneIds)) {
      return res.status(400).json({ message: 'storyboardId and sceneIds are required', code: 'MISSING_FIELDS' });
    }

    if (!checkStoryboardAccess(storyboardId, req.userId, true)) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const placeholders = sceneIds.map(() => '?').join(',');
    db.prepare(`DELETE FROM scenes WHERE id IN (${placeholders}) AND storyboard_id = ?`).run(...sceneIds, storyboardId);

    // Reorder remaining scenes
    const remainingScenes = db.prepare(`
      SELECT id FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(storyboardId) as { id: string }[];

    const updateOrder = db.prepare('UPDATE scenes SET scene_order = ? WHERE id = ?');
    remainingScenes.forEach((scene, index) => {
      updateOrder.run(index + 1, scene.id);
    });

    // Update storyboard updated_at
    db.prepare('UPDATE storyboards SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), storyboardId);

    res.json({ message: 'Scenes deleted successfully' });
  } catch (error) {
    console.error('Bulk delete scenes error:', error);
    res.status(500).json({ message: 'Failed to delete scenes', code: 'SERVER_ERROR' });
  }
});

// Add visual reference to scene
router.post('/:id/visual-references', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id) as DbScene | undefined;

    if (!scene) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    if (!checkStoryboardAccess(scene.storyboard_id, req.userId, true)) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    const { url, caption } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required', code: 'MISSING_URL' });
    }

    const refId = uuidv4();
    const now = new Date().toISOString();

    // Get the next order number
    const maxOrder = db.prepare('SELECT MAX(ref_order) as max_order FROM visual_references WHERE scene_id = ?').get(req.params.id) as { max_order: number | null };
    const refOrder = (maxOrder.max_order || 0) + 1;

    db.prepare(`
      INSERT INTO visual_references (id, scene_id, url, caption, ref_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(refId, req.params.id, url, caption || null, refOrder, now);

    res.status(201).json({
      id: refId,
      sceneId: req.params.id,
      url,
      caption,
      order: refOrder,
      createdAt: now
    });
  } catch (error) {
    console.error('Add visual reference error:', error);
    res.status(500).json({ message: 'Failed to add visual reference', code: 'SERVER_ERROR' });
  }
});

// Delete visual reference
router.delete('/:sceneId/visual-references/:refId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.sceneId) as DbScene | undefined;

    if (!scene) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    if (!checkStoryboardAccess(scene.storyboard_id, req.userId, true)) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    db.prepare('DELETE FROM visual_references WHERE id = ? AND scene_id = ?').run(req.params.refId, req.params.sceneId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete visual reference error:', error);
    res.status(500).json({ message: 'Failed to delete visual reference', code: 'SERVER_ERROR' });
  }
});

export default router;
