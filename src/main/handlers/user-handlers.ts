import { IpcMain } from 'electron';
import * as bcrypt from 'bcrypt';
import { dbManager } from '../database';
import { User, UserRole } from '../../shared/types';
import { getCurrentUser } from './auth-handlers';

function checkAdmin(): void {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

export function registerUserHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('users:getAll', async (): Promise<User[]> => {
    checkAdmin();
    const db = dbManager.getDB();
    const users = db.prepare('SELECT id, username, role, active, created_at FROM users ORDER BY created_at DESC').all() as any[];
    
    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      active: u.active === 1,
      created_at: u.created_at
    }));
  });

  ipcMain.handle('users:getById', async (_, id: number): Promise<User | null> => {
    checkAdmin();
    const db = dbManager.getDB();
    const user = db.prepare('SELECT id, username, role, active, created_at FROM users WHERE id = ?').get(id) as any;
    
    if (!user) return null;
    
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      active: user.active === 1,
      created_at: user.created_at
    };
  });

  ipcMain.handle('users:create', async (_, username: string, password: string, role: UserRole): Promise<User> => {
    checkAdmin();
    const db = dbManager.getDB();
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = db.prepare('INSERT INTO users (username, password_hash, role, active) VALUES (?, ?, ?, 1)').run(username, passwordHash, role);
    
    const user = db.prepare('SELECT id, username, role, active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid) as any;
    
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      active: user.active === 1,
      created_at: user.created_at
    };
  });

  ipcMain.handle('users:update', async (_, id: number, updates: Partial<User>): Promise<void> => {
    checkAdmin();
    const db = dbManager.getDB();
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.username !== undefined) {
      fields.push('username = ?');
      values.push(updates.username);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.active !== undefined) {
      fields.push('active = ?');
      values.push(updates.active ? 1 : 0);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  });

  ipcMain.handle('users:delete', async (_, id: number): Promise<void> => {
    checkAdmin();
    const user = getCurrentUser();
    if (user && user.id === id) {
      throw new Error('Cannot delete your own account');
    }
    
    const db = dbManager.getDB();
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  });
}
