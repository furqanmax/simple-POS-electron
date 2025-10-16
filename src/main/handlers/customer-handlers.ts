import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { Customer } from '../../shared/types';
import { PermissionService } from '../services/permission-service';

export function registerCustomerHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('customers:getAll', async (): Promise<Customer[]> => {
    // Check permission to read customers
    await PermissionService.requirePermission('customers', 'read');
    
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all() as Customer[];
  });

  ipcMain.handle('customers:getById', async (_, id: number): Promise<Customer | null> => {
    // Check permission to read customers
    await PermissionService.requirePermission('customers', 'read');
    
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | null;
  });

  ipcMain.handle('customers:search', async (_, query: string): Promise<Customer[]> => {
    // Check permission to read customers
    await PermissionService.requirePermission('customers', 'read');
    
    const db = dbManager.getDB();
    const searchPattern = `%${query}%`;
    return db.prepare('SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? LIMIT 20')
      .all(searchPattern, searchPattern, searchPattern) as Customer[];
  });

  ipcMain.handle('customers:getRecent', async (_, limit: number): Promise<Customer[]> => {
    // Check permission to read customers
    await PermissionService.requirePermission('customers', 'read');
    
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM customers ORDER BY updated_at DESC LIMIT ?').all(limit) as Customer[];
  });

  ipcMain.handle('customers:create', async (_, customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> => {
    // Check permission to create customers
    await PermissionService.requirePermission('customers', 'create');
    
    const db = dbManager.getDB();
    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, gstin, address)
      VALUES (?, ?, ?, ?, ?)
    `).run(customer.name, customer.phone, customer.email, customer.gstin, customer.address);
    
    return db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid) as Customer;
  });

  ipcMain.handle('customers:update', async (_, id: number, updates: Partial<Customer>): Promise<void> => {
    // Check permission to update customers
    await PermissionService.requirePermission('customers', 'update');
    
    const db = dbManager.getDB();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.gstin !== undefined) {
      fields.push('gstin = ?');
      values.push(updates.gstin);
    }
    if (updates.address !== undefined) {
      fields.push('address = ?');
      values.push(updates.address);
    }
    
    if (fields.length === 0) return;
    
    fields.push('updated_at = datetime("now")');
    values.push(id);
    
    db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  });

  ipcMain.handle('customers:delete', async (_, id: number): Promise<void> => {
    // Check permission to delete customers
    await PermissionService.requirePermission('customers', 'delete');
    
    const db = dbManager.getDB();
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  });
}
