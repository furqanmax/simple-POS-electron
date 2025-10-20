import crypto from "crypto";
import axios, { AxiosResponse } from "axios";
import nacl from "tweetnacl";
import { decodeUTF8 } from "tweetnacl-util";

interface LicenseResponse {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

interface Certificate {
  payload?: Record<string, any>;
  signature?: string;
  alg?: string;
  version?: number;
}

export class NuvanaLicenseClient {
  private baseUrl: string;
  private productCode: string;
  private secret: Buffer;

  constructor(baseUrl: string, productCode: string, secret: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.productCode = productCode;
    this.secret = Buffer.from(secret, "utf8");
  }

  private sign(body: Record<string, any>): string {
    const raw = Buffer.from(JSON.stringify(body));
    const hmac = crypto.createHmac("sha256", this.secret);
    hmac.update(raw);
    return hmac.digest("base64");
  }

  private async post(endpoint: string, body: Record<string, any>): Promise<LicenseResponse> {
    body["product_code"] = this.productCode;
    const raw = JSON.stringify(body);
    const sig = this.sign(body);

    try {
      const res: AxiosResponse = await axios.post(`${this.baseUrl}/${endpoint}`, raw, {
        headers: {
          "Content-Type": "application/json",
          "X-Signature": sig,
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

  async generateOfflineCertificate(license_key: string): Promise<LicenseResponse> {
    return this.post("generate_offline_certificate", { license_key });
  }

  async revoke(license_key: string): Promise<LicenseResponse> {
    return this.post("revoke", { license_key });
  }

  async listActivations(license_key: string): Promise<LicenseResponse> {
    return this.post("list_activations", { license_key });
  }

  // ---------- Offline Certificate Verification ----------

  static verifyOfflineCertificate(
    certificate: Certificate,
    publicKeyB64: string
  ): LicenseResponse {
    if (certificate.alg !== "Ed25519") {
      return { ok: false, error: "unsupported_alg" };
    }

    const payload = certificate.payload;
    const sigB64 = certificate.signature;
    if (!payload || !sigB64) {
      return { ok: false, error: "bad_certificate" };
    }

    const raw = Buffer.from(JSON.stringify(payload));
    const sig = Buffer.from(sigB64, "base64");
    const pk = Buffer.from(publicKeyB64.replace("base64:", ""), "base64");

    try {
      const valid = nacl.sign.detached.verify(raw, sig, pk);
      if (!valid) return { ok: false, error: "bad_signature" };
    } catch {
      return { ok: false, error: "bad_signature" };
    }

    // Validate time window
    const now = new Date();
    const validUntil = new Date(payload["valid_until"]);
    if (now > validUntil) {
      return { ok: false, error: "expired_offline_cert" };
    }

    return { ok: true, payload };
  }
}
