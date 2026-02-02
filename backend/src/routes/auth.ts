import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required', code: 'MISSING_FIELDS' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters', code: 'PASSWORD_TOO_SHORT' });
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Insert user
    db.prepare(`
      INSERT INTO users (id, email, password, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, email, hashedPassword, name, now, now);

    const token = generateToken(userId);

    res.status(201).json({
      user: { id: userId, email, name, createdAt: now, updatedAt: now },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user', code: 'SERVER_ERROR' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required', code: 'MISSING_FIELDS' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as {
      id: string;
      email: string;
      password: string;
      name: string;
      avatar_url: string | null;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to login', code: 'SERVER_ERROR' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare(`
      SELECT id, email, name, avatar_url, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.userId) as {
      id: string;
      email: string;
      name: string;
      avatar_url: string | null;
      created_at: string;
      updated_at: string;
    } | undefined;

    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user', code: 'SERVER_ERROR' });
  }
});

// Update user
router.patch('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatarUrl } = req.body;
    const now = new Date().toISOString();

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (avatarUrl !== undefined) {
      updates.push('avatar_url = ?');
      params.push(avatarUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided', code: 'NO_UPDATES' });
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(req.userId);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const user = db.prepare(`
      SELECT id, email, name, avatar_url, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.userId) as any;

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user', code: 'SERVER_ERROR' });
  }
});

export default router;
