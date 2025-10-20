import { createHash } from 'crypto';
import { dbManager } from '../database';
import { LicenseState, LicensePlan } from '../../shared/types';
import { NuvanaLicenseClient } from './nuvana-license-client';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Nuvana API Configuration
const NUVANA_BASE_URL = process.env.NUVANA_LICENSE_URL || 'https://licensing.nuvanasolutions.in';
const NUVANA_PRODUCT_CODE = process.env.NUVANA_PRODUCT_CODE || 'SIMPLEPOS-ELECTRON';
const NUVANA_SECRET = process.env.NUVANA_SECRET || 'your-secret-key-here';
const NUVANA_PUBLIC_KEY = process.env.NUVANA_PUBLIC_KEY || 'base64:MC4CAQAwBQYDK2VwBCIEIBn3BYdNJRWJJnpSDMRn8wRzEKWFALe4t5w3xKe4X0+C';

export interface NuvanaLicenseInfo {
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
  licenseKey?: string;
  customerEmail?: string;
  activationId?: string;
  offlineCertificate?: any;
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

export type LicenseStatus = 'valid' | 'expired' | 'grace' | 'trial' | 'invalid' | 'tampered' | 'not_activated';

export class NuvanaLicenseService {
  private static instance: NuvanaLicenseService;
  private readonly GRACE_PERIOD_DAYS = 7;
  private readonly TRIAL_DAYS = 30;
  private readonly CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour
  private readonly HEARTBEAT_INTERVAL = 1000 * 60 * 60 * 24; // Heartbeat every 24 hours
  private lastCheck: Date | null = null;
  private cachedInfo: NuvanaLicenseInfo | null = null;
  private client: NuvanaLicenseClient;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.client = new NuvanaLicenseClient(NUVANA_BASE_URL, NUVANA_PRODUCT_CODE, NUVANA_SECRET);
    this.startPeriodicCheck();
  }

  public static getInstance(): NuvanaLicenseService {
    if (!NuvanaLicenseService.instance) {
      NuvanaLicenseService.instance = new NuvanaLicenseService();
    }
    return NuvanaLicenseService.instance;
  }

  /**
   * Generate device hash for this machine
   */
  private getDeviceHash(): string {
    const cpus = os.cpus();
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const networkInterfaces = os.networkInterfaces();
    
    // Get first non-internal MAC address
    let mac = '';
    for (const name of Object.keys(networkInterfaces)) {
      const interfaces = networkInterfaces[name];
      if (interfaces) {
        for (const iface of interfaces) {
          if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
            mac = iface.mac;
            break;
          }
        }
      }
      if (mac) break;
    }
    
