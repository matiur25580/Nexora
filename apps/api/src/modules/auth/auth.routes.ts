import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { User } from './user.model.js';
import { Session } from './session.model.js';
import { registerSchema, loginSchema } from './auth.schemas.js';
import { hashPassword, verifyPassword } from './password.js';
import { createAccessToken, createRefreshToken, hashRefreshToken } from './tokens.js';
import { clearRefreshCookie, refreshCookieName, setRefreshCookie } from './refresh-cookie.js';
import { requireAuth } from './auth.middleware.js';
import { Membership } from '../organizations/membership.model.js';
import '../organizations/organization.model.js';

export const authRouter = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });
const sessionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false });
const cookieValue = (header: string | undefined, name: string): string | undefined => {
  const entry = header?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!entry) return undefined;
  try { return decodeURIComponent(entry.slice(name.length + 1)); } catch { return undefined; }
};
const publicUser = (user: { _id: Types.ObjectId; email: string; displayName: string }) => ({
  id: String(user._id), email: user.email, displayName: user.displayName
});
const issueSession = async (userId: Types.ObjectId, req: import('express').Request, res: import('express').Response) => {
  const refreshToken = createRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await Session.create({
    userId, tokenHash: hashRefreshToken(refreshToken), expiresAt,
    userAgent: req.get('user-agent')?.slice(0, 500), ipAddress: req.ip
  });
  setRefreshCookie(res, refreshToken);
  return { accessToken: await createAccessToken(String(userId)), sessionId: session._id };
};

authRouter.post('/register', authLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please check the registration details.', details: parsed.error.flatten().fieldErrors } });
    return;
  }
  const existing = await User.exists({ email: { $eq: String(parsed.data.email) } });
  if (existing) {
    res.status(409).json({ error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with this email already exists.' } });
    return;
  }
  const user = await User.create({
    email: parsed.data.email, displayName: parsed.data.displayName,
    passwordHash: await hashPassword(parsed.data.password)
  });
  const session = await issueSession(user._id, req, res);
  res.status(201).json({ data: { user: publicUser(user), accessToken: session.accessToken } });
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please provide a valid email and password.' } });
    return;
  }
  const user = await User.findOne({ email: { $eq: String(parsed.data.email) } }).select('+passwordHash');
  if (!user || user.status !== 'active' || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
    return;
  }
  user.lastLoginAt = new Date();
  await user.save();
  const session = await issueSession(user._id, req, res);
  res.status(200).json({ data: { user: publicUser(user), accessToken: session.accessToken } });
});

authRouter.post('/refresh', sessionLimiter, async (req, res) => {
  const token = cookieValue(req.headers.cookie, refreshCookieName);
  if (!token) {
    clearRefreshCookie(res);
    res.status(401).json({ error: { code: 'REFRESH_TOKEN_MISSING', message: 'A valid refresh session is required.' } });
    return;
  }
  const oldSession = await Session.findOneAndUpdate(
    { tokenHash: hashRefreshToken(token), revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
    { new: false }
  );
  if (!oldSession) {
    clearRefreshCookie(res);
    res.status(401).json({ error: { code: 'REFRESH_TOKEN_INVALID', message: 'The refresh session is invalid or expired.' } });
    return;
  }
  const user = await User.findOne({ _id: oldSession.userId, status: 'active' });
  if (!user) {
    clearRefreshCookie(res);
    res.status(401).json({ error: { code: 'SESSION_USER_UNAVAILABLE', message: 'The account is not available.' } });
    return;
  }
  const replacement = await issueSession(user._id, req, res);
  await Session.updateOne({ _id: oldSession._id }, { $set: { replacedBySessionId: replacement.sessionId } });
  res.status(200).json({ data: { user: publicUser(user), accessToken: replacement.accessToken } });
});

authRouter.post('/logout', sessionLimiter, async (req, res) => {
  const token = cookieValue(req.headers.cookie, refreshCookieName);
  if (token) {
    await Session.updateOne(
      { tokenHash: hashRefreshToken(token), revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
  clearRefreshCookie(res);
  res.status(200).json({ data: { loggedOut: true } });
});

authRouter.get('/me', sessionLimiter, requireAuth, async (req, res) => {
  const memberships = await Membership.find({ userId: req.authUser!.id, status: 'active' }).populate('organizationId', 'name slug status').lean();
  const organizations = memberships.flatMap(item => { const organization = item.organizationId as unknown as { _id: Types.ObjectId; name: string; slug: string; status: string } | null; return organization?.status === 'active' ? [{ id: String(organization._id), name: organization.name, slug: organization.slug, role: item.role }] : []; });
  res.status(200).json({ data: { user: req.authUser, organizations } });
});
