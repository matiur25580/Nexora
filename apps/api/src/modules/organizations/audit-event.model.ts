import { Schema, model } from 'mongoose';
const auditEventSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, maxlength: 100 },
  targetType: { type: String, required: true, maxlength: 80 },
  targetId: { type: String, default: null, maxlength: 100 },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true, versionKey: false, strict: true });
auditEventSchema.index({ organizationId: 1, createdAt: -1 });
export const AuditEvent = model('OrganizationAuditEvent', auditEventSchema);
