import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { OrderWithItems } from '../../shared/types';

export function registerDashboardHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('dashboard:getStats', async (_, period: 'today' | '7days' | '30days'): Promise<any> => {
    const db = dbManager.getDB();
    
    let startDate: Date;
    const endDate = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
    }
    
    const startDateStr = startDate.toISOString();
    
    // Get order count and revenue
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as orderCount,
        COALESCE(SUM(grand_total), 0) as revenue
      FROM orders
      WHERE created_at >= ? AND status = 'finalized'
    `).get(startDateStr) as any;
    
    // Get trend data (daily breakdown)
    const trend = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(grand_total), 0) as revenue
      FROM orders
      WHERE created_at >= ? AND status = 'finalized'
      GROUP BY DATE(created_at)
      ORDER BY date
    `).all(startDateStr) as any[];
    
    // Get overdue installments count
    const overdueCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM installments
      WHERE status = 'overdue'
    `).get() as any;
    
    return {
      orderCount: stats.orderCount || 0,
      revenue: stats.revenue || 0,
      trend: trend || [],
      overdueInstallments: overdueCount.count || 0
    };
  });

  ipcMain.handle('dashboard:getRecentOrders', async (_, limit: number): Promise<OrderWithItems[]> => {
    const db = dbManager.getDB();
    
    const orders = db.prepare(`
      SELECT * FROM orders
      WHERE status = 'finalized'
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as any[];
    
    return orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      const customer = order.customer_id 
        ? db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id)
        : undefined;
      const user = db.prepare('SELECT id, username, role, active, created_at FROM users WHERE id = ?').get(order.user_id);
      
      return {
        ...order,
        is_installment: Boolean(order.is_installment),
        items,
        customer,
        user
      };
    });
  });
}
