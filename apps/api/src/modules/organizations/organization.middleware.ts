import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Membership } from './membership.model.js';
import { Organization } from './organization.model.js';
import { hasPermission } from './permissions.js';
declare global {
  namespace Express {
    interface Request { organizationContext?: { id: string; role: string } }
  }
}
export const requireOrganization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const organizationId = req.params.organizationId;
  if (!req.authUser) { res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' } }); return; }
  if (!organizationId || !mongoose.isValidObjectId(organizationId)) { res.status(400).json({ error: { code: 'INVALID_ORGANIZATION_ID', message: 'A valid organization identifier is required.' } }); return; }
  try {
    const membership = await Membership.findOne({ organizationId, userId: req.authUser.id, status: 'active' }).lean();
    if (!membership) { res.status(404).json({ error: { code: 'ORGANIZATION_NOT_FOUND', message: 'The organization is unavailable.' } }); return; }
    const organization = await Organization.findOne({ _id: organizationId, status: 'active' }).select('_id').lean();
    if (!organization) { res.status(404).json({ error: { code: 'ORGANIZATION_NOT_FOUND', message: 'The organization is unavailable.' } }); return; }
    req.organizationContext = { id: String(organization._id), role: membership.role };
    next();
  } catch (error) { next(error); }
};
export const requirePermission = (permission: string) => (req: Request, res: Response, next: NextFunction): void => {
  if (!req.organizationContext || !hasPermission(req.organizationContext.role, permission)) {
    res.status(403).json({ error: { code: 'INSUFFICIENT_PERMISSION', message: 'Your organization role cannot perform this action.' } });
    return;
  }
  next();
};
