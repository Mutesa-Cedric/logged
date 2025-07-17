import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  clerkId?: string;
  user?: any;
  isGuest?: boolean;
}

const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('🔍 Auth middleware - received headers:', {
      authHeader,
      url: req.url,
      method: req.method,
      hasAuth: !!authHeader
    });

    // Check for guest token
    if (authHeader === 'Bearer guest-token') {
      console.log('🔓 Guest user detected');
      req.clerkId = 'guest-user';
      req.isGuest = true;
      return next();
    }

    // Check if authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth failed: No authorization header or invalid format');
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' });
    }

    // For now, we'll extract the Clerk user ID from the token
    // In a production app, you'd verify the token with Clerk's API
    try {
      // Simple token parsing - in production, verify with Clerk
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      if (payload.sub) {
        req.clerkId = payload.sub;
        req.isGuest = false;
        next();
      } else {
        return res.status(401).json({ message: 'Unauthorized - Invalid token payload' });
      }
    } catch (error) {
      // If token parsing fails, allow unauthenticated access for demo
      // In production, this should be a 401 error
      console.warn('Token parsing failed, allowing unauthenticated access for demo');
      req.clerkId = 'demo-user'; // Demo user ID
      req.isGuest = false;
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware that requires authenticated (non-guest) users
const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  await isAuthenticated(req, res, () => {
    if (req.isGuest) {
      return res.status(401).json({
        message: 'This feature requires an account. Please sign up or sign in.',
        guestNotAllowed: true
      });
    }
    next();
  });
};

export { AuthenticatedRequest };
export default isAuthenticated;
export { requireAuth };
