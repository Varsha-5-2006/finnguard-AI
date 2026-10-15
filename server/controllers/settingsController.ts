import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { AuthenticatedRequest, logAuditEvent } from '../middleware/auth.js';
import { User, UserRole } from '../types/index.js';

export class SettingsController {
  public static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = db.getSettings();
      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve settings: ' + err.message });
    }
  }

  public static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const updates = req.body;
      const updated = db.updateSettings(updates);
      logAuditEvent(
        req,
        'UPDATE_SYSTEM_SETTINGS',
        'setting',
        'global',
        `System settings updated by ${req.user?.name}.`
      );
      res.json({ settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update settings: ' + err.message });
    }
  }

  public static async listRules(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const rules = db.getRules();
      res.json({ rules });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to list rules: ' + err.message });
    }
  }

  public static async updateRule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = db.updateRule(id, updates);

      if (!updated) {
        res.status(404).json({ error: 'Rule not found' });
        return;
      }

      logAuditEvent(
        req,
        'UPDATE_DETECTION_RULE',
        'setting',
        updated.id,
        `Rule ${updated.code} modified: weight=${updated.weight}, enabled=${updated.isEnabled}.`
      );

      res.json({ rule: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update rule: ' + err.message });
    }
  }

  public static async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = db.getUsers().map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        title: u.title,
        status: u.status,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
      }));
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to list users: ' + err.message });
    }
  }

  public static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role, status, title } = req.body;

      const target = db.findUserById(id);
      if (!target) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const updates: Partial<User> = {};
      if (role) updates.role = role as UserRole;
      if (status) updates.status = status;
      if (title) updates.title = title;

      const updated = db.updateUser(id, updates);

      logAuditEvent(
        req,
        'UPDATE_USER_ACCOUNT',
        'user',
        id,
        `Modified user account for ${target.name} (${target.email}). Role: ${updated?.role}, Status: ${updated?.status}.`
      );

      res.json({ user: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update user: ' + err.message });
    }
  }

  public static async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, role = 'analyst', title } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
      }

      const existing = db.findUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        email,
        passwordHash,
        role: role as UserRole,
        title: title || 'Risk Analyst',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      db.addUser(newUser);

      logAuditEvent(
        req,
        'ADMIN_CREATE_USER',
        'user',
        newUser.id,
        `Admin created new user ${newUser.name} with role ${newUser.role}.`
      );

      res.status(201).json({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          title: newUser.title,
          status: newUser.status,
          createdAt: newUser.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create user: ' + err.message });
    }
  }

  public static async resetDemo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      db.resetDemoData();
      logAuditEvent(
        req,
        'RESET_DEMO_DATA',
        'setting',
        'database',
        'Database reset to initial demo seeds.'
      );
      res.json({ message: 'Database reset to initial demo state successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to reset demo database: ' + err.message });
    }
  }

  public static async listNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const notifications = db.getNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      res.json({ notifications, unreadCount });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch notifications: ' + err.message });
    }
  }

  public static async markNotificationRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      db.markNotificationRead(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark notification read: ' + err.message });
    }
  }

  public static async markAllNotificationsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      db.markAllNotificationsRead();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to mark all notifications read: ' + err.message });
    }
  }
}
