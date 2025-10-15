import { IpcMain, dialog } from 'electron';
import { dbManager } from '../database';
import { InvoiceTemplate, InvoiceAsset } from '../../shared/types';
import { getCurrentUser } from './auth-handlers';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

function checkAdmin(): void {
  const user = getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
}

export function registerTemplateHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('templates:getAll', async (): Promise<InvoiceTemplate[]> => {
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM invoice_templates ORDER BY is_default DESC, created_at DESC').all() as InvoiceTemplate[];
  });

  ipcMain.handle('templates:getById', async (_, id: number): Promise<InvoiceTemplate | null> => {
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM invoice_templates WHERE id = ?').get(id) as InvoiceTemplate | null;
  });

  ipcMain.handle('templates:getDefault', async (): Promise<InvoiceTemplate | null> => {
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM invoice_templates WHERE is_default = 1').get() as InvoiceTemplate | null;
  });

  ipcMain.handle('templates:create', async (_, template: Omit<InvoiceTemplate, 'id' | 'created_at'>): Promise<InvoiceTemplate> => {
    checkAdmin();
    const db = dbManager.getDB();
    
    const result = db.prepare(`
      INSERT INTO invoice_templates (name, is_default, header_json, footer_json, styles_json, preferred_bill_size, preferred_layout)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      template.name,
      template.is_default ? 1 : 0,
      template.header_json,
      template.footer_json,
      template.styles_json,
      template.preferred_bill_size || null,
      template.preferred_layout || null
    );
    
    return db.prepare('SELECT * FROM invoice_templates WHERE id = ?').get(result.lastInsertRowid) as InvoiceTemplate;
  });

  ipcMain.handle('templates:update', async (_, id: number, updates: Partial<InvoiceTemplate>): Promise<void> => {
    checkAdmin();
    const db = dbManager.getDB();
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.header_json !== undefined) {
      fields.push('header_json = ?');
      values.push(updates.header_json);
    }
    if (updates.footer_json !== undefined) {
      fields.push('footer_json = ?');
      values.push(updates.footer_json);
    }
    if (updates.styles_json !== undefined) {
      fields.push('styles_json = ?');
      values.push(updates.styles_json);
    }
    if (updates.preferred_bill_size !== undefined) {
      fields.push('preferred_bill_size = ?');
      values.push(updates.preferred_bill_size);
    }
    if (updates.preferred_layout !== undefined) {
      fields.push('preferred_layout = ?');
      values.push(updates.preferred_layout);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    db.prepare(`UPDATE invoice_templates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  });

  ipcMain.handle('templates:setDefault', async (_, id: number): Promise<void> => {
    checkAdmin();
    const db = dbManager.getDB();
    
    db.transaction(() => {
      db.prepare('UPDATE invoice_templates SET is_default = 0').run();
      db.prepare('UPDATE invoice_templates SET is_default = 1 WHERE id = ?').run(id);
    })();
  });

  ipcMain.handle('templates:delete', async (_, id: number): Promise<void> => {
    checkAdmin();
    const db = dbManager.getDB();
    
    const template = db.prepare('SELECT is_default FROM invoice_templates WHERE id = ?').get(id) as any;
    if (template && template.is_default) {
      throw new Error('Cannot delete default template');
    }
    
    db.prepare('DELETE FROM invoice_templates WHERE id = ?').run(id);
  });

  ipcMain.handle('templates:getAssets', async (_, templateId: number): Promise<InvoiceAsset[]> => {
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM invoice_assets WHERE template_id = ?').all(templateId) as InvoiceAsset[];
  });

  ipcMain.handle('templates:addAsset', async (_, asset: Omit<InvoiceAsset, 'id'>): Promise<InvoiceAsset> => {
    checkAdmin();
    const db = dbManager.getDB();
    
    const result = db.prepare(`
      INSERT INTO invoice_assets (template_id, type, storage_kind, path, blob, meta_json)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      asset.template_id,
      asset.type,
      asset.storage_kind,
      asset.path || null,
      asset.blob || null,
      asset.meta_json
    );
    
    return db.prepare('SELECT * FROM invoice_assets WHERE id = ?').get(result.lastInsertRowid) as InvoiceAsset;
  });

  ipcMain.handle('templates:removeAsset', async (_, assetId: number): Promise<void> => {
    checkAdmin();
    const db = dbManager.getDB();
    db.prepare('DELETE FROM invoice_assets WHERE id = ?').run(assetId);
  });

  // Upload logo for a template
  ipcMain.handle('templates:uploadLogo', async (_, templateId: number): Promise<InvoiceAsset | null> => {
    checkAdmin();
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }
      ]
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    const filePath = result.filePaths[0];
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');
    const fileExt = path.extname(filePath).toLowerCase();
    const mimeType = `image/${fileExt.slice(1).replace('jpg', 'jpeg')}`;
    
    const db = dbManager.getDB();
    
    // Remove existing logo
    db.prepare('DELETE FROM invoice_assets WHERE template_id = ? AND type = ?').run(templateId, 'logo');
    
    // Add new logo
    const insertResult = db.prepare(`
      INSERT INTO invoice_assets (template_id, type, storage_kind, blob, meta_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      templateId,
      'logo',
      'blob',
      base64Data,
      JSON.stringify({ mimeType, fileName: path.basename(filePath) })
    );
    
    return db.prepare('SELECT * FROM invoice_assets WHERE id = ?').get(insertResult.lastInsertRowid) as InvoiceAsset;
  });

  // Generate and add QR code to template
  ipcMain.handle('templates:addQRCode', async (_, templateId: number, qrData: {
    label: string;
    data: string;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    size?: number;
    placement?: { x: number; y: number; width: number; height: number };
  }): Promise<InvoiceAsset> => {
    checkAdmin();
    const db = dbManager.getDB();
    
    // Generate QR code
    const qrOptions = {
      errorCorrectionLevel: qrData.errorCorrectionLevel || 'M',
      width: qrData.size || 200,
      margin: 1
    };
    
    const qrCodeDataUrl = await QRCode.toDataURL(qrData.data, qrOptions);
    const base64Data = qrCodeDataUrl.split(',')[1];
    
    const result = db.prepare(`
      INSERT INTO invoice_assets (template_id, type, storage_kind, blob, meta_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      templateId,
      'qr',
      'blob',
      base64Data,
      JSON.stringify({
        label: qrData.label,
        data: qrData.data,
        errorCorrectionLevel: qrData.errorCorrectionLevel || 'M',
        size: qrData.size || 200,
        placement: qrData.placement || { x: 0, y: 0, width: 100, height: 100 }
      })
    );
    
    return db.prepare('SELECT * FROM invoice_assets WHERE id = ?').get(result.lastInsertRowid) as InvoiceAsset;
  });

  // Update QR code metadata (placement, size, etc.)
  ipcMain.handle('templates:updateAssetMeta', async (_, assetId: number, metaJson: string): Promise<void> => {
    checkAdmin();
    const db = dbManager.getDB();
    db.prepare('UPDATE invoice_assets SET meta_json = ? WHERE id = ?').run(metaJson, assetId);
  });
}
