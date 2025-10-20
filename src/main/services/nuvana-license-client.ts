import axios from "axios";
import * as crypto from "crypto";
import nacl from "tweetnacl";

export interface NuvanaOptions {
  baseUrl: string;
  productCode: string;
  secret: string;
}

export interface LicenseResponse {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

export interface OfflineCertificate {
  payload?: Record<string, any>;
  signature?: string;
  alg?: string;
  version?: number;
}

export class NuvanaLicenseClient {
  private baseUrl: string;
  private productCode: string;
  private secret: string;

  constructor(opts: NuvanaOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.productCode = opts.productCode;
    this.secret = opts.secret;
  }

  private sign(body: object): string {
    const raw = JSON.stringify(body);
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(raw);
    return hmac.digest('base64');
  }

  private async post(endpoint: string, body: any): Promise<LicenseResponse> {
    const data = { product_code: this.productCode, ...body };
    const signature = this.sign(data);
    
    try {
      const res = await axios.post(`${this.baseUrl}/${endpoint}`, data, {
        headers: {
          "Content-Type": "application/json",
          "X-Signature": signature,
        },
        timeout: 10000,
      });
      return res.data;
    } catch (err: any) {
      if (err.response) {
        // API returned an error response
        return err.response.data;
      }
      // Network or other error
      return { ok: false, error: err?.message || "Network error" };
    }
  }

  // ---------- API Methods ----------

  async issue(
    customer_name?: string,
    customer_email?: string,
    max_activations: number = 1
  ): Promise<LicenseResponse> {
    return this.post("issue", {
      customer_name,
      customer_email,
      max_activations,
    });
  }

  async verify(license_key: string): Promise<LicenseResponse> {
    return this.post("verify", { license_key });
  }

  async activate(
    license_key: string,
    device_hash: string,
    device_name?: string,
    app_version?: string
  ): Promise<LicenseResponse> {
    return this.post("activate", {
      license_key,
      device_hash,
      device_name,
      app_version,
    });
  }

  async deactivate(license_key: string, device_hash: string): Promise<LicenseResponse> {
    return this.post("deactivate", { license_key, device_hash });
  }

  async heartbeat(license_key: string, device_hash: string): Promise<LicenseResponse> {
    return this.post("heartbeat", { license_key, device_hash });
  }

  async generateOfflineCertificate(
    license_key: string,
    device_hash: string,
    device_name?: string,
    app_version?: string,
    valid_days: number = 30
  ): Promise<LicenseResponse> {
    return this.post("generate_offline_certificate", {
      license_key,
      device_hash,
      device_name,
      app_version,
      valid_days,
    });
  }

  async revoke(license_key: string): Promise<LicenseResponse> {
    return this.post("revoke", { license_key });
  }

  async listActivations(license_key: string): Promise<LicenseResponse> {
    return this.post("list_activations", { license_key });
  }

  // ---------- Offline Certificate Verification ----------

  static verifyOfflineCertificate(
    cert: any,
    publicKeyB64: string
  ): { ok: boolean; error?: string; payload?: any } {
    if (!cert?.payload || !cert?.signature || cert?.alg !== "Ed25519") {
      return { ok: false, error: "bad_certificate" };
    }

    // The payload must be stringified exactly as it was when signed
    const payloadStr = JSON.stringify(cert.payload);
    const sig = Buffer.from(cert.signature, "base64");
    
    // Handle public key with or without "base64:" prefix
    const cleanKey = publicKeyB64.replace("base64:", "");
    const pk = Buffer.from(cleanKey, "base64");

    try {
      const ok = nacl.sign.detached.verify(
        new TextEncoder().encode(payloadStr),
        new Uint8Array(sig),
        new Uint8Array(pk)
      );
      if (!ok) {
        console.error("Signature verification failed");
        return { ok: false, error: "bad_signature" };
      }
    } catch (error) {
      console.error("Signature verification error:", error);
      return { ok: false, error: "bad_signature" };
    }

    // Validate time window
    const now = new Date();
    const vu = new Date(cert.payload.valid_until);
    if (now > vu) {
      return { ok: false, error: "expired_offline_cert" };
    }

    // Validate that it's an offline certificate
    if (cert.payload.type !== "offline_cert") {
      return { ok: false, error: "invalid_cert_type" };
    }

    return { ok: true, payload: cert.payload };
  }
}
