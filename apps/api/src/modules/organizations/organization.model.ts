import { Schema, model } from 'mongoose';
const organizationSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 140 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 64 },
  status: { type: String, enum: ['active', 'suspended'], default: 'active', required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true }
}, { timestamps: true, versionKey: false });
export const Organization = model('Organization', organizationSchema);
