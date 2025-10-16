import { IpcMain, dialog, app } from 'electron';
import { dbManager } from '../database';
import { LicenseState, LicensePlan } from '../../shared/types';
import { licenseService, LicenseInfo } from '../services/license-service';
import * as fs from 'fs';
import * as path from 'path';

export function registerLicenseHandlers(ipcMain: IpcMain): void {
  // Get full license information
  ipcMain.handle('license:getInfo', async (): Promise<LicenseInfo> => {
    return await licenseService.getLicenseInfo();
  });

  // Get license state (backward compatibility)
  ipcMain.handle('license:getState', async (): Promise<LicenseState | null> => {
    const db = dbManager.getDB();
    const row = db.prepare('SELECT * FROM license_state WHERE id = 1').get() as LicenseState | undefined;
    return row || null;
  });

  // Activate license with new key
  ipcMain.handle('license:activate', async (_evt, licenseKey: string): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await licenseService.activateLicense(licenseKey);
      
      if (result.success) {
        // Force refresh license info
        await licenseService.getLicenseInfo(true);
      }
      
      return result;
    } catch (error: any) {
      return { success: false, message: 'Failed to activate license: ' + error.message };
    }
  });

  // Deactivate license and revert to trial
  ipcMain.handle('license:deactivate', async (): Promise<void> => {
    licenseService.startTrial();
  });

  // Verify license is valid
  ipcMain.handle('license:verify', async (): Promise<boolean> => {
    const info = await licenseService.getLicenseInfo();
    return info.isValid;
  });

  // Check expiry status
  ipcMain.handle('license:checkExpiry', async (): Promise<{ expired: boolean; daysRemaining: number; graceRemaining: number }> => {
    const info = await licenseService.getLicenseInfo();
    return {
      expired: info.isExpired,
      daysRemaining: info.daysRemaining,
      graceRemaining: info.graceRemaining
    };
  });

  // Check if feature is available
  ipcMain.handle('license:checkFeature', async (_evt, feature: string): Promise<boolean> => {
    return await licenseService.isFeatureAvailable(feature as any);
  });

  // Check usage limits
  ipcMain.handle('license:checkLimit', async (_evt, type: 'users' | 'orders', current: number): Promise<boolean> => {
    return await licenseService.checkLimit(type, current);
  });

  // Generate license key (for testing/admin use)
  ipcMain.handle('license:generateKey', async (_evt, email: string, plan: LicensePlan, days: number): Promise<string> => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return licenseService.generateLicenseKey(email, plan, expiryDate);
  });

  // Export license for support
  ipcMain.handle('license:exportDebug', async (): Promise<void> => {
    const debugInfo = await licenseService.exportDebugInfo();
    
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export License Debug Info',
      defaultPath: path.join(app.getPath('desktop'), `license-debug-${Date.now()}.json`),
      filters: [
        { name: 'JSON Files', extensions: ['json'] }
      ]
    });
    
    if (filePath) {
      fs.writeFileSync(filePath, debugInfo);
    }
  });

  // Import license from file
  ipcMain.handle('license:importFromFile', async (): Promise<{ success: boolean; message: string }> => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Import License Key',
      filters: [
        { name: 'License Files', extensions: ['lic', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (filePaths && filePaths.length > 0) {
      try {
        const licenseKey = fs.readFileSync(filePaths[0], 'utf-8').trim();
        return await licenseService.activateLicense(licenseKey);
      } catch (error: any) {
        return { success: false, message: 'Failed to read license file: ' + error.message };
      }
    }
    
    return { success: false, message: 'No file selected' };
  });

  // Check for updates (placeholder for online verification)
  ipcMain.handle('license:checkUpdates', async (): Promise<{ available: boolean; message: string }> => {
    // In production, this would check online for license updates
    // For now, just verify current license
    const info = await licenseService.getLicenseInfo(true);
    
    if (info.daysRemaining > 0 && info.daysRemaining <= 7) {
      return {
        available: true,
        message: `Your license expires in ${info.daysRemaining} days. Please renew soon.`
      };
    }
    
    if (info.isExpired) {
      return {
        available: true,
        message: 'Your license has expired. Please renew to continue using all features.'
      };
    }
    
    return {
      available: false,
      message: 'Your license is up to date.'
    };
  });
}
