# Roles and Permissions System Guide

## Overview
This POS application now includes a comprehensive roles and permissions system that provides fine-grained access control for all features and operations.

## Default Roles

### 1. **Admin** (System Role)
- Full access to all features
- Can manage users, roles, and permissions
- Cannot be deleted or modified
- Default password for admin user: `admin`

### 2. **User** (System Role)
- Standard user with limited access
- Can create and manage orders
- Can view and manage customers
- Cannot access user management or system settings

### 3. **Manager** (Custom Role)
- Elevated permissions for store management
- Can access reports and analytics
- Can manage templates and settings
- Cannot manage users or roles

### 4. **Cashier** (Custom Role)
- Limited to POS operations
- Can create and finalize orders
- Can view customers
- No access to management features

### 5. **Viewer** (Custom Role)
- Read-only access to all features
- Cannot create or modify any data
- Useful for auditors or observers

## Permission Structure

Permissions are organized by resource and action:

### Resources:
- **users** - User management
- **roles** - Role management
- **customers** - Customer management
- **orders** - Order operations
- **payments** - Payment processing
- **installments** - Installment plans
- **templates** - Invoice templates
- **settings** - System settings
- **reports** - Reports and analytics
- **backup** - Backup and restore
- **dashboard** - Dashboard access

### Actions:
- **create** - Create new records
- **read** - View records
- **update** - Modify existing records
- **delete** - Remove records
- **manage_roles** - Assign/remove roles
- **manage_permissions** - Modify permissions
- **view_all** - View all users' data
- **export** - Export data
- **refund** - Process refunds

## Using the System

### Managing Users

1. **Navigate to Users**
   - Click on "Users" in the sidebar
   - Requires `users:read` permission

2. **Create New User**
   - Click "Add User" button
   - Enter username and password
   - Select initial role
   - Requires `users:create` permission

3. **Manage User Permissions**
   - Click "Permissions" button next to user
   - Assign/remove roles
   - Grant/revoke specific permissions
   - Requires `users:manage_roles` permission

### Managing Roles

1. **View Roles**
   - Switch to "Roles" tab in Users section
   - View system and custom roles
   - Requires `roles:read` permission

2. **Create Custom Role**
   - Click "Create Role" button
   - Enter role name and description
   - Requires `roles:create` permission

3. **Configure Role Permissions**
   - Click "Permissions" button next to role
   - Check/uncheck permissions
   - Changes are saved automatically
   - Requires `roles:manage_permissions` permission

### Permission Overrides

Administrators can grant or revoke specific permissions for individual users:

1. **Grant Permission**
   - Gives user a permission they don't have through their roles
   - Useful for temporary access or special cases

2. **Revoke Permission**
   - Removes a permission even if granted by user's roles
   - Useful for restricting specific actions

## Security Features

### Permission Checks
- All API endpoints check permissions before executing
- UI elements are hidden/disabled based on permissions
- Double validation on both client and server

### Audit Logging
- All permission changes are logged
- Track who made changes and when
- View audit log in "Audit Log" tab
- Helps with compliance and troubleshooting

### Best Practices

1. **Principle of Least Privilege**
   - Give users only the permissions they need
   - Use roles for common permission sets
   - Use overrides sparingly

2. **Regular Audits**
   - Review user permissions periodically
   - Check audit log for unauthorized changes
   - Remove inactive users

3. **Role Management**
   - Create custom roles for specific job functions
   - Don't modify system roles
   - Document custom role purposes

4. **Password Security**
   - Change default admin password immediately
   - Enforce strong passwords
   - Regular password rotation

## API Reference

### Permission Check Functions

```typescript
// Check if current user has permission
await PermissionService.requirePermission('resource', 'action');

// Check multiple permissions (ANY)
await PermissionService.requireAnyPermission([
  { resource: 'orders', action: 'create' },
  { resource: 'orders', action: 'update' }
]);

// Check multiple permissions (ALL)
await PermissionService.requireAllPermissions([
  { resource: 'orders', action: 'read' },
  { resource: 'customers', action: 'read' }
]);

// Check ownership or permission
await PermissionService.requireOwnershipOrPermission(
  ownerId,
  'orders',
  'view_all'
);
```

### Database Schema

```sql
-- Main tables
roles                 -- Role definitions
permissions          -- Permission definitions
role_permissions     -- Role-permission mappings
user_roles          -- User-role assignments
user_permissions    -- Permission overrides
permission_audit_log -- Change history

-- Relationships
users -> user_roles -> roles -> role_permissions -> permissions
users -> user_permissions -> permissions
```

## Troubleshooting

### Common Issues

1. **"Unauthorized" Error**
   - User lacks required permission
   - Check user's roles and permissions
   - Review audit log for recent changes

2. **Cannot Delete Role**
   - Role is system role (admin, user)
   - Role has users assigned
   - Remove users from role first

3. **Permission Not Working**
   - Check for revoke overrides
   - Verify role has permission
   - User may need to log out/in

4. **Cannot Assign Role**
   - Insufficient permissions
   - Role doesn't exist
   - User already has role

### Testing

Run the test suite to verify the system:

```bash
node test-roles-permissions.js
```

This tests:
- Role creation and management
- Permission assignment
- User role assignments
- Permission checks
- Edge cases and security
- Performance with large datasets
- Audit logging

## Edge Cases Handled

1. **Circular Dependencies**
   - Prevented by database constraints
   - Unique constraints on junction tables

2. **SQL Injection**
   - All queries use parameterized statements
   - Input validation on all endpoints

3. **Cascade Deletes**
   - Deleting role removes role_permissions
   - Deleting user removes user_roles and user_permissions

4. **Transaction Safety**
   - Bulk operations use transactions
   - Automatic rollback on errors

5. **Performance**
   - Indexed columns for fast lookups
   - Efficient permission check queries
   - Caching of permission checks

## Migration Path

For existing installations:

1. **Backup Database**
   ```bash
   cp pos.db pos.db.backup
   ```

2. **Run Migration**
   - Migration v2 automatically runs on startup
   - Existing users are migrated to new system
   - Legacy 'role' field mapped to new roles

3. **Verify Permissions**
   - Check admin user can log in
   - Verify existing users have appropriate roles
   - Test critical operations

## Support

For issues or questions:
1. Check this guide first
2. Review audit logs
3. Run test suite
4. Check database integrity

## Version History

- **v2.0.0** - Full roles and permissions system
  - Multiple roles per user
  - Permission overrides
  - Audit logging
  - Custom roles
  - UI management

- **v1.0.0** - Basic role system
  - Single role per user
  - Fixed permissions per role
  - No UI management
