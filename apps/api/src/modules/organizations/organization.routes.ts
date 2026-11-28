import { Router } from 'express';
import { Types } from 'mongoose';
import { requireAuth } from '../auth/auth.middleware.js';
import { User } from '../auth/user.model.js';
import { Organization } from './organization.model.js';
import { Membership } from './membership.model.js';
import { AuditEvent } from './audit-event.model.js';
import { createOrganizationSchema, updateOrganizationSchema, addMemberSchema, updateMemberRoleSchema } from './organization.schemas.js';
import { requireOrganization, requirePermission } from './organization.middleware.js';
import { canAssignRole } from './permissions.js';

export const organizationRouter = Router();
organizationRouter.use(requireAuth);
const actor = (req: import('express').Request) => new Types.ObjectId(req.authUser!.id);
const slugBase = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const audit = (organizationId: Types.ObjectId, actorUserId: Types.ObjectId, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown> = {}) =>
  AuditEvent.create({ organizationId, actorUserId, action, targetType, targetId, metadata });
const duplicate = (error: unknown) => typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
const memberView = (membership: any) => ({
  id: String(membership._id), user: { id: String(membership.userId._id), email: membership.userId.email, displayName: membership.userId.displayName },
  role: membership.role, status: membership.status, joinedAt: membership.createdAt
});

organizationRouter.get('/', async (req, res, next) => {
  try {
    const memberships = await Membership.find({ userId: req.authUser!.id, status: 'active' }).populate('organizationId', 'name slug status').lean();
    const data = memberships.flatMap(item => { const organization = item.organizationId as unknown as { _id: Types.ObjectId; name: string; slug: string; status: string } | null; return organization?.status === 'active' ? [{ id: String(organization._id), name: organization.name, slug: organization.slug, role: item.role }] : []; });
    res.status(200).json({ data });
  } catch (error) { next(error); }
});

organizationRouter.post('/', async (req, res, next) => {
  const parsed = createOrganizationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Organization name must contain 2–140 characters.', details: parsed.error.flatten().fieldErrors } }); return; }
  let organizationId: Types.ObjectId | undefined;
  try {
    const base = slugBase(parsed.data.name) || 'organization';
    let slug = base, suffix = 1;
    while (await Organization.exists({ slug })) slug = `${base}-${suffix++}`;
    const organization = await Organization.create({ name: parsed.data.name, slug, createdBy: actor(req) });
    organizationId = organization._id;
    await Membership.create({ organizationId: organization._id, userId: actor(req), role: 'owner', status: 'active', createdBy: actor(req) });
    await audit(organization._id, actor(req), 'organization.created', 'organization', String(organization._id), { slug });
    res.status(201).json({ data: { id: String(organization._id), name: organization.name, slug: organization.slug, role: 'owner' } });
  } catch (error) {
    if (organizationId) await Promise.all([Membership.deleteMany({ organizationId }), Organization.deleteOne({ _id: organizationId })]).catch(() => undefined);
    if (duplicate(error)) { res.status(409).json({ error: { code: 'ORGANIZATION_CONFLICT', message: 'An organization with this identifier already exists.' } }); return; }
    next(error);
  }
});

organizationRouter.get('/:organizationId', requireOrganization, async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.organizationContext!.id).select('_id name slug status createdAt').lean();
    res.status(200).json({ data: { ...organization, role: req.organizationContext!.role } });
  } catch (error) { next(error); }
});

organizationRouter.patch('/:organizationId', requireOrganization, requirePermission('organization:write'), async (req, res, next) => {
  const parsed = updateOrganizationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Organization name must contain 2–140 characters.' } }); return; }
  try {
    const organization = await Organization.findByIdAndUpdate(req.organizationContext!.id, { $set: { name: parsed.data.name } }, { new: true, runValidators: true }).select('_id name slug status');
    await audit(new Types.ObjectId(req.organizationContext!.id), actor(req), 'organization.updated', 'organization', req.organizationContext!.id, { changedFields: ['name'] });
    res.status(200).json({ data: { ...organization?.toObject(), role: req.organizationContext!.role } });
  } catch (error) { next(error); }
});

organizationRouter.get('/:organizationId/members', requireOrganization, requirePermission('members:read'), async (req, res, next) => {
  try {
    const memberships = await Membership.find({ organizationId: req.organizationContext!.id, status: 'active' })
      .populate('userId', 'email displayName').sort({ createdAt: 1 }).lean();
    res.status(200).json({ data: memberships.map(memberView) });
  } catch (error) { next(error); }
});

