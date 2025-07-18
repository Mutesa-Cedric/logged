import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  clerkId?: string;
  user?: any;
  isGuest?: boolean;
}

const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader === 'Bearer guest-token') {
      req.clerkId = 'guest-user';
      req.isGuest = true;
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token format' });
    }

    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

      if (payload.sub) {
        req.clerkId = payload.sub;
        req.isGuest = false;
        next();
      } else {
        return res.status(401).json({ message: 'Unauthorized - Invalid token payload' });
      }
    } catch (error) {
      req.clerkId = 'demo-user';
      req.isGuest = false;
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

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
