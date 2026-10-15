import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/database.js';
import { User, UserRole, AuditEvent } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'finguard-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please log in.' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
    const user = db.findUserById(payload.id);

    if (!user) {
      res.status(401).json({ error: 'User account no longer exists.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'User account has been suspended by compliance administrator.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired authentication session.' });
  }
}

export function requireRole(allowedRoles: UserRole | UserRole[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access Denied: Requires one of [${roles.join(', ')}] role. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}

export function logAuditEvent(
  req: AuthenticatedRequest,
  action: string,
  targetEntity: AuditEvent['targetEntity'],
  entityId: string,
  details: string
): void {
  const actor = req.user;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  db.addAuditEvent({
    actorId: actor?.id || 'system_unauthenticated',
    actorName: actor?.name || 'System / Anonymous',
    actorRole: actor?.role || 'system',
    action,
    targetEntity,
    entityId,
    details,
    ipAddress,
  });
}
