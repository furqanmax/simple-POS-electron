import { IpcMain, dialog } from 'electron';
import { dbManager } from '../database';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { getCurrentUser } from './auth-handlers';

function checkAdmin(): void {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

export function registerBackupHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('backups:create', async (_, destination?: string): Promise<string> => {
    checkAdmin();
    
    const userDataPath = app.getPath('userData');
    const backupsDir = destination || path.join(userDataPath, 'backups');
    
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsDir, `pos-backup-${timestamp}.db`);
    
    // Backup the database
    dbManager.backup(backupPath);
    
    // Store last backup time in settings
    const db = dbManager.getDB();
    db.prepare(`
      UPDATE settings SET per_size_margins_json = json_set(
        COALESCE(per_size_margins_json, '{}'),
        '$.lastBackup',
        ?
      ) WHERE id = 1
    `).run(new Date().toISOString());
    
    return backupPath;
  });

  ipcMain.handle('backups:restore', async (_, backupPath: string): Promise<void> => {
    checkAdmin();
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }
    
    // Create a pre-restore snapshot
    const userDataPath = app.getPath('userData');
    const snapshotsDir = path.join(userDataPath, 'snapshots');
    if (!fs.existsSync(snapshotsDir)) {
      fs.mkdirSync(snapshotsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = path.join(snapshotsDir, `pre-restore-${timestamp}.db`);
    dbManager.backup(snapshotPath);
    
    // Close current database
    dbManager.close();
    
    // Copy backup to main database location
    const dbPath = path.join(userDataPath, 'pos.db');
    fs.copyFileSync(backupPath, dbPath);
    
    // Reinitialize database
    dbManager.initialize();
  });

  ipcMain.handle('backups:getLastBackupTime', async (): Promise<string | null> => {
    const db = dbManager.getDB();
    const settings = db.prepare('SELECT per_size_margins_json FROM settings WHERE id = 1').get() as any;
    
    if (!settings || !settings.per_size_margins_json) {
      return null;
    }
    
    try {
      const data = JSON.parse(settings.per_size_margins_json);
      return data.lastBackup || null;
    } catch {
      return null;
    }
  });

  ipcMain.handle('backups:vacuum', async (): Promise<void> => {
    checkAdmin();
    dbManager.vacuum();
  });

  ipcMain.handle('backups:analyze', async (): Promise<void> => {
    checkAdmin();
    dbManager.analyze();
  });
}