    const deviceInfo = `${hostname}-${platform}-${arch}-${mac}-${cpus[0]?.model || 'unknown'}`;
    return createHash('sha256').update(deviceInfo).digest('hex');
  }

  /**
   * Get device name for display
   */
  private getDeviceName(): string {
    return `${os.hostname()} (${os.platform()})`;
  }

  /**
   * Get app version
   */
  private getAppVersion(): string {
    try {
      return app.getVersion();
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Validate and activate a license key with Nuvana API
   */
  public async activateLicense(licenseKey: string): Promise<{ success: boolean; message: string }> {
    try {
      // First verify the license
      const verifyResult = await this.client.verify(licenseKey);
      
      if (!verifyResult.ok) {
        return { 
          success: false, 
          message: verifyResult.error === 'license_not_found' 
            ? 'Invalid license key' 
            : verifyResult.error || 'License verification failed'
        };
      }

      // Check if already expired
      if (verifyResult.status === 'expired') {
        return { success: false, message: 'License key has expired' };
      }

      // Check if revoked
      if (verifyResult.status === 'revoked') {
        return { success: false, message: 'License key has been revoked' };
      }

      // Activate the license
      const deviceHash = this.getDeviceHash();
      const deviceName = this.getDeviceName();
      const appVersion = this.getAppVersion();
      
      const activateResult = await this.client.activate(
        licenseKey,
        deviceHash,
        deviceName,
        appVersion
      );

      if (!activateResult.ok) {
        if (activateResult.error === 'max_activations_reached') {
          return { 
            success: false, 
            message: 'Maximum activations reached for this license key' 
          };
        }
        return { 
          success: false, 
          message: activateResult.error || 'License activation failed' 
        };
      }

      // Store activation details in database
      const db = dbManager.getDB();
      
      // Map Nuvana metadata to our plan types
      const plan = this.mapMetadataToPlan(verifyResult.metadata);
      const expiryDate = verifyResult.expires_at ? new Date(verifyResult.expires_at) : null;
      
      // Generate offline certificate for backup
      const certResult = await this.client.generateOfflineCertificate(licenseKey);
      const offlineCert = certResult.ok ? JSON.stringify(certResult.certificate) : null;

      db.prepare(`
        INSERT INTO license_state (
          id, plan, expiry, last_verified_at, signed_token_blob, 
          machine_fingerprint, last_seen_monotonic, license_key,
          customer_email, activation_id, offline_certificate
        )
        VALUES (1, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          plan = excluded.plan,
          expiry = excluded.expiry,
          last_verified_at = excluded.last_verified_at,
          signed_token_blob = excluded.signed_token_blob,
          machine_fingerprint = excluded.machine_fingerprint,
          last_seen_monotonic = excluded.last_seen_monotonic,
          license_key = excluded.license_key,
          customer_email = excluded.customer_email,
          activation_id = excluded.activation_id,
          offline_certificate = excluded.offline_certificate
      `).run(
        plan,
        expiryDate?.toISOString() || null,
        licenseKey,
        deviceHash,
        Date.now(),
        licenseKey,
        verifyResult.customer_email || null,
        activateResult.activation_id || null,
        offlineCert
      );
      
      this.cachedInfo = null; // Clear cache
      this.startHeartbeat(licenseKey); // Start heartbeat
      
      return { success: true, message: 'License activated successfully' };
      
    } catch (error: any) {
      console.error('License activation error:', error);
      return { success: false, message: 'Failed to activate license: ' + error.message };
    }
  }

  /**
   * Map Nuvana metadata to internal plan types
   */
  private mapMetadataToPlan(metadata: any): LicensePlan {
    if (!metadata || !metadata.plan) {
      return 'Trial';
    }
    
    const planMap: { [key: string]: LicensePlan } = {
      'trial': 'Trial',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'annual': 'Annual',
      'yearly': 'Annual'
    };
    
    const normalizedPlan = metadata.plan.toLowerCase();
    return planMap[normalizedPlan] || 'Monthly';
  }

  /**
   * Get current license information
   */
  public async getLicenseInfo(forceRefresh = false): Promise<NuvanaLicenseInfo> {
    if (!forceRefresh && this.cachedInfo && this.lastCheck) {
      const timeSinceCheck = Date.now() - this.lastCheck.getTime();
      if (timeSinceCheck < this.CHECK_INTERVAL) {
        return this.cachedInfo;
      }
    }

    const db = dbManager.getDB();
    const state = db.prepare(`
      SELECT *, 
        license_key, 
        customer_email, 
        activation_id,
        offline_certificate
      FROM license_state 
      WHERE id = 1
    `).get() as any;
    
    // Check for clock rollback
    if (state && state.last_seen_monotonic) {
      const currentTime = Date.now();
      if (currentTime < state.last_seen_monotonic) {
        // Clock rollback detected
        return this.createInfo('tampered', 'Clock rollback detected. License invalid.', state);
      }
      
      // Update last seen time
      db.prepare('UPDATE license_state SET last_seen_monotonic = ? WHERE id = 1')
        .run(currentTime);
    }
    
    if (!state) {
      // No license state at all, start trial
      this.startTrial();
      // Get the newly created trial state
      const trialState = db.prepare(`
        SELECT *, 
          license_key, 
          customer_email, 
          activation_id,
          offline_certificate
        FROM license_state 
        WHERE id = 1
      `).get() as any;
      
      const expiryDate = trialState.expiry ? new Date(trialState.expiry) : null;
      const daysRemaining = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30;
      
      const info = this.createInfo('trial', `Trial: ${daysRemaining} days remaining`, trialState);
      info.daysRemaining = daysRemaining;
      
      this.cachedInfo = info;
      this.lastCheck = new Date();
      return info;
    }
    
    // If state exists but no license_key, it's a trial
    if (!state.license_key) {
      const expiryDate = state.expiry ? new Date(state.expiry) : null;
      
      if (!expiryDate) {
        return this.createInfo('invalid', 'No expiry date set', state);
      }
      
      const msRemaining = expiryDate.getTime() - Date.now();
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      
      if (daysRemaining <= 0) {
        return this.createInfo('expired', 'Trial has expired', state);
      }
      
      const info = this.createInfo('trial', `Trial: ${daysRemaining} days remaining`, state);
      info.daysRemaining = daysRemaining;
      
      this.cachedInfo = info;
      this.lastCheck = new Date();
      return info;
    }

    // Try to verify with Nuvana API (online check)
    if (state.license_key) {
      try {
        const verifyResult = await this.client.verify(state.license_key);
        
        if (verifyResult.ok) {
          // Update stored info with latest from API
          const plan = this.mapMetadataToPlan(verifyResult.metadata);
          const expiryDate = verifyResult.expires_at ? new Date(verifyResult.expires_at) : null;
          
          db.prepare(`
            UPDATE license_state 
            SET plan = ?, expiry = ?, last_verified_at = datetime('now')
            WHERE id = 1
          `).run(plan, expiryDate?.toISOString() || null);
          
          state.plan = plan;
          state.expiry = expiryDate?.toISOString() || null;
          
          // Check activation status
          if (verifyResult.status === 'revoked') {
            return this.createInfo('invalid', 'License has been revoked', state);
          }
        } else if (verifyResult.error === 'license_not_found') {
          return this.createInfo('invalid', 'License key not found', state);
        }
      } catch (error) {
        // If online check fails, fall back to offline validation
        console.warn('Online license verification failed, using offline mode:', error);
        
        // Try offline certificate if available
        if (state.offline_certificate) {
          try {
            const cert = JSON.parse(state.offline_certificate);
            const result = NuvanaLicenseClient.verifyOfflineCertificate(cert, NUVANA_PUBLIC_KEY);
            
            if (!result.ok) {
              console.warn('Offline certificate validation failed:', result.error);
            }
          } catch (e) {
            console.error('Failed to verify offline certificate:', e);
          }
        }
      }
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
    info.licenseKey = state.license_key;
    info.customerEmail = state.customer_email;
    info.activationId = state.activation_id;
    
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
    state: any | null
  ): NuvanaLicenseInfo {
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
      message,
      licenseKey: state?.license_key,
      customerEmail: state?.customer_email,
      activationId: state?.activation_id,
      offlineCertificate: state?.offline_certificate ? JSON.parse(state.offline_certificate) : null
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
        id, plan, expiry, last_verified_at, signed_token_blob, 
        machine_fingerprint, last_seen_monotonic
      )
      VALUES (1, 'Trial', ?, datetime('now'), NULL, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        plan = 'Trial',
        expiry = excluded.expiry,
        last_verified_at = excluded.last_verified_at,
        signed_token_blob = NULL,
        machine_fingerprint = excluded.machine_fingerprint,
        last_seen_monotonic = excluded.last_seen_monotonic,
        license_key = NULL,
        customer_email = NULL,
        activation_id = NULL,
        offline_certificate = NULL
    `).run(expiryDate.toISOString(), this.getDeviceHash(), Date.now());
    
    this.cachedInfo = null;
  }

  /**
   * Deactivate current license
   */
  public async deactivateLicense(): Promise<{ success: boolean; message: string }> {
    try {
      const db = dbManager.getDB();
      const state = db.prepare('SELECT * FROM license_state WHERE id = 1').get() as any;
      
      if (state && state.license_key) {
        // Deactivate with Nuvana API
        const result = await this.client.deactivate(state.license_key, this.getDeviceHash());
        
        if (!result.ok && result.error !== 'activation_not_found') {
          console.error('Failed to deactivate license:', result.error);
        }
      }
      
      // Stop heartbeat
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      
      // Revert to trial
      this.startTrial();
      
      return { success: true, message: 'License deactivated, reverted to trial' };
    } catch (error: any) {
      return { success: false, message: 'Failed to deactivate: ' + error.message };
    }
  }

  /**
   * Start heartbeat for license
   */
  private startHeartbeat(licenseKey: string): void {
    // Clear existing heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Send initial heartbeat
    this.sendHeartbeat(licenseKey);
    
    // Schedule periodic heartbeats
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat(licenseKey);
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Send heartbeat to Nuvana
   */
  private async sendHeartbeat(licenseKey: string): Promise<void> {
    try {
      const result = await this.client.heartbeat(licenseKey, this.getDeviceHash());
      
      if (!result.ok) {
        console.warn('License heartbeat failed:', result.error);
        
        if (result.error === 'license_not_found' || result.error === 'activation_not_found') {
          // License or activation was removed, invalidate local license
          this.cachedInfo = null;
          console.error('License or activation not found, invalidating local license');
        }
      }
    } catch (error) {
      console.error('Failed to send license heartbeat:', error);
    }
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
      deviceHash: this.getDeviceHash(),
      deviceName: this.getDeviceName(),
      appVersion: this.getAppVersion(),
      systemTime: new Date().toISOString(),
      monotonicTime: Date.now()
    }, null, 2);
  }

  /**
   * Get activation list for current license
   */
  public async getActivations(): Promise<any[]> {
    try {
      const db = dbManager.getDB();
      const state = db.prepare('SELECT license_key FROM license_state WHERE id = 1').get() as any;
      
      if (!state || !state.license_key) {
        return [];
      }
      
      const result = await this.client.listActivations(state.license_key);
      
      if (result.ok && result.activations) {
        return result.activations;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get activations:', error);
      return [];
    }
  }

  /**
   * Revoke license (admin function)
   */
  public async revokeLicense(licenseKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.client.revoke(licenseKey);
      
      if (result.ok) {
        return { success: true, message: 'License revoked successfully' };
      }
      
      return { success: false, message: result.error || 'Failed to revoke license' };
    } catch (error: any) {
      return { success: false, message: 'Failed to revoke: ' + error.message };
    }
  }

  /**
   * Issue new license (admin function)
   */
  public async issueLicense(
    customerName: string,
    customerEmail: string,
    maxActivations: number = 1
  ): Promise<{ success: boolean; licenseKey?: string; message: string }> {
    try {
      const result = await this.client.issue(customerName, customerEmail, maxActivations);
      
      if (result.ok && result.license_key) {
        return { 
          success: true, 
          licenseKey: result.license_key,
          message: 'License issued successfully' 
        };
      }
      
      return { success: false, message: result.error || 'Failed to issue license' };
    } catch (error: any) {
      return { success: false, message: 'Failed to issue: ' + error.message };
    }
  }
}

// Export singleton instance
export const nuvanaLicenseService = NuvanaLicenseService.getInstance();
