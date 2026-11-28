import { Schema, model } from 'mongoose';
export const ORGANIZATION_ROLES = ['owner', 'admin', 'csm_manager', 'csm', 'analyst', 'viewer'] as const;
const membershipSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, immutable: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  role: { type: String, enum: ORGANIZATION_ROLES, required: true },
  status: { type: String, enum: ['active', 'suspended', 'removed'], default: 'active', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true }
}, { timestamps: true, versionKey: false });
membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ organizationId: 1, role: 1, status: 1 });
export const Membership = model('Membership', membershipSchema);
