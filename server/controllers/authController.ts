import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { AuthenticatedRequest, generateToken, logAuditEvent } from '../middleware/auth.js';
import { User, UserRole } from '../types/index.js';

export class AuthController {
  public static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const user = db.findUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (user.status !== 'active') {
        res.status(403).json({ error: 'Account has been suspended. Please contact system administrator.' });
        return;
      }

      // Update last login
      db.updateUser(user.id, { lastLogin: new Date().toISOString() });

      const token = generateToken(user);
      req.user = user;

      logAuditEvent(
        req,
        'USER_LOGIN',
        'auth',
        user.id,
        `User ${user.name} (${user.email}) logged in successfully as ${user.role}.`
      );

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        title: user.title,
        status: user.status,
      };

      res.json({ token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal login error: ' + err.message });
    }
  }

  public static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, title } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Full name, email, and password are required.' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Please enter a valid email address.' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        return;
      }

      const existing = db.findUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
        return;
      }

      // SECURITY: Public registrations are strictly assigned the safe default role 'analyst'.
      // Admin and Compliance privileges must only be granted by an authenticated administrator.
      const assignedRole: UserRole = 'analyst';
      const passwordHash = bcrypt.hashSync(password, 10);

      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: assignedRole,
        title: title?.trim() || 'Fraud Analyst',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      db.addUser(newUser);

      const token = generateToken(newUser);
      req.user = newUser;

      logAuditEvent(
        req,
        'USER_REGISTER',
        'auth',
        newUser.id,
        `New account registered for ${newUser.name} with safe role ${newUser.role}.`
      );

      const safeUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        title: newUser.title,
        status: newUser.status,
      };

      res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: safeUser,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Registration failed: ' + err.message });
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const safeUser = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      title: req.user.title,
      status: req.user.status,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin,
    };

    res.json({ user: safeUser });
  }

  public static async demoLogin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role = 'analyst' } = req.body;
      const targetEmail = role === 'admin'
        ? 'admin@finguard.ai'
        : role === 'compliance'
        ? 'compliance@finguard.ai'
        : 'analyst@finguard.ai';

      const user = db.findUserByEmail(targetEmail);
      if (!user) {
        res.status(404).json({ error: `Demo user for role ${role} not found` });
        return;
      }

      db.updateUser(user.id, { lastLogin: new Date().toISOString() });
      const token = generateToken(user);
      req.user = user;

      logAuditEvent(
        req,
        'DEMO_QUICK_LOGIN',
        'auth',
        user.id,
        `Quick demo login switched to role ${user.role} (${user.name}).`
      );

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        title: user.title,
        status: user.status,
      };

      res.json({ token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: 'Demo login error: ' + err.message });
    }
  }
}
