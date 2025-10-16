import { getCurrentUser } from '../handlers/auth-handlers';
import { checkUserPermission } from '../handlers/role-handlers';

export interface PermissionRequirement {
  resource: string;
  action: string;
}

/**
 * Permission checking service for enforcing access control
 */
export class PermissionService {
  /**
   * Check if current user has required permission
   * @throws Error if user is not logged in or lacks permission
   */
  static async requirePermission(resource: string, action: string): Promise<void> {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    const hasPermission = await checkUserPermission(user.id, resource, action);
    if (!hasPermission) {
      throw new Error(`Unauthorized: Missing permission ${resource}:${action}`);
    }
  }
  
  /**
   * Check if current user has any of the required permissions
   * @throws Error if user is not logged in or lacks all permissions
   */
  static async requireAnyPermission(requirements: PermissionRequirement[]): Promise<void> {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    for (const req of requirements) {
      const hasPermission = await checkUserPermission(user.id, req.resource, req.action);
      if (hasPermission) {
        return; // User has at least one required permission
      }
    }
    
    const permissionStrings = requirements.map(r => `${r.resource}:${r.action}`).join(', ');
    throw new Error(`Unauthorized: Missing any of the required permissions: ${permissionStrings}`);
  }
  
  /**
   * Check if current user has all of the required permissions
   * @throws Error if user is not logged in or lacks any permission
   */
  static async requireAllPermissions(requirements: PermissionRequirement[]): Promise<void> {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    const missingPermissions: string[] = [];
    
    for (const req of requirements) {
      const hasPermission = await checkUserPermission(user.id, req.resource, req.action);
      if (!hasPermission) {
        missingPermissions.push(`${req.resource}:${req.action}`);
      }
    }
    
    if (missingPermissions.length > 0) {
      throw new Error(`Unauthorized: Missing permissions: ${missingPermissions.join(', ')}`);
    }
  }
  
  /**
   * Check if current user can perform an action, returns boolean instead of throwing
   */
  static async canPerform(resource: string, action: string): Promise<boolean> {
    const user = getCurrentUser();
    if (!user) {
      return false;
    }
    
    return checkUserPermission(user.id, resource, action);
  }
  
  /**
   * Check if current user owns a resource or has override permission
   */
  static async requireOwnershipOrPermission(
    ownerId: number | undefined, 
    resource: string, 
    action: string
  ): Promise<void> {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    // Check if user is the owner
    if (ownerId === user.id) {
      return;
    }
    
    // Check if user has override permission
    const hasPermission = await checkUserPermission(user.id, resource, action);
    if (!hasPermission) {
      throw new Error(`Unauthorized: You don't own this resource and lack ${resource}:${action} permission`);
    }
  }
  
  /**
   * Get current user ID or throw if not logged in
   */
  static requireCurrentUserId(): number {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized: Not logged in');
    }
    return user.id;
  }
  
  /**
   * Check if user is admin
   */
  static async requireAdmin(): Promise<void> {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    // Check if user has admin role or all permissions on users resource
    const hasAdminPermission = await checkUserPermission(user.id, 'users', 'manage_roles');
    if (!hasAdminPermission) {
      throw new Error('Unauthorized: Admin access required');
    }
  }
}
