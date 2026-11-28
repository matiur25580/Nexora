import { z } from 'zod';
export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(140)
}).strict();
export const updateOrganizationSchema = createOrganizationSchema;
export const addMemberSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  role: z.enum(['admin', 'csm_manager', 'csm', 'analyst', 'viewer'])
}).strict();
export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'csm_manager', 'csm', 'analyst', 'viewer'])
}).strict();
