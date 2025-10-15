import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { Payment } from '../../shared/types';

export function registerPaymentHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('payments:getAll', async (_evt, filters?: { startDate?: string; endDate?: string }): Promise<Payment[]> => {
    const db = dbManager.getDB();
    let sql = `SELECT * FROM payments WHERE 1=1`;
    const params: any[] = [];

    if (filters?.startDate) {
      sql += ` AND created_at >= ?`;
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      sql += ` AND created_at <= ?`;
      params.push(filters.endDate);
    }
    sql += ` ORDER BY created_at DESC`;

    return db.prepare(sql).all(...params) as Payment[];
  });

  ipcMain.handle('payments:getByOrder', async (_evt, orderId: number): Promise<Payment[]> => {
    const db = dbManager.getDB();

    // Payments can be directly on order_id, or via installments linked to the order's plan
    const direct = db.prepare(`
      SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC
    `).all(orderId) as Payment[];

    const viaInstallments = db.prepare(`
      SELECT p.* FROM payments p
      JOIN installments i ON p.installment_id = i.id
      JOIN installment_plans ip ON i.plan_id = ip.id
      WHERE ip.order_id = ?
      ORDER BY p.created_at DESC
    `).all(orderId) as Payment[];

    return [...direct, ...viaInstallments];
  });
}
