import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { InstallmentPlan, Installment, InstallmentFrequency } from '../../shared/types';
import { addDays, addWeeks, addMonths, isAfter } from 'date-fns';

export function registerInstallmentHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('installments:createPlan', async (_, planData: Omit<InstallmentPlan, 'id' | 'created_at'>): Promise<InstallmentPlan> => {
    const db = dbManager.getDB();
    
    // Create the plan
    const createPlanAndInstallments = db.transaction((planData: any) => {
      const result = db.prepare(`
        INSERT INTO installment_plans (order_id, principal, down_payment, fee, frequency, count, start_date, rounding_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        planData.order_id,
        planData.principal,
        planData.down_payment || 0,  // Default to 0 if not provided
        planData.fee || 0,            // Default to 0 if not provided
        planData.frequency,
        planData.count || planData.num_installments || 3,  // Support both field names
        planData.start_date,
        planData.rounding_mode || 'bankers'  // Default rounding mode
      );
      
      const planId = result.lastInsertRowid;
      
      // Generate installment schedule
      const downPayment = planData.down_payment || 0;
      const fee = planData.fee || 0;
      const count = planData.count || planData.num_installments || 3;
      const amountToFinance = planData.principal - downPayment + fee;
      const installmentAmount = amountToFinance / count;
      
      let currentDate = new Date(planData.start_date);
      let remainingAmount = amountToFinance;
      
      for (let i = 1; i <= count; i++) {
        let amount = installmentAmount;
        
        // Last installment gets the remaining amount to handle rounding
        if (i === count) {
          amount = remainingAmount;
        } else {
          remainingAmount -= amount;
        }
        
        // Round based on rounding mode
        if (planData.rounding_mode === 'bankers') {
          amount = Math.round(amount * 100) / 100;
        }
        
        db.prepare(`
          INSERT INTO installments (plan_id, seq_no, due_date, amount_due, status)
          VALUES (?, ?, ?, ?, 'pending')
        `).run(planId, i, currentDate.toISOString(), amount);
        
        // Calculate next due date
        switch (planData.frequency) {
          case 'weekly':
            currentDate = addWeeks(currentDate, 1);
            break;
          case 'biweekly':
            currentDate = addWeeks(currentDate, 2);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
        }
      }
      
      // Update order
      db.prepare('UPDATE orders SET is_installment = 1, installment_plan_id = ? WHERE id = ?')
        .run(planId, planData.order_id);
      
      return planId;
    });
    
    const planId = createPlanAndInstallments(planData);
    
    return db.prepare('SELECT * FROM installment_plans WHERE id = ?').get(planId) as InstallmentPlan;
  });

  ipcMain.handle('installments:getPlan', async (_, planId: number): Promise<InstallmentPlan | null> => {
    const db = dbManager.getDB();
    return db.prepare('SELECT * FROM installment_plans WHERE id = ?').get(planId) as InstallmentPlan | null;
  });

  ipcMain.handle('installments:getInstallments', async (_, planId: number): Promise<Installment[]> => {
    const db = dbManager.getDB();
    
    // Update overdue status
    db.prepare(`
      UPDATE installments 
      SET status = 'overdue' 
      WHERE plan_id = ? 
        AND status = 'pending' 
        AND date(due_date) < date('now')
    `).run(planId);
    
    return db.prepare('SELECT * FROM installments WHERE plan_id = ? ORDER BY seq_no').all(planId) as Installment[];
  });

  ipcMain.handle('installments:getOverdue', async (): Promise<any[]> => {
    const db = dbManager.getDB();
    
    // Update all overdue installments
    db.prepare(`
      UPDATE installments 
      SET status = 'overdue' 
      WHERE status = 'pending' 
        AND date(due_date) < date('now')
    `).run();
    
    const overdueInstallments = db.prepare(`
      SELECT 
        i.*,
        p.*,
        o.id as order_id,
        o.grand_total,
        c.name as customer_name
      FROM installments i
      JOIN installment_plans p ON i.plan_id = p.id
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE i.status = 'overdue'
      ORDER BY i.due_date
    `).all() as any[];
    
    return overdueInstallments.map(inst => ({
      ...inst,
      customer: { name: inst.customer_name || 'Walk-in' }
    }));
  });

  ipcMain.handle('installments:getActivePlans', async (): Promise<any[]> => {
    const db = dbManager.getDB();
    
    const activePlans = db.prepare(`
      SELECT 
        p.*,
        o.id as order_id,
        o.grand_total,
        c.name as customer_name,
        COUNT(CASE WHEN i.status = 'paid' THEN 1 END) as paid_count,
        COUNT(i.id) as total_count,
        SUM(CASE WHEN i.status = 'paid' THEN i.amount_due ELSE 0 END) as paid_amount,
        SUM(i.amount_due) as total_amount,
        MIN(CASE WHEN i.status = 'pending' THEN i.due_date END) as next_due_date
      FROM installment_plans p
      JOIN orders o ON p.order_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      JOIN installments i ON p.id = i.plan_id
      GROUP BY p.id
      HAVING COUNT(CASE WHEN i.status != 'paid' THEN 1 END) > 0
      ORDER BY p.created_at DESC
    `).all() as any[];
    
    return activePlans.map(plan => ({
      ...plan,
      customer: { name: plan.customer_name || 'Walk-in' }
    }));
  });

  ipcMain.handle('installments:recordPayment', async (_, installmentId: number, amount: number, method: string, reference?: string): Promise<void> => {
    const db = dbManager.getDB();
    
    const installment = db.prepare('SELECT * FROM installments WHERE id = ?').get(installmentId) as Installment;
    
    if (!installment) {
      throw new Error('Installment not found');
    }
    
    if (installment.status === 'paid') {
      throw new Error('Installment already paid');
    }
    
    const recordPayment = db.transaction((installmentId: number, amount: number, method: string, reference?: string) => {
      // Generate receipt number
      const receiptNo = `RCP-${Date.now()}-${installmentId}`;
      
      // Update installment
      db.prepare(`
        UPDATE installments 
        SET status = 'paid',
            paid_at = datetime('now'),
            payment_method = ?,
            receipt_no = ?
        WHERE id = ?
      `).run(method, receiptNo, installmentId);
      
      // Record payment
      db.prepare(`
        INSERT INTO payments (installment_id, amount, method, reference)
        VALUES (?, ?, ?, ?)
      `).run(installmentId, amount, method, reference || null);
    });
    
    recordPayment(installmentId, amount, method, reference);
  });

  ipcMain.handle('installments:payoff', async (_, planId: number, method: string, reference?: string): Promise<void> => {
    const db = dbManager.getDB();
    
    const pendingInstallments = db.prepare(`
      SELECT * FROM installments 
      WHERE plan_id = ? AND status != 'paid'
      ORDER BY seq_no
    `).all(planId) as Installment[];
    
    if (pendingInstallments.length === 0) {
      throw new Error('No pending installments');
    }
    
    const totalAmount = pendingInstallments.reduce((sum, inst) => sum + inst.amount_due, 0);
    
    const payoffPlan = db.transaction(() => {
      const receiptNo = `PAYOFF-${Date.now()}-${planId}`;
      
      for (const installment of pendingInstallments) {
        db.prepare(`
          UPDATE installments 
          SET status = 'paid',
              paid_at = datetime('now'),
              payment_method = ?,
              receipt_no = ?
          WHERE id = ?
        `).run(method, receiptNo, installment.id);
        
        db.prepare(`
          INSERT INTO payments (installment_id, amount, method, reference)
          VALUES (?, ?, ?, ?)
        `).run(installment.id, installment.amount_due, method, reference || null);
      }
    });
    
    payoffPlan();
  });

  ipcMain.handle('installments:cancelPlan', async (_, planId: number): Promise<void> => {
    const db = dbManager.getDB();
    
    // Check if any payments have been made
    const paidCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM installments 
      WHERE plan_id = ? AND status = 'paid'
    `).get(planId) as any;
    
    if (paidCount.count > 0) {
      throw new Error('Cannot cancel plan with paid installments');
    }
    
    // Delete the plan and associated installments (cascade)
    db.prepare('DELETE FROM installment_plans WHERE id = ?').run(planId);
  });
}
