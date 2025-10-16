import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { Permission, PermissionAuditLog, UserWithRoles, UserPermissionOverride } from '../../shared/types';
import { getCurrentUser } from './auth-handlers';
import { checkUserPermission } from './role-handlers';

export function registerPermissionHandlers(ipcMain: IpcMain): void {
  // Get all permissions
  ipcMain.handle('permissions:getAll', async (): Promise<Permission[]> => {
    const db = dbManager.getDB();
    const permissions = db.prepare(`
      SELECT id, resource, action, description, created_at
      FROM permissions
      ORDER BY resource, action
    `).all() as any[];
    
    return permissions;
  });
  
  // Get permission by ID
  ipcMain.handle('permissions:getById', async (_, id: number): Promise<Permission | null> => {
    const db = dbManager.getDB();
    const permission = db.prepare(`
      SELECT id, resource, action, description, created_at
      FROM permissions
      WHERE id = ?
    `).get(id) as any;
    
    return permission || null;
  });
  
  // Get permissions by resource
  ipcMain.handle('permissions:getByResource', async (_, resource: string): Promise<Permission[]> => {
    const db = dbManager.getDB();
    const permissions = db.prepare(`
      SELECT id, resource, action, description, created_at
      FROM permissions
      WHERE resource = ?
      ORDER BY action
    `).all(resource) as any[];
    
    return permissions;
  });
  
  // Check if user has specific permission
  ipcMain.handle('permissions:checkPermission', async (_, userId: number, resource: string, action: string): Promise<boolean> => {
    return checkUserPermission(userId, resource, action);
  });
  
  // Get user with all roles and permissions
  ipcMain.handle('users:getUserWithRoles', async (_, userId: number): Promise<UserWithRoles | null> => {
    const db = dbManager.getDB();
    
    // Get user basic info
    const user = db.prepare(`
      SELECT id, username, role, active, created_at
      FROM users
      WHERE id = ?
    `).get(userId) as any;
    
    if (!user) return null;
    
    // Get user's roles
    const roles = db.prepare(`
      SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY r.name
    `).all(userId) as any[];
    
    // Get all permissions through roles
    const rolePermissions = db.prepare(`
      SELECT DISTINCT p.id, p.resource, p.action, p.description, p.created_at
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY p.resource, p.action
    `).all(userId) as any[];
    
    // Get user permission overrides
    const overrides = db.prepare(`
      SELECT up.id, up.user_id, up.permission_id, up.granted, up.created_at,
             p.resource, p.action, p.description
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = ?
      ORDER BY p.resource, p.action
    `).all(userId) as any[];
    
    const permissionOverrides: UserPermissionOverride[] = overrides.map(o => ({
      id: o.id,
      user_id: o.user_id,
      permission_id: o.permission_id,
      granted: o.granted === 1,
      created_at: o.created_at,
      permission: {
        id: o.permission_id,
        resource: o.resource,
        action: o.action,
        description: o.description,
        created_at: o.created_at
      }
    }));
    
    // Calculate effective permissions (role permissions + granted overrides - revoked overrides)
    const effectivePermissions = new Map<string, Permission>();
    
    // Add role permissions
    for (const perm of rolePermissions) {
      effectivePermissions.set(`${perm.resource}:${perm.action}`, perm);
    }
    
    // Apply overrides
    for (const override of permissionOverrides) {
      const key = `${override.permission!.resource}:${override.permission!.action}`;
      if (override.granted) {
        effectivePermissions.set(key, override.permission!);
      } else {
        effectivePermissions.delete(key);
      }
    }
    
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      active: user.active === 1,
      created_at: user.created_at,
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        is_system: r.is_system === 1,
        created_at: r.created_at,
        updated_at: r.updated_at
      })),
      permissions: Array.from(effectivePermissions.values()),
      permission_overrides: permissionOverrides
    };
  });
  
  // Assign role to user
  ipcMain.handle('users:assignRole', async (_, userId: number, roleId: number): Promise<void> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    const hasPermission = await checkUserPermission(currentUser.id, 'users', 'manage_roles');
    if (!hasPermission) {
      throw new Error('Unauthorized: Cannot manage user roles');
    }
    
    const db = dbManager.getDB();
    
    // Verify user exists
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify role exists
    const role = db.prepare('SELECT name FROM roles WHERE id = ?').get(roleId) as any;
    if (!role) {
      throw new Error('Role not found');
    }
    
    // Check if already assigned
    const existing = db.prepare('SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?').get(userId, roleId) as any;
    if (existing) {
      return; // Already assigned
    }
    
    db.prepare('INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)').run(userId, roleId, currentUser.id);
    
    // Log audit
    db.prepare(`
      INSERT INTO permission_audit_log (user_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(currentUser.id, 'assign_role', 'user', userId, JSON.stringify({ role: role.name, username: user.username }));
  });
  
  // Remove role from user
  ipcMain.handle('users:removeRole', async (_, userId: number, roleId: number): Promise<void> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    const hasPermission = await checkUserPermission(currentUser.id, 'users', 'manage_roles');
    if (!hasPermission) {
      throw new Error('Unauthorized: Cannot manage user roles');
    }
    
    const db = dbManager.getDB();
    
    // Get role name for audit
    const role = db.prepare('SELECT name FROM roles WHERE id = ?').get(roleId) as any;
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
    
    // Ensure user has at least one role remaining
    const roleCount = db.prepare('SELECT COUNT(*) as count FROM user_roles WHERE user_id = ?').get(userId) as any;
    if (roleCount.count <= 1) {
      throw new Error('User must have at least one role');
    }
    
    db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?').run(userId, roleId);
    
    // Log audit
    if (role && user) {
      db.prepare(`
        INSERT INTO permission_audit_log (user_id, action, target_type, target_id, details_json)
        VALUES (?, ?, ?, ?, ?)
      `).run(currentUser.id, 'remove_role', 'user', userId, JSON.stringify({ role: role.name, username: user.username }));
    }
  });
  
  // Get user's effective permissions
  ipcMain.handle('users:getUserPermissions', async (_, userId: number): Promise<Permission[]> => {
    const db = dbManager.getDB();
    
    // Get all permissions through roles
    const rolePermissions = db.prepare(`
      SELECT DISTINCT p.id, p.resource, p.action, p.description, p.created_at
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `).all(userId) as any[];
    
    // Get granted permission overrides
    const grantedOverrides = db.prepare(`
      SELECT p.id, p.resource, p.action, p.description, p.created_at
      FROM permissions p
      JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = ? AND up.granted = 1
    `).all(userId) as any[];
    
    // Get revoked permission overrides
    const revokedIds = db.prepare(`
      SELECT permission_id
      FROM user_permissions
      WHERE user_id = ? AND granted = 0
    `).all(userId).map((r: any) => r.permission_id);
    
    // Combine permissions
    const permissionMap = new Map<number, Permission>();
    
    // Add role permissions
    for (const perm of rolePermissions) {
      if (!revokedIds.includes(perm.id)) {
        permissionMap.set(perm.id, perm);
      }
    }
    
    // Add granted overrides
    for (const perm of grantedOverrides) {
      permissionMap.set(perm.id, perm);
    }
    
    return Array.from(permissionMap.values());
  });
  
  // Check if user has specific permission
  ipcMain.handle('users:hasPermission', async (_, userId: number, resource: string, action: string): Promise<boolean> => {
    return checkUserPermission(userId, resource, action);
  });
  
  // Grant specific permission to user
  ipcMain.handle('users:grantPermission', async (_, userId: number, permissionId: number): Promise<void> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    const hasPermission = await checkUserPermission(currentUser.id, 'users', 'manage_roles');
    if (!hasPermission) {
      throw new Error('Unauthorized: Cannot manage user permissions');
    }
    
    const db = dbManager.getDB();
    
    // Verify user and permission exist
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
    const permission = db.prepare('SELECT resource, action FROM permissions WHERE id = ?').get(permissionId) as any;
    
    if (!user) throw new Error('User not found');
    if (!permission) throw new Error('Permission not found');
    
    // Insert or update permission override
    db.prepare(`
      INSERT INTO user_permissions (user_id, permission_id, granted)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, permission_id) DO UPDATE SET granted = 1
    `).run(userId, permissionId);
    
    // Log audit
    db.prepare(`
      INSERT INTO permission_audit_log (user_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(currentUser.id, 'grant_permission', 'user', userId, JSON.stringify({ 
      permission: `${permission.resource}:${permission.action}`,
      username: user.username 
    }));
  });
  
  // Revoke specific permission from user
  ipcMain.handle('users:revokePermission', async (_, userId: number, permissionId: number): Promise<void> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    const hasPermission = await checkUserPermission(currentUser.id, 'users', 'manage_roles');
    if (!hasPermission) {
      throw new Error('Unauthorized: Cannot manage user permissions');
    }
    
    const db = dbManager.getDB();
    
    // Verify user and permission exist
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
    const permission = db.prepare('SELECT resource, action FROM permissions WHERE id = ?').get(permissionId) as any;
    
    if (!user) throw new Error('User not found');
    if (!permission) throw new Error('Permission not found');
    
    // Insert or update permission override
    db.prepare(`
      INSERT INTO user_permissions (user_id, permission_id, granted)
      VALUES (?, ?, 0)
      ON CONFLICT(user_id, permission_id) DO UPDATE SET granted = 0
    `).run(userId, permissionId);
    
    // Log audit
    db.prepare(`
      INSERT INTO permission_audit_log (user_id, action, target_type, target_id, details_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(currentUser.id, 'revoke_permission', 'user', userId, JSON.stringify({ 
      permission: `${permission.resource}:${permission.action}`,
      username: user.username 
    }));
  });
  
  // Get permission audit log
  ipcMain.handle('permissions:getAuditLog', async (_, filters?: { userId?: number; startDate?: string; endDate?: string }): Promise<PermissionAuditLog[]> => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    const hasPermission = await checkUserPermission(currentUser.id, 'roles', 'read');
    if (!hasPermission) {
      throw new Error('Unauthorized: Cannot view audit log');
    }
    
    const db = dbManager.getDB();
    let query = `
      SELECT pal.*, u.username as actor_username
      FROM permission_audit_log pal
      JOIN users u ON pal.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (filters?.userId) {
      query += ' AND pal.user_id = ?';
      params.push(filters.userId);
    }
    
    if (filters?.startDate) {
      query += ' AND pal.created_at >= ?';
      params.push(filters.startDate);
    }
    
    if (filters?.endDate) {
      query += ' AND pal.created_at <= ?';
      params.push(filters.endDate);
    }
    
    query += ' ORDER BY pal.created_at DESC LIMIT 1000';
    
    const logs = db.prepare(query).all(...params) as any[];
    
    return logs.map(log => ({
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      target_type: log.target_type,
      target_id: log.target_id,
      details_json: log.details_json,
      created_at: log.created_at
    }));
  });
}
