import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromRequest } from '../config/auth';
import { RequestHandler } from '../types';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticateJWT: RequestHandler = (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
      res.status(401).json({ message: 'Authentication token required' });
      return;
    }
    
    const decoded = verifyToken(token);
    req.user = { id: decoded.id };
    
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}; 