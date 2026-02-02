import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

interface DbTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  scenes: string;
  is_system: number;
  user_id: string | null;
  created_at: string;
}

function transformTemplate(template: DbTemplate): any {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    type: template.type,
    scenes: JSON.parse(template.scenes),
    isSystem: Boolean(template.is_system),
    userId: template.user_id,
    createdAt: template.created_at
  };
}

// Get all templates (system + user's custom)
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const templates = db.prepare(`
      SELECT * FROM templates
      WHERE is_system = 1 OR user_id = ?
      ORDER BY is_system DESC, created_at DESC
    `).all(req.userId) as DbTemplate[];

    res.json(templates.map(transformTemplate));
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Failed to get templates', code: 'SERVER_ERROR' });
  }
});

// Get single template
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const template = db.prepare(`
      SELECT * FROM templates
      WHERE id = ? AND (is_system = 1 OR user_id = ?)
    `).get(req.params.id, req.userId) as DbTemplate | undefined;

    if (!template) {
      return res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' });
    }

    res.json(transformTemplate(template));
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Failed to get template', code: 'SERVER_ERROR' });
  }
});

// Create custom template from storyboard
router.post('/from-storyboard/:storyboardId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required', code: 'MISSING_NAME' });
    }

    // Check storyboard access
    const storyboard = db.prepare(`
      SELECT * FROM storyboards WHERE id = ? AND user_id = ?
    `).get(req.params.storyboardId, req.userId) as any;

    if (!storyboard) {
      // Check if collaborator with edit access
      const collab = db.prepare(`
        SELECT * FROM storyboard_collaborators
        WHERE storyboard_id = ? AND user_id = ? AND permission = 'edit'
      `).get(req.params.storyboardId, req.userId);

      if (!collab) {
        return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
      }
    }

    // Get scenes from storyboard
    const scenes = db.prepare(`
      SELECT title, description, shot_type, camera_angle, duration, scene_type, location, props, talent
      FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(req.params.storyboardId) as any[];

    const templateScenes = scenes.map(s => ({
      title: s.title,
      description: s.description,
      shotType: s.shot_type,
      cameraAngle: s.camera_angle,
      duration: s.duration,
      sceneType: s.scene_type,
      location: s.location,
      props: JSON.parse(s.props || '[]'),
      talent: JSON.parse(s.talent || '[]')
    }));

    const templateId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO templates (id, name, description, type, scenes, is_system, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      templateId, name, description || '', 'Custom',
      JSON.stringify(templateScenes), 0, req.userId, now
    );

    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId) as DbTemplate;
    res.status(201).json(transformTemplate(template));
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Failed to create template', code: 'SERVER_ERROR' });
  }
});

// Create custom template
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, scenes } = req.body;

    if (!name || !scenes) {
      return res.status(400).json({ message: 'Name and scenes are required', code: 'MISSING_FIELDS' });
    }

    const templateId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO templates (id, name, description, type, scenes, is_system, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      templateId, name, description || '', 'Custom',
      JSON.stringify(scenes), 0, req.userId, now
    );

    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(templateId) as DbTemplate;
    res.status(201).json(transformTemplate(template));
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Failed to create template', code: 'SERVER_ERROR' });
  }
});

// Update custom template
router.patch('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const template = db.prepare(`
      SELECT * FROM templates WHERE id = ? AND user_id = ? AND is_system = 0
    `).get(req.params.id, req.userId) as DbTemplate | undefined;

    if (!template) {
      return res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' });
    }

    const { name, description, scenes } = req.body;
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (scenes !== undefined) {
      updates.push('scenes = ?');
      params.push(JSON.stringify(scenes));
    }

    if (updates.length === 0) {
      return res.json(transformTemplate(template));
    }

    params.push(req.params.id);
    db.prepare(`UPDATE templates SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id) as DbTemplate;
    res.json(transformTemplate(updated));
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Failed to update template', code: 'SERVER_ERROR' });
  }
});

// Delete custom template
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const template = db.prepare(`
      SELECT * FROM templates WHERE id = ? AND user_id = ? AND is_system = 0
    `).get(req.params.id, req.userId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found', code: 'NOT_FOUND' });
    }

    db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Failed to delete template', code: 'SERVER_ERROR' });
  }
});

export default router;
