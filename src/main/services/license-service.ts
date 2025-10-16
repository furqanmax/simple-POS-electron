import { createHash, createHmac } from 'crypto';
import { dbManager } from '../database';
import { LicenseState, LicensePlan } from '../../shared/types';

// Secret key for HMAC - In production, this should be stored securely
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'YourBrand-SimplePOS-SecretKey-2024';

export interface LicenseInfo {
  isValid: boolean;
  isExpired: boolean;
  isTrial: boolean;
  plan: LicensePlan;
  expiryDate: Date | null;
  daysRemaining: number;
  graceRemaining: number;
  features: LicenseFeatures;
  status: LicenseStatus;
  message: string;
}

export interface LicenseFeatures {
  maxUsers: number;
  maxOrders: number;
  canExport: boolean;
  canBackup: boolean;
  multipleTemplates: boolean;
  installments: boolean;
  advancedReports: boolean;
  emailSupport: boolean;
  phoneSupport: boolean;
}

export type LicenseStatus = 'valid' | 'expired' | 'grace' | 'trial' | 'invalid' | 'tampered';

export class LicenseService {
  private static instance: LicenseService;
  private readonly GRACE_PERIOD_DAYS = 7;
  private readonly TRIAL_DAYS = 30;
  private readonly CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour
  private lastCheck: Date | null = null;
  private cachedInfo: LicenseInfo | null = null;

  private constructor() {
    this.startPeriodicCheck();
  }

  public static getInstance(): LicenseService {
    if (!LicenseService.instance) {
      LicenseService.instance = new LicenseService();
    }
    return LicenseService.instance;
  }

  /**
   * Generate a license key with HMAC signature
   */
  public generateLicenseKey(
    email: string,
    plan: LicensePlan,
    expiryDate: Date
  ): string {
    const payload = {
      email,
      plan,
      expiry: expiryDate.toISOString(),
      issued: new Date().toISOString(),
      nonce: Math.random().toString(36).substring(2)
    };
    
    const data = JSON.stringify(payload);
    const signature = createHmac('sha256', LICENSE_SECRET)
      .update(data)
      .digest('hex');
    
    const licenseKey = Buffer.from(JSON.stringify({
      data: payload,
      sig: signature
    })).toString('base64');
    
    return this.formatLicenseKey(licenseKey);
  }

  /**
   * Format license key for better readability
   */
  private formatLicenseKey(key: string): string {
    return key.match(/.{1,8}/g)?.join('-') || key;
  }

  /**
   * Validate and activate a license key
   */
  public async activateLicense(licenseKey: string): Promise<{ success: boolean; message: string }> {
    try {
      // Remove formatting
      const cleanKey = licenseKey.replace(/-/g, '');
      
      // Decode and parse
      const decoded = Buffer.from(cleanKey, 'base64').toString();
      const { data, sig } = JSON.parse(decoded);
      
      // Verify signature
      const expectedSig = createHmac('sha256', LICENSE_SECRET)
        .update(JSON.stringify(data))
        .digest('hex');
      
      if (sig !== expectedSig) {
        return { success: false, message: 'Invalid license key signature' };
      }
      
      // Check expiry
      const expiryDate = new Date(data.expiry);
      if (expiryDate < new Date()) {
        return { success: false, message: 'License key has expired' };
      }
      
      // Store in database
      const db = dbManager.getDB();
      db.prepare(`
        INSERT INTO license_state (
          id, plan, expiry, last_verified_at, signed_token_blob, last_seen_monotonic
        )
        VALUES (1, ?, ?, datetime('now'), ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          plan = excluded.plan,
          expiry = excluded.expiry,
          last_verified_at = excluded.last_verified_at,
          signed_token_blob = excluded.signed_token_blob,
          last_seen_monotonic = excluded.last_seen_monotonic
      `).run(
        data.plan,
        expiryDate.toISOString(),
        cleanKey,
        Date.now()
      );
      
      this.cachedInfo = null; // Clear cache
      return { success: true, message: 'License activated successfully' };
      
    } catch (error: any) {
      return { success: false, message: 'Invalid license format: ' + error.message };
    }
  }

  /**
   * Get current license information
   */
  public async getLicenseInfo(forceRefresh = false): Promise<LicenseInfo> {
    if (!forceRefresh && this.cachedInfo && this.lastCheck) {
      const timeSinceCheck = Date.now() - this.lastCheck.getTime();
      if (timeSinceCheck < this.CHECK_INTERVAL) {
        return this.cachedInfo;
      }
    }

    const db = dbManager.getDB();
    const state = db.prepare('SELECT * FROM license_state WHERE id = 1').get() as LicenseState | undefined;
    
    // Check for clock rollback
    if (state && state.last_seen_monotonic) {
      const currentTime = Date.now();
      if (currentTime < state.last_seen_monotonic) {
        // Clock rollback detected
        return this.createInfo('tampered', 'Clock rollback detected. License invalid.', null);
      }
      
      // Update last seen time
      db.prepare('UPDATE license_state SET last_seen_monotonic = ? WHERE id = 1')
        .run(currentTime);
    }
    
    if (!state) {
      // No license, start trial
      this.startTrial();
      return this.getLicenseInfo(true);
    }
    
    const now = new Date();
    const expiryDate = state.expiry ? new Date(state.expiry) : null;
    
    if (!expiryDate) {
      return this.createInfo('invalid', 'No expiry date set', state);
    }
    
    const msRemaining = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    
    // Check if expired
    if (daysRemaining <= 0) {
      const daysSinceExpiry = Math.abs(daysRemaining);
      
      // Check if in grace period
      if (daysSinceExpiry <= this.GRACE_PERIOD_DAYS) {
        const graceRemaining = this.GRACE_PERIOD_DAYS - daysSinceExpiry;
        const info = this.createInfo(
          'grace',
          `License expired. ${graceRemaining} days grace period remaining`,
          state
        );
        info.graceRemaining = graceRemaining;
        this.cachedInfo = info;
        this.lastCheck = new Date();
        return info;
      }
      
      // Fully expired
      return this.createInfo('expired', 'License has expired', state);
    }
    
    // Valid license
    const status = state.plan === 'Trial' ? 'trial' : 'valid';
    const message = state.plan === 'Trial' 
      ? `Trial: ${daysRemaining} days remaining`
      : `${state.plan} plan: ${daysRemaining} days remaining`;
    
    const info = this.createInfo(status, message, state);
    info.daysRemaining = daysRemaining;
    
    this.cachedInfo = info;
    this.lastCheck = new Date();
    
    return info;
  }

