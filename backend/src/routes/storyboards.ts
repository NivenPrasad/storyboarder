import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { authenticateToken, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

interface DbStoryboard {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_duration: number | null;
  template_type: string | null;
  is_public: number;
  share_link: string | null;
  created_at: string;
  updated_at: string;
}

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

interface DbComment {
  id: string;
  storyboard_id: string;
  scene_id: string | null;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  updated_at: string;
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

function transformStoryboard(storyboard: DbStoryboard, includeScenes = true): any {
  let scenes: any[] = [];
  let comments: any[] = [];

  if (includeScenes) {
    const dbScenes = db.prepare(`
      SELECT * FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(storyboard.id) as DbScene[];
    scenes = dbScenes.map(transformScene);

    const dbComments = db.prepare(`
      SELECT * FROM comments WHERE storyboard_id = ? ORDER BY created_at DESC
    `).all(storyboard.id) as DbComment[];
    comments = dbComments.map(c => ({
      id: c.id,
      storyboardId: c.storyboard_id,
      sceneId: c.scene_id,
      userId: c.user_id,
      userName: c.user_name,
      content: c.content,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }));
  }

  const collaborators = db.prepare(`
    SELECT user_id FROM storyboard_collaborators WHERE storyboard_id = ? AND permission = 'edit'
  `).all(storyboard.id) as { user_id: string }[];

  const viewers = db.prepare(`
    SELECT user_id FROM storyboard_collaborators WHERE storyboard_id = ? AND permission = 'view'
  `).all(storyboard.id) as { user_id: string }[];

  return {
    id: storyboard.id,
    userId: storyboard.user_id,
    title: storyboard.title,
    description: storyboard.description,
    targetDuration: storyboard.target_duration,
    templateType: storyboard.template_type,
    scenes,
    comments,
    isPublic: Boolean(storyboard.is_public),
    shareLink: storyboard.share_link,
    collaborators: collaborators.map(c => c.user_id),
    viewers: viewers.map(v => v.user_id),
    createdAt: storyboard.created_at,
    updatedAt: storyboard.updated_at
  };
}

// Check if user has access to storyboard
function checkAccess(storyboardId: string, userId: string | undefined, requireEdit = false): { allowed: boolean; storyboard?: DbStoryboard } {
  const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ?').get(storyboardId) as DbStoryboard | undefined;

  if (!storyboard) {
    return { allowed: false };
  }

  // Owner has full access
  if (storyboard.user_id === userId) {
    return { allowed: true, storyboard };
  }

  // Check if public (view only)
  if (storyboard.is_public && !requireEdit) {
    return { allowed: true, storyboard };
  }

  // Check collaborator access
  if (userId) {
    const permission = requireEdit ? 'edit' : ['view', 'edit'];
    const collab = db.prepare(`
      SELECT permission FROM storyboard_collaborators
      WHERE storyboard_id = ? AND user_id = ? AND permission IN (${Array.isArray(permission) ? permission.map(() => '?').join(',') : '?'})
    `).get(storyboardId, userId, ...(Array.isArray(permission) ? permission : [permission])) as { permission: string } | undefined;

    if (collab) {
      return { allowed: true, storyboard };
    }
  }

  return { allowed: false };
}

// Get all storyboards for the current user
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const storyboards = db.prepare(`
      SELECT * FROM storyboards WHERE user_id = ? ORDER BY updated_at DESC
    `).all(req.userId) as DbStoryboard[];

    // Also get storyboards shared with user
    const shared = db.prepare(`
      SELECT s.* FROM storyboards s
      JOIN storyboard_collaborators c ON s.id = c.storyboard_id
      WHERE c.user_id = ?
      ORDER BY s.updated_at DESC
    `).all(req.userId) as DbStoryboard[];

    const allStoryboards = [...storyboards, ...shared].map(s => transformStoryboard(s, false));

    res.json(allStoryboards);
  } catch (error) {
    console.error('Get storyboards error:', error);
    res.status(500).json({ message: 'Failed to get storyboards', code: 'SERVER_ERROR' });
  }
});

// Get single storyboard
router.get('/:id', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    res.json(transformStoryboard(storyboard));
  } catch (error) {
    console.error('Get storyboard error:', error);
    res.status(500).json({ message: 'Failed to get storyboard', code: 'SERVER_ERROR' });
  }
});

// Get storyboard by share link
router.get('/shared/:shareLink', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const storyboard = db.prepare('SELECT * FROM storyboards WHERE share_link = ?').get(req.params.shareLink) as DbStoryboard | undefined;

    if (!storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    res.json(transformStoryboard(storyboard));
  } catch (error) {
    console.error('Get shared storyboard error:', error);
    res.status(500).json({ message: 'Failed to get storyboard', code: 'SERVER_ERROR' });
  }
});

// Create storyboard
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, targetDuration, templateId } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required', code: 'MISSING_TITLE' });
    }

    const storyboardId = uuidv4();
    const shareLink = uuidv4();
    const now = new Date().toISOString();

    let templateType: string | null = null;

    // If template is specified, copy scenes from template
    if (templateId) {
      const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId) as { type: string; scenes: string } | undefined;
      if (template) {
        templateType = template.type;
        const templateScenes = JSON.parse(template.scenes);

        // Insert storyboard first
        db.prepare(`
          INSERT INTO storyboards (id, user_id, title, description, target_duration, template_type, share_link, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(storyboardId, req.userId, title, description || null, targetDuration || null, templateType, shareLink, now, now);

        // Insert scenes from template
        const insertScene = db.prepare(`
          INSERT INTO scenes (id, storyboard_id, scene_order, title, description, shot_type, camera_angle, duration, scene_type, location, props, talent, checklist, priority, status, tags, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        templateScenes.forEach((scene: any, index: number) => {
          const sceneId = uuidv4();
          insertScene.run(
            sceneId, storyboardId, index + 1,
            scene.title || `Scene ${index + 1}`,
            scene.description || '',
            scene.shotType || 'Medium Shot',
            scene.cameraAngle || 'Eye Level',
            scene.duration || 30,
            scene.sceneType || 'A-Roll/Main Content',
            scene.location || '',
            JSON.stringify(scene.props || []),
            JSON.stringify(scene.talent || []),
            '[]', 'Medium', 'Not Started', '[]',
            now, now
          );
        });

        const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ?').get(storyboardId) as DbStoryboard;
        return res.status(201).json(transformStoryboard(storyboard));
      }
    }

    // Create empty storyboard
    db.prepare(`
      INSERT INTO storyboards (id, user_id, title, description, target_duration, template_type, share_link, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(storyboardId, req.userId, title, description || null, targetDuration || null, templateType, shareLink, now, now);

    const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ?').get(storyboardId) as DbStoryboard;
    res.status(201).json(transformStoryboard(storyboard));
  } catch (error) {
    console.error('Create storyboard error:', error);
    res.status(500).json({ message: 'Failed to create storyboard', code: 'SERVER_ERROR' });
  }
});

// Update storyboard
router.patch('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId, true);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const { title, description, targetDuration, isPublic } = req.body;
    const now = new Date().toISOString();

    const updates: string[] = [];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (targetDuration !== undefined) {
      updates.push('target_duration = ?');
      params.push(targetDuration);
    }
    if (isPublic !== undefined) {
      updates.push('is_public = ?');
      params.push(isPublic ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.json(transformStoryboard(storyboard));
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(req.params.id);

    db.prepare(`UPDATE storyboards SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM storyboards WHERE id = ?').get(req.params.id) as DbStoryboard;
    res.json(transformStoryboard(updated));
  } catch (error) {
    console.error('Update storyboard error:', error);
    res.status(500).json({ message: 'Failed to update storyboard', code: 'SERVER_ERROR' });
  }
});

// Delete storyboard
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);

    if (!storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    db.prepare('DELETE FROM storyboards WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete storyboard error:', error);
    res.status(500).json({ message: 'Failed to delete storyboard', code: 'SERVER_ERROR' });
  }
});

// Duplicate storyboard
router.post('/:id/duplicate', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const newStoryboardId = uuidv4();
    const shareLink = uuidv4();
    const now = new Date().toISOString();

    // Create new storyboard
    db.prepare(`
      INSERT INTO storyboards (id, user_id, title, description, target_duration, template_type, share_link, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newStoryboardId, req.userId,
      `${storyboard.title} (Copy)`,
      storyboard.description,
      storyboard.target_duration,
      storyboard.template_type,
      shareLink, now, now
    );

    // Copy scenes
    const scenes = db.prepare('SELECT * FROM scenes WHERE storyboard_id = ?').all(req.params.id) as DbScene[];

    const insertScene = db.prepare(`
      INSERT INTO scenes (id, storyboard_id, scene_order, title, description, shot_type, camera_angle, duration, scene_type, location, props, talent, lighting_notes, audio_notes, camera_movement, equipment, time_of_day, dialogue, on_screen_text, director_notes, checklist, priority, status, assigned_to, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const scene of scenes) {
      const newSceneId = uuidv4();
      insertScene.run(
        newSceneId, newStoryboardId, scene.scene_order,
        scene.title, scene.description, scene.shot_type, scene.camera_angle,
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
    }

    const newStoryboard = db.prepare('SELECT * FROM storyboards WHERE id = ?').get(newStoryboardId) as DbStoryboard;
    res.status(201).json(transformStoryboard(newStoryboard));
  } catch (error) {
    console.error('Duplicate storyboard error:', error);
    res.status(500).json({ message: 'Failed to duplicate storyboard', code: 'SERVER_ERROR' });
  }
});

// Share storyboard
router.post('/:id/share', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as DbStoryboard | undefined;

    if (!storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const { email, permission } = req.body;

    if (!email || !permission) {
      return res.status(400).json({ message: 'Email and permission are required', code: 'MISSING_FIELDS' });
    }

    if (!['view', 'edit'].includes(permission)) {
      return res.status(400).json({ message: 'Invalid permission', code: 'INVALID_PERMISSION' });
    }

    // Find user by email
    const targetUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    if (targetUser.id === req.userId) {
      return res.status(400).json({ message: 'Cannot share with yourself', code: 'SELF_SHARE' });
    }

    // Add or update collaborator
    db.prepare(`
      INSERT INTO storyboard_collaborators (id, storyboard_id, user_id, permission, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(storyboard_id, user_id) DO UPDATE SET permission = ?
    `).run(uuidv4(), req.params.id, targetUser.id, permission, new Date().toISOString(), permission);

    res.json({ message: 'Storyboard shared successfully' });
  } catch (error) {
    console.error('Share storyboard error:', error);
    res.status(500).json({ message: 'Failed to share storyboard', code: 'SERVER_ERROR' });
  }
});

// Remove collaborator
router.delete('/:id/share/:userId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);

    if (!storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    db.prepare('DELETE FROM storyboard_collaborators WHERE storyboard_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
    res.status(204).send();
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ message: 'Failed to remove collaborator', code: 'SERVER_ERROR' });
  }
});

// Get storyboard stats
router.get('/:id/stats', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const scenes = db.prepare('SELECT * FROM scenes WHERE storyboard_id = ?').all(req.params.id) as DbScene[];

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    const sceneCount = scenes.length;
    const completedScenes = scenes.filter(s => s.status === 'Completed').length;

    const sceneTypeBreakdown: Record<string, { count: number; duration: number }> = {};
    for (const scene of scenes) {
      if (!sceneTypeBreakdown[scene.scene_type]) {
        sceneTypeBreakdown[scene.scene_type] = { count: 0, duration: 0 };
      }
      sceneTypeBreakdown[scene.scene_type].count++;
      sceneTypeBreakdown[scene.scene_type].duration += scene.duration;
    }

    const targetProgress = storyboard.target_duration
      ? Math.min(100, Math.round((totalDuration / storyboard.target_duration) * 100))
      : 0;

    res.json({
      totalDuration,
      sceneCount,
      sceneTypeBreakdown,
      completedScenes,
      targetProgress
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to get stats', code: 'SERVER_ERROR' });
  }
});

export default router;
