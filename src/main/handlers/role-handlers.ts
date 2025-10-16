import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { Role, User, Permission, PermissionAuditLog } from '../../shared/types';
import { getCurrentUser } from './auth-handlers';

// Helper function to check if user has permission
export async function checkUserPermission(userId: number, resource: string, action: string): Promise<boolean> {
  const db = dbManager.getDB();
  
  // Check if user has direct permission override (granted)
  const userPermission = db.prepare(`
    SELECT up.granted
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ? AND p.resource = ? AND p.action = ? AND up.granted = 1
  `).get(userId, resource, action) as any;
  
  if (userPermission) {
    return true;
  }
  
  // Check if user has permission revoked
  const revokedPermission = db.prepare(`
    SELECT up.granted
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = ? AND p.resource = ? AND p.action = ? AND up.granted = 0
  `).get(userId, resource, action) as any;
  
  if (revokedPermission) {
    return false;
  }
  
  // Check role-based permissions
  const rolePermission = db.prepare(`
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = ? AND p.resource = ? AND p.action = ?
  `).get(userId, resource, action) as any;
  
  return !!rolePermission;
}

// Helper function to log permission changes
function logPermissionAudit(userId: number, action: string, targetType: 'role' | 'user' | 'permission', targetId: number, details?: any): void {
  const db = dbManager.getDB();
  db.prepare(`
    INSERT INTO permission_audit_log (user_id, action, target_type, target_id, details_json)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, action, targetType, targetId, details ? JSON.stringify(details) : null);
}

// Check if current user can manage roles
async function checkRoleManagementPermission(): Promise<void> {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: Not logged in');
  }
  
  const hasPermission = await checkUserPermission(user.id, 'roles', 'manage_permissions');
  if (!hasPermission) {
    throw new Error('Unauthorized: Insufficient permissions to manage roles');
  }
}

export function registerRoleHandlers(ipcMain: IpcMain): void {
  // Get all roles
  ipcMain.handle('roles:getAll', async (): Promise<Role[]> => {
    const db = dbManager.getDB();
    const roles = db.prepare(`
      SELECT id, name, description, is_system, created_at, updated_at
      FROM roles
      ORDER BY name
    `).all() as any[];
    
    return roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      is_system: r.is_system === 1,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
  });
  
  // Get role by ID with permissions
  ipcMain.handle('roles:getById', async (_, id: number): Promise<Role | null> => {
    const db = dbManager.getDB();
    const role = db.prepare(`
      SELECT id, name, description, is_system, created_at, updated_at
      FROM roles
      WHERE id = ?
    `).get(id) as any;
    
    if (!role) return null;
    
    // Get permissions for this role
    const permissions = db.prepare(`
      SELECT p.id, p.resource, p.action, p.description, p.created_at
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action
    `).all(id) as any[];
    
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      is_system: role.is_system === 1,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions
    };
  });
  
  // Create new role
  ipcMain.handle('roles:create', async (_, name: string, description: string): Promise<Role> => {
    await checkRoleManagementPermission();
    const user = getCurrentUser()!;
    const db = dbManager.getDB();
    
    // Check if role name already exists
    const existing = db.prepare('SELECT id FROM roles WHERE name = ?').get(name) as any;
    if (existing) {
      throw new Error('Role with this name already exists');
    }
    
    const result = db.prepare(`
      INSERT INTO roles (name, description, is_system)
      VALUES (?, ?, 0)
    `).run(name, description);
    
    logPermissionAudit(user.id, 'create_role', 'role', Number(result.lastInsertRowid), { name, description });
    
    const role = db.prepare(`
      SELECT id, name, description, is_system, created_at, updated_at
      FROM roles
      WHERE id = ?
    `).get(result.lastInsertRowid) as any;
    
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      is_system: role.is_system === 1,
      created_at: role.created_at,
      updated_at: role.updated_at
    };
  });
  
  // Update role
  ipcMain.handle('roles:update', async (_, id: number, updates: Partial<Role>): Promise<void> => {
    await checkRoleManagementPermission();
    const user = getCurrentUser()!;
    const db = dbManager.getDB();
    
    // Check if role exists and is not system role
    const role = db.prepare('SELECT is_system FROM roles WHERE id = ?').get(id) as any;
    if (!role) {
      throw new Error('Role not found');
    }
    if (role.is_system === 1 && (updates.name || updates.description)) {
      throw new Error('Cannot modify system roles');
    }
    
    const fields: string[] = ['updated_at = datetime("now")'];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      // Check if new name already exists
      const existing = db.prepare('SELECT id FROM roles WHERE name = ? AND id != ?').get(updates.name, id) as any;
      if (existing) {
        throw new Error('Role with this name already exists');
      }
      fields.push('name = ?');
      values.push(updates.name);
    }
    
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    
    values.push(id);
    db.prepare(`UPDATE roles SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    
    logPermissionAudit(user.id, 'update_role', 'role', id, updates);
  });
  
  // Delete role
  ipcMain.handle('roles:delete', async (_, id: number): Promise<void> => {
    await checkRoleManagementPermission();
    const user = getCurrentUser()!;
    const db = dbManager.getDB();
    
    // Check if role is system role
    const role = db.prepare('SELECT name, is_system FROM roles WHERE id = ?').get(id) as any;
    if (!role) {
      throw new Error('Role not found');
    }
    if (role.is_system === 1) {
      throw new Error('Cannot delete system roles');
    }
    
    // Check if any users have this role
    const userCount = db.prepare('SELECT COUNT(*) as count FROM user_roles WHERE role_id = ?').get(id) as any;
    if (userCount.count > 0) {
      throw new Error(`Cannot delete role: ${userCount.count} users have this role assigned`);
    }
    
    db.prepare('DELETE FROM roles WHERE id = ?').run(id);
    
    logPermissionAudit(user.id, 'delete_role', 'role', id, { name: role.name });
  });
  
  // Get role permissions
  ipcMain.handle('roles:getRolePermissions', async (_, roleId: number): Promise<Permission[]> => {
    const db = dbManager.getDB();
    const permissions = db.prepare(`
      SELECT p.id, p.resource, p.action, p.description, p.created_at
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.resource, p.action
    `).all(roleId) as any[];
    
    return permissions;
  });
  
  // Assign permission to role
  ipcMain.handle('roles:assignPermission', async (_, roleId: number, permissionId: number): Promise<void> => {
    await checkRoleManagementPermission();
    const user = getCurrentUser()!;
    const db = dbManager.getDB();
    
    // Verify role exists
    const role = db.prepare('SELECT name FROM roles WHERE id = ?').get(roleId) as any;
    if (!role) {
      throw new Error('Role not found');
    }
    
    // Verify permission exists
    const permission = db.prepare('SELECT resource, action FROM permissions WHERE id = ?').get(permissionId) as any;
    if (!permission) {
      throw new Error('Permission not found');
    }
    
    // Check if already assigned
    const existing = db.prepare('SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?').get(roleId, permissionId) as any;
    if (existing) {
      return; // Already assigned
    }
    
    db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)').run(roleId, permissionId);
    
    logPermissionAudit(user.id, 'assign_permission_to_role', 'role', roleId, {
      permission: `${permission.resource}:${permission.action}`
    });
  });
  
  // Remove permission from role
  ipcMain.handle('roles:removePermission', async (_, roleId: number, permissionId: number): Promise<void> => {
    await checkRoleManagementPermission();
    const user = getCurrentUser()!;
    const db = dbManager.getDB();
    
    // Get permission details for audit log
    const permission = db.prepare('SELECT resource, action FROM permissions WHERE id = ?').get(permissionId) as any;
    
    db.prepare('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?').run(roleId, permissionId);
    
    if (permission) {
      logPermissionAudit(user.id, 'remove_permission_from_role', 'role', roleId, {
        permission: `${permission.resource}:${permission.action}`
      });
    }
  });
  
  // Get users with a specific role
  ipcMain.handle('roles:getRoleUsers', async (_, roleId: number): Promise<User[]> => {
    const db = dbManager.getDB();
    const users = db.prepare(`
      SELECT u.id, u.username, u.role, u.active, u.created_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = ?
      ORDER BY u.username
    `).all(roleId) as any[];
    
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      active: u.active === 1,
      created_at: u.created_at
    }));
  });
}
