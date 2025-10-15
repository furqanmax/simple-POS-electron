import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { Settings } from '../../shared/types';
import { getCurrentUser } from './auth-handlers';

function checkAdmin(): void {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

export function registerSettingsHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('settings:get', async (): Promise<Settings> => {
    const db = dbManager.getDB();
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get() as any;
    
    if (!settings) {
      // Return defaults
      return {
        id: 1,
        default_currency: 'INR',
        locale: 'en_IN',
        tax_enabled: false,
        default_bill_size: 'A4',
        default_bill_layout: 'Classic',
        per_size_margins_json: undefined,
        font_scale_override: undefined,
        theme: 'light'
      };
    }
    
    return {
      ...settings,
      tax_enabled: settings.tax_enabled === 1
    };
  });

  ipcMain.handle('settings:update', async (_, updates: Partial<Settings>): Promise<void> => {
    checkAdmin();
    const db = dbManager.getDB();
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.default_currency !== undefined) {
      fields.push('default_currency = ?');
      values.push(updates.default_currency);
    }
    if (updates.locale !== undefined) {
      fields.push('locale = ?');
      values.push(updates.locale);
    }
    if (updates.tax_enabled !== undefined) {
      fields.push('tax_enabled = ?');
      values.push(updates.tax_enabled ? 1 : 0);
    }
    if (updates.default_bill_size !== undefined) {
      fields.push('default_bill_size = ?');
      values.push(updates.default_bill_size);
    }
    if (updates.default_bill_layout !== undefined) {
      fields.push('default_bill_layout = ?');
      values.push(updates.default_bill_layout);
    }
    if (updates.per_size_margins_json !== undefined) {
      fields.push('per_size_margins_json = ?');
      values.push(updates.per_size_margins_json);
    }
    if (updates.font_scale_override !== undefined) {
      fields.push('font_scale_override = ?');
      values.push(updates.font_scale_override);
    }
    if (updates.theme !== undefined) {
      fields.push('theme = ?');
      values.push(updates.theme);
    }
    
    if (fields.length === 0) return;
    
    db.prepare(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`).run(...values);
  });
}
