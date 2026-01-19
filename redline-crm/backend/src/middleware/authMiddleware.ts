import { Request, Response, NextFunction } from 'express';
import { createClerkClient } from '@clerk/clerk-sdk-node';

// Initialize Clerk client
const clerk = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY 
});

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
      userName?: string;
    }
  }
}

/**
 * Middleware to require authentication using Clerk
 * Extracts user ID from Bearer token and attaches to request
 */
export async function requireAuth(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid token format'
      });
      return;
    }

    // Verify the token with Clerk
    const verifiedToken = await clerk.verifyToken(token);

    if (!verifiedToken || !verifiedToken.sub) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid token'
      });
      return;
    }

    // Attach user info to request
    req.userId = verifiedToken.sub;

    // Optionally get more user details
    try {
      const user = await clerk.users.getUser(verifiedToken.sub);
      req.userEmail = user.emailAddresses[0]?.emailAddress;
      req.userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
    } catch (e) {
      // User details are optional, continue without them
      console.warn('Could not fetch user details:', e);
    }

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    
    // Check for specific Clerk errors
    if (error.status === 401 || error.message?.includes('expired')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Token expired or invalid'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token, just attaches userId if available
 */
export async function optionalAuth(
  req: Request, 
  _res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        try {
          const verifiedToken = await clerk.verifyToken(token);
          if (verifiedToken?.sub) {
            req.userId = verifiedToken.sub;
          }
        } catch (e) {
          // Token invalid, but continue without user
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
}

export default { requireAuth, optionalAuth };
