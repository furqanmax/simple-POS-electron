import { IpcMain } from 'electron';
import { dbManager } from '../database';
import { LicenseState, LicensePlan } from '../../shared/types';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function registerLicenseHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('license:getState', async (): Promise<LicenseState | null> => {
    const db = dbManager.getDB();
    const row = db.prepare('SELECT * FROM license_state WHERE id = 1').get() as LicenseState | undefined;
    return row || null;
  });

  ipcMain.handle('license:activate', async (_evt, token: string): Promise<void> => {
    const db = dbManager.getDB();

    // Naive, offline-first activation: infer plan duration by token keyword if present
    let plan: LicensePlan = 'Monthly';
    if (/annual/i.test(token)) plan = 'Annual';
    else if (/quarter/i.test(token)) plan = 'Quarterly';

    let expiry: Date = new Date();
    if (plan === 'Annual') expiry = addMonths(expiry, 12);
    else if (plan === 'Quarterly') expiry = addMonths(expiry, 3);
    else expiry = addMonths(expiry, 1);

    db.prepare(`
      INSERT INTO license_state (id, plan, expiry, last_verified_at, signed_token_blob, last_seen_monotonic)
      VALUES (1, ?, ?, datetime('now'), ?, 0)
      ON CONFLICT(id) DO UPDATE SET
        plan = excluded.plan,
        expiry = excluded.expiry,
        last_verified_at = excluded.last_verified_at,
        signed_token_blob = excluded.signed_token_blob
    `).run(plan, expiry.toISOString(), token);
  });

  ipcMain.handle('license:deactivate', async (): Promise<void> => {
    const db = dbManager.getDB();
    const expiry = addDays(new Date(), 30);
    db.prepare(`
      INSERT INTO license_state (id, plan, expiry, last_verified_at, signed_token_blob, last_seen_monotonic)
      VALUES (1, 'Trial', ?, datetime('now'), NULL, 0)
      ON CONFLICT(id) DO UPDATE SET
        plan = 'Trial',
        expiry = excluded.expiry,
        last_verified_at = excluded.last_verified_at,
        signed_token_blob = NULL
    `).run(expiry.toISOString());
  });

  ipcMain.handle('license:verify', async (): Promise<boolean> => {
    const db = dbManager.getDB();
    const row = db.prepare('SELECT expiry FROM license_state WHERE id = 1').get() as any;
    const now = new Date();
    let ok = true;
    if (row && row.expiry) {
      ok = new Date(row.expiry) > now;
    }
    db.prepare('UPDATE license_state SET last_verified_at = datetime(\'now\') WHERE id = 1').run();
    return ok;
  });

  ipcMain.handle('license:checkExpiry', async (): Promise<{ expired: boolean; daysRemaining: number }> => {
    const db = dbManager.getDB();
    const row = db.prepare('SELECT expiry FROM license_state WHERE id = 1').get() as any;
    if (!row || !row.expiry) {
      return { expired: true, daysRemaining: 0 };
    }
    const now = new Date();
    const expiry = new Date(row.expiry);
    const ms = expiry.getTime() - now.getTime();
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return { expired: days <= 0, daysRemaining: Math.max(0, days) };
  });
}
