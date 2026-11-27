import type { NextFunction, Request, Response } from 'express';
import { User } from './user.model.js';
import { verifyAccessToken } from './tokens.js';

declare global {
  namespace Express {
    interface Request { authUser?: { id: string; email: string; displayName: string } }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } });
    return;
  }
  try {
    const userId = await verifyAccessToken(header.slice(7));
    const user = await User.findOne({ _id: userId, status: 'active' }).select('email displayName').lean();
    if (!user) {
      res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'The session is no longer valid.' } });
      return;
    }
    req.authUser = { id: String(user._id), email: user.email, displayName: user.displayName };
    next();
  } catch {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'The access token is invalid or expired.' } });
  }
};
