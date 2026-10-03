import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'subscribo_jwt_secure_secret_pbl_project_key_2026';

export interface AuthUser {
  user_id: number;
  email: string;
  role: 'customer' | 'user' | 'admin';
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: { user_id: number; email: string; role: string; name: string }): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing or invalid Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
      // Ignore invalid token in optional auth
    }
  }
  next();
}