  /**
   * Create license info object
   */
  private createInfo(
    status: LicenseStatus,
    message: string,
    state: LicenseState | null
  ): LicenseInfo {
    const features = this.getFeaturesForPlan(state?.plan || 'Trial');
    
    return {
      isValid: status === 'valid' || status === 'trial' || status === 'grace',
      isExpired: status === 'expired',
      isTrial: state?.plan === 'Trial',
      plan: state?.plan || 'Trial',
      expiryDate: state?.expiry ? new Date(state.expiry) : null,
      daysRemaining: 0,
      graceRemaining: 0,
      features,
      status,
      message
    };
  }

  /**
   * Get features available for a plan
   */
  private getFeaturesForPlan(plan: LicensePlan): LicenseFeatures {
    switch (plan) {
      case 'Trial':
        return {
          maxUsers: 2,
          maxOrders: 100,
          canExport: false,
          canBackup: true,
          multipleTemplates: false,
          installments: true,
          advancedReports: false,
          emailSupport: false,
          phoneSupport: false
        };
      
      case 'Monthly':
        return {
          maxUsers: 5,
          maxOrders: 1000,
          canExport: true,
          canBackup: true,
          multipleTemplates: true,
          installments: true,
          advancedReports: false,
          emailSupport: true,
          phoneSupport: false
        };
      
      case 'Quarterly':
        return {
          maxUsers: 10,
          maxOrders: 5000,
          canExport: true,
          canBackup: true,
          multipleTemplates: true,
          installments: true,
          advancedReports: true,
          emailSupport: true,
          phoneSupport: false
        };
      
      case 'Annual':
        return {
          maxUsers: -1, // Unlimited
          maxOrders: -1, // Unlimited
          canExport: true,
          canBackup: true,
          multipleTemplates: true,
          installments: true,
          advancedReports: true,
          emailSupport: true,
          phoneSupport: true
        };
      
      default:
        return this.getFeaturesForPlan('Trial');
    }
  }

  /**
   * Start a new trial
   */
  public startTrial(): void {
    const db = dbManager.getDB();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.TRIAL_DAYS);
    
    db.prepare(`
      INSERT INTO license_state (
        id, plan, expiry, last_verified_at, signed_token_blob, last_seen_monotonic
      )
      VALUES (1, 'Trial', ?, datetime('now'), NULL, ?)
      ON CONFLICT(id) DO UPDATE SET
        plan = 'Trial',
        expiry = excluded.expiry,
        last_verified_at = excluded.last_verified_at,
        signed_token_blob = NULL,
        last_seen_monotonic = excluded.last_seen_monotonic
    `).run(expiryDate.toISOString(), Date.now());
    
    this.cachedInfo = null;
  }

  /**
   * Check if a feature is available
   */
  public async isFeatureAvailable(feature: keyof LicenseFeatures): Promise<boolean> {
    const info = await this.getLicenseInfo();
    
    if (!info.isValid) return false;
    
    const value = info.features[feature];
    return typeof value === 'boolean' ? value : value !== 0;
  }

  /**
   * Check if within limits
   */
  public async checkLimit(type: 'users' | 'orders', current: number): Promise<boolean> {
    const info = await this.getLicenseInfo();
    
    if (!info.isValid) return false;
    
    if (type === 'users') {
      return info.features.maxUsers === -1 || current < info.features.maxUsers;
    } else {
      return info.features.maxOrders === -1 || current < info.features.maxOrders;
    }
  }

  /**
   * Start periodic license checks
   */
  private startPeriodicCheck(): void {
    setInterval(async () => {
      const info = await this.getLicenseInfo(true);
      
      // Log warnings for expiring licenses
      if (info.isValid && info.daysRemaining <= 7 && info.daysRemaining > 0) {
        console.warn(`License expiring in ${info.daysRemaining} days`);
      }
      
      // Log errors for expired licenses
      if (info.isExpired) {
        console.error('License has expired');
      }
    }, this.CHECK_INTERVAL);
  }

  /**
   * Export license info for debugging
   */
  public async exportDebugInfo(): Promise<string> {
    const info = await this.getLicenseInfo();
    const db = dbManager.getDB();
    const state = db.prepare('SELECT * FROM license_state WHERE id = 1').get();
    
    return JSON.stringify({
      info,
      state,
      systemTime: new Date().toISOString(),
      monotonicTime: Date.now()
    }, null, 2);
  }
}

// Export singleton instance
export const licenseService = LicenseService.getInstance();
