export const ROLE_PERMISSIONS = {
  owner: ['organization:read', 'organization:write', 'members:read', 'members:write'],
  admin: ['organization:read', 'organization:write', 'members:read', 'members:write'],
  csm_manager: ['organization:read', 'members:read', 'members:write', 'customers:read', 'customers:write', 'dashboards:read'],
  csm: ['organization:read', 'members:read', 'customers:read', 'customers:write', 'dashboards:read'],
  analyst: ['organization:read', 'members:read', 'customers:read', 'dashboards:read'],
  viewer: ['organization:read', 'members:read', 'dashboards:read']
} as const;
export type OrganizationRole = keyof typeof ROLE_PERMISSIONS;
export type OrganizationPermission = typeof ROLE_PERMISSIONS[OrganizationRole][number];
export function hasPermission(role: string, permission: string): boolean {
  return role in ROLE_PERMISSIONS && (ROLE_PERMISSIONS as Record<string, readonly string[]>)[role]?.includes(permission) === true;
}
export function canAssignRole(actorRole: string, targetRole: string): boolean {
  if (targetRole === 'owner') return false;
  if (targetRole === 'admin') return actorRole === 'owner';
  return actorRole === 'owner' || actorRole === 'admin';
}
