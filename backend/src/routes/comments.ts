import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

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

function transformComment(comment: DbComment): any {
  return {
    id: comment.id,
    storyboardId: comment.storyboard_id,
    sceneId: comment.scene_id,
    userId: comment.user_id,
    userName: comment.user_name,
    content: comment.content,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at
  };
}

function checkStoryboardAccess(storyboardId: string, userId: string | undefined): boolean {
  const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ?').get(storyboardId) as any;

  if (!storyboard) {
    return false;
  }

  if (storyboard.user_id === userId) {
    return true;
  }

  if (storyboard.is_public) {
    return true;
  }

  if (userId) {
    const collab = db.prepare(`
      SELECT * FROM storyboard_collaborators
      WHERE storyboard_id = ? AND user_id = ?
    `).get(storyboardId, userId);

    if (collab) {
      return true;
    }
  }

  return false;
}

// Get comments for a storyboard
router.get('/storyboard/:storyboardId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!checkStoryboardAccess(req.params.storyboardId, req.userId)) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const comments = db.prepare(`
      SELECT * FROM comments WHERE storyboard_id = ? ORDER BY created_at DESC
    `).all(req.params.storyboardId) as DbComment[];

    res.json(comments.map(transformComment));
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to get comments', code: 'SERVER_ERROR' });
  }
});

// Get comments for a scene
router.get('/scene/:sceneId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const scene = db.prepare('SELECT storyboard_id FROM scenes WHERE id = ?').get(req.params.sceneId) as { storyboard_id: string } | undefined;

    if (!scene) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    if (!checkStoryboardAccess(scene.storyboard_id, req.userId)) {
      return res.status(404).json({ message: 'Scene not found', code: 'NOT_FOUND' });
    }

    const comments = db.prepare(`
      SELECT * FROM comments WHERE scene_id = ? ORDER BY created_at DESC
    `).all(req.params.sceneId) as DbComment[];

    res.json(comments.map(transformComment));
  } catch (error) {
    console.error('Get scene comments error:', error);
    res.status(500).json({ message: 'Failed to get comments', code: 'SERVER_ERROR' });
  }
});

// Create comment
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { storyboardId, sceneId, content } = req.body;

    if (!storyboardId || !content) {
      return res.status(400).json({ message: 'storyboardId and content are required', code: 'MISSING_FIELDS' });
    }

    if (!checkStoryboardAccess(storyboardId, req.userId)) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    // Validate scene if provided
    if (sceneId) {
      const scene = db.prepare('SELECT * FROM scenes WHERE id = ? AND storyboard_id = ?').get(sceneId, storyboardId);
      if (!scene) {
        return res.status(404).json({ message: 'Scene not found', code: 'SCENE_NOT_FOUND' });
      }
    }

    const commentId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO comments (id, storyboard_id, scene_id, user_id, user_name, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(commentId, storyboardId, sceneId || null, req.userId, req.user!.name, content, now, now);

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId) as DbComment;
    res.status(201).json(transformComment(comment));
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Failed to create comment', code: 'SERVER_ERROR' });
  }
});

// Update comment
router.patch('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND user_id = ?').get(req.params.id, req.userId) as DbComment | undefined;

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found', code: 'NOT_FOUND' });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required', code: 'MISSING_CONTENT' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE comments SET content = ?, updated_at = ? WHERE id = ?').run(content, now, req.params.id);

    const updated = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id) as DbComment;
    res.json(transformComment(updated));
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Failed to update comment', code: 'SERVER_ERROR' });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id) as DbComment | undefined;

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found', code: 'NOT_FOUND' });
    }

    // Allow delete if user owns the comment or owns the storyboard
    const storyboard = db.prepare('SELECT user_id FROM storyboards WHERE id = ?').get(comment.storyboard_id) as { user_id: string };

    if (comment.user_id !== req.userId && storyboard.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized', code: 'FORBIDDEN' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment', code: 'SERVER_ERROR' });
  }
});

export default router;
