import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  clerkId?: string;
  user?: any;
}

const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if authorization header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
        next();
      } else {
        return res.status(401).json({ message: 'Unauthorized - Invalid token payload' });
      }
    } catch (error) {
      // If token parsing fails, allow unauthenticated access for demo
      // In production, this should be a 401 error
      console.warn('Token parsing failed, allowing unauthenticated access for demo');
      req.clerkId = 'demo-user'; // Demo user ID
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default isAuthenticated;
export { AuthenticatedRequest };