organizationRouter.post('/:organizationId/members', requireOrganization, requirePermission('members:write'), async (req, res, next) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid existing user email and assignable role are required.' } }); return; }
  const actorRole = req.organizationContext!.role;
  if (!canAssignRole(actorRole, parsed.data.role)) { res.status(403).json({ error: { code: 'ROLE_GRANT_DENIED', message: 'Only an owner can grant admin access.' } }); return; }
  try {
    const user = await User.findOne({ email: parsed.data.email, status: 'active' }).select('_id email displayName').lean();
    if (!user) { res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'The user must register before being added to this organization.' } }); return; }
    const organizationId = new Types.ObjectId(req.organizationContext!.id);
    const existing = await Membership.findOne({ organizationId, userId: user._id });
    if (existing && existing.status !== 'removed') {
      res.status(409).json({ error: { code: 'MEMBERSHIP_EXISTS', message: 'This user already has an active or suspended membership in the organization.' } }); return;
    }
    const membership = existing
      ? Object.assign(existing, { role: parsed.data.role, status: 'active' as const })
      : await Membership.create({ organizationId, userId: user._id, role: parsed.data.role, status: 'active', createdBy: actor(req) });
    if (existing) await membership.save();
    await audit(organizationId, actor(req), existing ? 'membership.reactivated' : 'membership.created', 'membership', String(membership._id), { role: membership.role, memberUserId: String(user._id) });
    res.status(existing ? 200 : 201).json({ data: { id: String(membership._id), user: { id: String(user._id), email: user.email, displayName: user.displayName }, role: membership.role, status: membership.status } });
  } catch (error) {
    if (duplicate(error)) { res.status(409).json({ error: { code: 'MEMBERSHIP_EXISTS', message: 'This user already has a membership in the organization.' } }); return; }
    next(error);
  }
});

organizationRouter.patch('/:organizationId/members/:membershipId', requireOrganization, requirePermission('members:write'), async (req, res, next) => {
  const parsed = updateMemberRoleSchema.safeParse(req.body);
  const membershipId = String(req.params.membershipId ?? '');
  if (!parsed.success || !Types.ObjectId.isValid(membershipId)) { res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'A valid membership and role are required.' } }); return; }
  if (!canAssignRole(req.organizationContext!.role, parsed.data.role)) { res.status(403).json({ error: { code: 'ROLE_GRANT_DENIED', message: 'Only an owner can grant admin access.' } }); return; }
  try {
    const membership = await Membership.findOne({ _id: membershipId, organizationId: req.organizationContext!.id, status: 'active' });
    if (!membership) { res.status(404).json({ error: { code: 'MEMBERSHIP_NOT_FOUND', message: 'The active membership was not found.' } }); return; }
    if (membership.role === 'owner') { res.status(409).json({ error: { code: 'OWNER_ROLE_PROTECTED', message: 'Owner membership cannot be changed in this milestone.' } }); return; }
    const previousRole = membership.role;
    membership.role = parsed.data.role;
    await membership.save();
    await audit(new Types.ObjectId(req.organizationContext!.id), actor(req), 'membership.role_changed', 'membership', String(membership._id), { previousRole, role: membership.role });
    res.status(200).json({ data: { id: String(membership._id), role: membership.role } });
  } catch (error) { next(error); }
});

organizationRouter.delete('/:organizationId/members/:membershipId', requireOrganization, requirePermission('members:write'), async (req, res, next) => {
  const membershipId = String(req.params.membershipId ?? '');
  if (!Types.ObjectId.isValid(membershipId)) { res.status(400).json({ error: { code: 'INVALID_MEMBERSHIP_ID', message: 'A valid membership identifier is required.' } }); return; }
  try {
    const membership = await Membership.findOne({ _id: req.params.membershipId, organizationId: req.organizationContext!.id, status: 'active' });
    if (!membership) { res.status(404).json({ error: { code: 'MEMBERSHIP_NOT_FOUND', message: 'The active membership was not found.' } }); return; }
    if (membership.role === 'owner') { res.status(409).json({ error: { code: 'OWNER_ROLE_PROTECTED', message: 'The owner cannot be removed until an explicit ownership transfer workflow exists.' } }); return; }
    membership.status = 'removed';
    await membership.save();
    await audit(new Types.ObjectId(req.organizationContext!.id), actor(req), 'membership.removed', 'membership', String(membership._id), { removedUserId: String(membership.userId) });
    res.status(200).json({ data: { removed: true } });
  } catch (error) { next(error); }
});
