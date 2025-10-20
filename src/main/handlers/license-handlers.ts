import { IpcMain, dialog, app } from 'electron';
import { dbManager } from '../database';
import { LicenseState, LicensePlan } from '../../shared/types';
import { nuvanaLicenseService, NuvanaLicenseInfo } from '../services/nuvana-license-service';
import * as fs from 'fs';
import * as path from 'path';

export function registerLicenseHandlers(ipcMain: IpcMain): void {
  // Get full license information
  ipcMain.handle('license:getInfo', async (): Promise<NuvanaLicenseInfo> => {
    return await nuvanaLicenseService.getLicenseInfo();
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
      const result = await nuvanaLicenseService.activateLicense(licenseKey);
      
      if (result.success) {
        // Force refresh license info
        await nuvanaLicenseService.getLicenseInfo(true);
      }
      
      return result;
    } catch (error: any) {
      return { success: false, message: 'Failed to activate license: ' + error.message };
    }
  });

  // Deactivate license and revert to trial
  ipcMain.handle('license:deactivate', async (): Promise<{ success: boolean; message: string }> => {
    return await nuvanaLicenseService.deactivateLicense();
  });

  // Verify license is valid
  ipcMain.handle('license:verify', async (): Promise<boolean> => {
    const info = await nuvanaLicenseService.getLicenseInfo();
    return info.isValid;
  });

  // Check expiry status
  ipcMain.handle('license:checkExpiry', async (): Promise<{ expired: boolean; daysRemaining: number; graceRemaining: number }> => {
    const info = await nuvanaLicenseService.getLicenseInfo();
    return {
      expired: info.isExpired,
      daysRemaining: info.daysRemaining,
      graceRemaining: info.graceRemaining
    };
  });

  // Check if feature is available
  ipcMain.handle('license:checkFeature', async (_evt, feature: string): Promise<boolean> => {
    return await nuvanaLicenseService.isFeatureAvailable(feature as any);
  });

  // Check usage limits
  ipcMain.handle('license:checkLimit', async (_evt, type: 'users' | 'orders', current: number): Promise<boolean> => {
    return await nuvanaLicenseService.checkLimit(type, current);
  });

  // Issue new license (admin use with Nuvana API)
  ipcMain.handle('license:issueLicense', async (_evt, customerName: string, customerEmail: string, maxActivations: number): Promise<{ success: boolean; licenseKey?: string; message: string }> => {
    return await nuvanaLicenseService.issueLicense(customerName, customerEmail, maxActivations);
  });

  // Export license for support
  ipcMain.handle('license:exportDebug', async (): Promise<void> => {
    const debugInfo = await nuvanaLicenseService.exportDebugInfo();
    
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
        return await nuvanaLicenseService.activateLicense(licenseKey);
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
    const info = await nuvanaLicenseService.getLicenseInfo(true);
    
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

  // Get list of activations for current license
  ipcMain.handle('license:getActivations', async (): Promise<any[]> => {
    return await nuvanaLicenseService.getActivations();
  });

  // Revoke license (admin function)
  ipcMain.handle('license:revoke', async (_evt, licenseKey: string): Promise<{ success: boolean; message: string }> => {
    return await nuvanaLicenseService.revokeLicense(licenseKey);
  });

  // Start trial
  ipcMain.handle('license:startTrial', async (): Promise<void> => {
    nuvanaLicenseService.startTrial();
  });
}
