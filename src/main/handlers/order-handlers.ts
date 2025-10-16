import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { Order, OrderItem, OrderWithItems, Customer, User, InvoiceTemplate } from '../../shared/types';
import { getCurrentUser } from './auth-handlers';
import { PermissionService } from '../services/permission-service';

export function registerOrderHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('orders:getAll', async (_, filters?: { startDate?: string; endDate?: string; userId?: number; customerId?: number }): Promise<OrderWithItems[]> => {
    // Check if user can view orders
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Unauthorized: Not logged in');
    }
    
    const canViewAllOrders = await PermissionService.canPerform('orders', 'view_all');
    
    const db = dbManager.getDB();
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];
    
    // If user cannot view all orders, filter by their own orders
    if (!canViewAllOrders) {
      query += ' AND user_id = ?';
      params.push(currentUser.id);
    }
    
    if (filters?.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }
    if (filters?.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }
    if (filters?.customerId) {
      query += ' AND customer_id = ?';
      params.push(filters.customerId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const orders = db.prepare(query).all(...params) as Order[];
    
    return orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as OrderItem[];
      const customer = order.customer_id 
        ? db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id) as Customer
        : undefined;
      const user = db.prepare('SELECT id, username, role, active, created_at FROM users WHERE id = ?').get(order.user_id) as User;
      
      return {
        ...order,
        is_installment: Boolean(order.is_installment),
        items,
        customer,
        user
      };
    });
  });

  ipcMain.handle('orders:getById', async (_, id: number): Promise<OrderWithItems | null> => {
    const db = dbManager.getDB();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order | null;
    
    if (!order) return null;
    
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id) as OrderItem[];
    const customer = order.customer_id 
      ? db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id) as Customer
      : undefined;
    const user = db.prepare('SELECT id, username, role, active, created_at FROM users WHERE id = ?').get(order.user_id) as User;
    
    return {
      ...order,
      is_installment: Boolean(order.is_installment),
      items,
      customer,
      user
    };
  });

  ipcMain.handle('orders:create', async (_, orderData: Omit<Order, 'id' | 'created_at'>, items: OrderItem[]): Promise<Order> => {
    // Check permission to create orders
    await PermissionService.requirePermission('orders', 'create');
    
    const db = dbManager.getDB();
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    const createOrder = db.transaction((orderData: any, items: OrderItem[]) => {
      const result = db.prepare(`
        INSERT INTO orders (user_id, customer_id, subtotal, tax_rate, tax_total, grand_total, status, invoice_template_id, is_installment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderData.user_id,
        orderData.customer_id || null,
        orderData.subtotal,
        orderData.tax_rate,
        orderData.tax_total,
        orderData.grand_total,
        orderData.status,
        orderData.invoice_template_id || null,
        orderData.is_installment ? 1 : 0
      );
      
      const orderId = result.lastInsertRowid;
      
      const insertItem = db.prepare('INSERT INTO order_items (order_id, name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) {
        insertItem.run(orderId, item.name, item.quantity, item.unit_price, item.line_total);
      }
      
      return orderId;
    });
    
    const orderId = createOrder(orderData, items);
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;
  });

  ipcMain.handle('orders:finalize', async (_, orderId: number, templateId?: number): Promise<void> => {
    // Check permission to finalize orders
    await PermissionService.requirePermission('orders', 'finalize');
    
    const db = dbManager.getDB();
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    // Get order with all details
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.status === 'finalized') {
      throw new Error('Order already finalized');
    }
    
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];
    const customer = order.customer_id 
      ? db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id) as Customer
      : undefined;
    
    // Get template or default template
    let template: InvoiceTemplate | null;
    if (templateId) {
      template = db.prepare('SELECT * FROM invoice_templates WHERE id = ?').get(templateId) as InvoiceTemplate | null;
    } else {
      template = db.prepare('SELECT * FROM invoice_templates WHERE is_default = 1').get() as InvoiceTemplate | null;
    }
    
    const snapshot = {
      order,
      items,
      customer,
      template,
      finalized_at: new Date().toISOString(),
      finalized_by: user.username
    };
    
    db.prepare(`
      UPDATE orders 
      SET status = 'finalized', 
          invoice_template_id = ?,
          invoice_snapshot_json = ?
      WHERE id = ?
    `).run(template?.id || null, JSON.stringify(snapshot), orderId);
  });

  ipcMain.handle('orders:cancel', async (_, orderId: number): Promise<void> => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    const db = dbManager.getDB();
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('cancelled', orderId);
  });

  ipcMain.handle('orders:duplicate', async (_, orderId: number): Promise<Order> => {
    const db = dbManager.getDB();
    const user = getCurrentUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    const originalOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order;
    if (!originalOrder) {
      throw new Error('Order not found');
    }
    
    const originalItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];
    
    const duplicateOrder = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO orders (user_id, customer_id, subtotal, tax_rate, tax_total, grand_total, status, is_installment)
        VALUES (?, ?, ?, ?, ?, ?, 'draft', 0)
      `).run(
        user.id,
        originalOrder.customer_id,
        originalOrder.subtotal,
        originalOrder.tax_rate,
        originalOrder.tax_total,
        originalOrder.grand_total
      );
      
      const newOrderId = result.lastInsertRowid;
      
      const insertItem = db.prepare('INSERT INTO order_items (order_id, name, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)');
      for (const item of originalItems) {
        insertItem.run(newOrderId, item.name, item.quantity, item.unit_price, item.line_total);
      }
      
      return newOrderId;
    })();
    
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(duplicateOrder) as Order;
  });

  // Frequent orders
  ipcMain.handle('frequentOrders:getAll', async (_, userId?: number): Promise<any[]> => {
    const db = dbManager.getDB();
    let query = 'SELECT * FROM frequent_orders WHERE active = 1 AND (owner_user_id IS NULL';
    const params: any[] = [];
    
    if (userId) {
      query += ' OR owner_user_id = ?)';
      params.push(userId);
    } else {
      query += ')';
    }
    
    query += ' ORDER BY created_at DESC';
    
    return db.prepare(query).all(...params) as any[];
  });

  ipcMain.handle('frequentOrders:getById', async (_, id: number): Promise<any | null> => {
    const db = dbManager.getDB();
    const row = db.prepare('SELECT * FROM frequent_orders WHERE id = ?').get(id);
    return row || null;
  });

  ipcMain.handle('frequentOrders:create', async (_, label: string, items: OrderItem[], ownerUserId?: number): Promise<any> => {
    const db = dbManager.getDB();
    const result = db.prepare(`
      INSERT INTO frequent_orders (owner_user_id, label, items_json, active)
      VALUES (?, ?, ?, 1)
    `).run(ownerUserId || null, label, JSON.stringify(items));
    
    return db.prepare('SELECT * FROM frequent_orders WHERE id = ?').get(result.lastInsertRowid);
  });

  ipcMain.handle('frequentOrders:update', async (_, id: number, updates: any): Promise<void> => {
    const db = dbManager.getDB();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.label !== undefined) {
      fields.push('label = ?');
      values.push(updates.label);
    }
    if (updates.items_json !== undefined) {
      fields.push('items_json = ?');
      values.push(updates.items_json);
    }
    if (updates.active !== undefined) {
      fields.push('active = ?');
      values.push(updates.active ? 1 : 0);
    }
    
    if (fields.length === 0) return;
    
    values.push(id);
    db.prepare(`UPDATE frequent_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  });

  ipcMain.handle('frequentOrders:delete', async (_, id: number): Promise<void> => {
    const db = dbManager.getDB();
    db.prepare('DELETE FROM frequent_orders WHERE id = ?').run(id);
  });

  // Open orders (multi-session)
  ipcMain.handle('openOrders:getAll', async (): Promise<any[]> => {
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM open_orders ORDER BY created_at').all() as any[];
  });

  ipcMain.handle('openOrders:create', async (_, name: string, customerId?: number): Promise<any> => {
    const db = dbManager.getDB();
    const result = db.prepare(`
      INSERT INTO open_orders (name, customer_id, state_json)
      VALUES (?, ?, ?)
    `).run(name, customerId || null, JSON.stringify({ items: [], subtotal: 0, grand_total: 0 }));
    
    return db.prepare('SELECT * FROM open_orders WHERE id = ?').get(result.lastInsertRowid);
  });

  ipcMain.handle('openOrders:update', async (_, id: number, state: any, customerId?: number): Promise<void> => {
    const db = dbManager.getDB();
    db.prepare('UPDATE open_orders SET state_json = ?, customer_id = ? WHERE id = ?')
      .run(JSON.stringify(state), customerId || null, id);
  });

  ipcMain.handle('openOrders:delete', async (_, id: number): Promise<void> => {
    const db = dbManager.getDB();
    db.prepare('DELETE FROM open_orders WHERE id = ?').run(id);
  });
}
