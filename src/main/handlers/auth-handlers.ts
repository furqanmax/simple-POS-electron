import { IpcMain } from 'electron';
import * as bcrypt from 'bcrypt';
import { dbManager } from '../database';
import { User } from '../../shared/types';

let currentUser: User | null = null;

export function registerAuthHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('auth:login', async (_, username: string, password: string): Promise<User | null> => {
    console.log('[AUTH] ========== LOGIN ATTEMPT ==========');
    console.log('[AUTH] Username:', username);
    console.log('[AUTH] Password length:', password?.length || 0);
    
    try {
      const db = dbManager.getDB();
      const user = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username) as any;
      
      if (!user) {
        console.log('[AUTH] ✗ User not found or inactive:', username);
        // Check if user exists but is inactive
        const inactiveUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
        if (inactiveUser) {
          console.log('[AUTH] User exists but is inactive');
        } else {
          console.log('[AUTH] User does not exist in database');
        }
        return null;
      }
      
      console.log('[AUTH] ✓ User found in database');
      console.log('[AUTH] User ID:', user.id);
      console.log('[AUTH] User role:', user.role);
      console.log('[AUTH] User active:', user.active);
      console.log('[AUTH] Password hash:', user.password_hash.substring(0, 20) + '...');
      
      console.log('[AUTH] Verifying password with bcrypt...');
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      console.log('[AUTH] Password match result:', passwordMatch);
      
      if (!passwordMatch) {
        console.log('[AUTH] ✗ Password mismatch for user:', username);
        return null;
      }
      
      console.log('[AUTH] ✓ Login successful for user:', username);
      currentUser = {
        id: user.id,
        username: user.username,
        role: user.role,
        active: user.active === 1,
        created_at: user.created_at
      };
      
      console.log('[AUTH] Current user set:', currentUser);
      console.log('[AUTH] ========== LOGIN SUCCESS ==========');
      return currentUser;
    } catch (error) {
      console.error('[AUTH] ✗ Login error:', error);
      return null;
    }
  });

  ipcMain.handle('auth:logout', async (): Promise<void> => {
    currentUser = null;
  });

  ipcMain.handle('auth:getCurrentUser', async (): Promise<User | null> => {
    return currentUser;
  });

  ipcMain.handle('auth:changePassword', async (_, userId: number, oldPassword: string, newPassword: string): Promise<boolean> => {
    const db = dbManager.getDB();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;
    
    if (!user) {
      return false;
    }
    
    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!passwordMatch) {
      return false;
    }
    
    const newHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);
    
    return true;
  });
}

export function getCurrentUser(): User | null {
  return currentUser;
}
