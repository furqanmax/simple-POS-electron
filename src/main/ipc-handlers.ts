import { ipcMain } from 'electron';
import { registerAuthHandlers } from './handlers/auth-handlers';
import { registerUserHandlers } from './handlers/user-handlers';
import { registerCustomerHandlers } from './handlers/customer-handlers';
import { registerOrderHandlers } from './handlers/order-handlers';
import { registerTemplateHandlers } from './handlers/template-handlers';
import { registerSettingsHandlers } from './handlers/settings-handlers';
import { registerPrintHandlers } from './handlers/print-handlers';
import { registerBackupHandlers } from './handlers/backup-handlers';
import { registerFileHandlers } from './handlers/file-handlers';
import { registerDashboardHandlers } from './handlers/dashboard-handlers';
import { registerInstallmentHandlers } from './handlers/installment-handlers';
import { registerLicenseHandlers } from './handlers/license-handlers';
import { registerPaymentHandlers } from './handlers/payment-handlers';

export function registerIPCHandlers(): void {
  console.log('Registering IPC handlers...');
  
  // Register authentication and user management
  registerAuthHandlers(ipcMain);
  registerUserHandlers(ipcMain);
  registerCustomerHandlers(ipcMain);
  registerOrderHandlers(ipcMain);
  registerTemplateHandlers(ipcMain);
  registerSettingsHandlers(ipcMain);
  registerPrintHandlers(ipcMain);
  registerBackupHandlers(ipcMain);
  registerFileHandlers(ipcMain);
  registerDashboardHandlers(ipcMain);
  registerInstallmentHandlers(ipcMain);
  registerLicenseHandlers(ipcMain);
  registerPaymentHandlers(ipcMain);
  
  console.log('All IPC handlers registered');
}
