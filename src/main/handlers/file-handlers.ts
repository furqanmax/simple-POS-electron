import { IpcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export function registerFileHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('files:selectFile', async (_, filters?: Array<{ name: string; extensions: string[] }>): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  ipcMain.handle('files:selectDirectory', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  ipcMain.handle('files:uploadImage', async (_, sourcePath: string, templateId: number): Promise<string> => {
    if (!fs.existsSync(sourcePath)) {
      throw new Error('Source file not found');
    }
    
    // Create uploads directory
    const userDataPath = app.getPath('userData');
    const uploadsDir = path.join(userDataPath, 'uploads', 'templates', String(templateId));
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate unique filename
    const ext = path.extname(sourcePath);
    const filename = `${Date.now()}${ext}`;
    const destPath = path.join(uploadsDir, filename);
    
    // Copy file
    fs.copyFileSync(sourcePath, destPath);
    
    return destPath;
  });
}
