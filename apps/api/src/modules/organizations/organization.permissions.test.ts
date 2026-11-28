import { describe, expect, it } from 'vitest';
import { canAssignRole, hasPermission } from './permissions.js';
import { addMemberSchema, createOrganizationSchema, updateMemberRoleSchema } from './organization.schemas.js';

describe('Nexora organization permission matrix', () => {
  it('grants organization and membership administration to owners and admins', () => {
    expect(hasPermission('owner', 'organization:write')).toBe(true);
    expect(hasPermission('admin', 'members:write')).toBe(true);
    expect(hasPermission('viewer', 'members:write')).toBe(false);
  });
  it('keeps customer writes away from analyst and viewer roles', () => {
    expect(hasPermission('csm', 'customers:write')).toBe(true);
    expect(hasPermission('csm_manager', 'customers:write')).toBe(true);
    expect(hasPermission('analyst', 'customers:write')).toBe(false);
    expect(hasPermission('viewer', 'customers:read')).toBe(false);
  });
  it('prevents admin members from granting admin or owner access', () => {
    expect(canAssignRole('owner', 'admin')).toBe(true);
    expect(canAssignRole('admin', 'admin')).toBe(false);
    expect(canAssignRole('owner', 'owner')).toBe(false);
  });
});

describe('Nexora organization request contracts', () => {
  it('normalizes organization names and rejects extra client-controlled fields', () => {
    expect(createOrganizationSchema.parse({ name: '  Northstar Customer Success  ' }).name).toBe('Northstar Customer Success');
    expect(createOrganizationSchema.safeParse({ name: 'A', createdBy: 'attacker' }).success).toBe(false);
  });
  it('normalizes member email and rejects owner role assignment', () => {
    const parsed = addMemberSchema.parse({ email: ' MEMBER@EXAMPLE.COM ', role: 'csm' });
    expect(parsed.email).toBe('member@example.com');
    expect(addMemberSchema.safeParse({ email: 'owner@example.com', role: 'owner' }).success).toBe(false);
    expect(updateMemberRoleSchema.safeParse({ role: 'owner' }).success).toBe(false);
  });
});
