import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        plan: string;
      };
    }
  }
}

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  plan: string;
  iat: number;
  exp: number;
}

export class SupabaseAuthMiddleware {
  private supabase: SupabaseClient;
  private jwtSecret: string;

  constructor() {
    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    this.jwtSecret = process.env['JWT_SECRET'] || 'fallback-secret';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Authenticate user using JWT token
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ 
          success: false, 
          error: 'No token provided' 
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      // For now, we'll trust our own JWT tokens
      // In production, you might want to verify against a user database

      // Add user info to request
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        plan: decoded.plan
      };

      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({ 
          success: false, 
          error: 'Token expired' 
        });
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid token' 
        });
      } else {
        console.error('Authentication error:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Authentication failed' 
        });
      }
    }
  };

  /**
   * Optional authentication - doesn't fail if no token
   */
  optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without authentication
        next();
        return;
      }

      const token = authHeader.substring(7);
      
      // Try to verify token
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      // Verify user exists in Supabase
      const { data: user, error } = await this.supabase.auth.getUser(token);
      
      if (!error && user.user) {
        // Add user info to request
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          plan: decoded.plan
        };
      }

      next();
    } catch (error) {
      // Token verification failed, continue without authentication
      next();
    }
  };

  /**
   * Check if user has specific role/permission
   */
  requireRole = (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      // For now, we'll use a simple plan-based role system
      // You can extend this to use Supabase RLS policies
      const userPlan = req.user.plan;
      
      if (userPlan === 'admin' || userPlan === requiredRole) {
        next();
      } else {
        res.status(403).json({ 
          success: false, 
          error: 'Insufficient permissions' 
        });
      }
    };
  };

  /**
   * Check if user owns the resource or has admin access
   */
  requireOwnership = (resourceOwnerId: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          error: 'Authentication required' 
        });
        return;
      }

      // Check if user owns the resource or is admin
      if (req.user.id === resourceOwnerId || req.user.plan === 'admin') {
        next();
      } else {
        res.status(403).json({ 
          success: false, 
          error: 'Access denied' 
        });
      }
    };
  };

  /**
   * Generate JWT token for user
   */
  generateToken(user: { id: string; email: string; name: string; plan: string }): string {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Verify Supabase session
   */
  async verifySupabaseSession(sessionToken: string): Promise<{ user: any; error: any }> {
    try {
      const { data, error } = await this.supabase.auth.getUser(sessionToken);
      return { user: data.user, error };
    } catch (error: any) {
      return { user: null, error };
    }
  }
}

export default SupabaseAuthMiddleware;
