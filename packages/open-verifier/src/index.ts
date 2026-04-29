import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  verificationSchema,
  type VerificationPayload,
} from '@proveit/verification-contract';
import { isValidWordCodeForHash, normalizeWordCode } from './wordCode.js';

export { verificationSchema };
export { isValidWordCodeForHash, normalizeWordCode };
export type { VerificationCheck, VerificationPayload } from '@proveit/verification-contract';

export type VerificationCheckSeverity = 'error' | 'warning' | 'info';
export type VerificationReportStatus = 'pass' | 'fail';

export interface VerificationReportCheck {
  id: string;
  severity: VerificationCheckSeverity;
  passed: boolean;
  detail: string;
}

export interface VerificationReport {
  status: VerificationReportStatus;
  payload?: VerificationPayload;
  checks: VerificationReportCheck[];
}

export interface VerifyPayloadOptions {
  downloadBytes?: Uint8Array;
  requireVerified?: boolean;
}

export interface VerifyRemoteOptions {
  id: string;
  apiBase?: string;
  fetchImpl?: typeof fetch;
  download?: boolean;
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function validateVerificationPayload(input: unknown): { valid: true; value: VerificationPayload } | { valid: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { valid: false, errors: ['payload must be an object'] };
  }

  requireString(input, 'id', errors);
  requireString(input, 'word_code', errors);
  requireString(input, 'file_hash', errors);
  requireNumber(input, 'file_size', errors);
  requireString(input, 'mime_type', errors);
  requireBoolean(input, 'is_video', errors);
  requireBoolean(input, 'verified', errors);
  requireString(input, 'verification_status', errors);
  requireString(input, 'captured_at', errors);
  requireString(input, 'uploaded_at', errors);

  if (!/^[0-9a-f]{64}$/.test(String(input.file_hash ?? ''))) {
    errors.push('file_hash must be a lowercase 64-character SHA-256 hex string');
  }
  if (!isRecord(input.c2pa) || typeof input.c2pa.enabled !== 'boolean') {
    errors.push('c2pa.enabled must be present');
  }
  if (!isRecord(input.blockchain) || typeof input.blockchain.status !== 'string' || typeof input.blockchain.network !== 'string') {
    errors.push('blockchain.status and blockchain.network must be present');
  }
  if (!Array.isArray(input.verification_checks)) {
    errors.push('verification_checks must be an array');
  } else {
    input.verification_checks.forEach((check, index) => {
      if (!isRecord(check) || typeof check.check !== 'string' || typeof check.passed !== 'boolean' || typeof check.checked_at !== 'string') {
        errors.push(`verification_checks[${index}] must include check, passed, checked_at`);
      }
    });
  }
  if (!isRecord(input.trust) || typeof input.trust.level !== 'string') {
    errors.push('trust.level must be present');
  }

  return errors.length === 0
    ? { valid: true, value: input as unknown as VerificationPayload }
    : { valid: false, errors };
}

export function verifyPayload(input: unknown, options: VerifyPayloadOptions = {}): VerificationReport {
  const checks: VerificationReportCheck[] = [];
  const parsed = validateVerificationPayload(input);
  addCheck(checks, {
    id: 'schema',
    severity: 'error',
    passed: parsed.valid,
    detail: parsed.valid ? 'Payload matches required public shape.' : parsed.errors.join('; '),
  });

  if (!parsed.valid) return finish(checks);
  const payload = parsed.value;

  addCheck(checks, {
    id: 'verified_status_consistency',
    severity: 'error',
    passed: payload.verified === (payload.verification_status === 'verified'),
    detail: `verified=${payload.verified}, verification_status=${payload.verification_status}`,
  });

  addCheck(checks, {
    id: 'word_code_hash_derivation',
    severity: 'error',
    passed: isValidWordCodeForHash(payload.file_hash, payload.word_code),
    detail: `${payload.word_code} must be derived from ${payload.file_hash}.`,
  });

  const legacyHmacChecks = payload.verification_checks.filter((check) => check.check.toLowerCase() === 'hmac_signature');
  addCheck(checks, {
    id: 'no_legacy_hmac_signature',
    severity: 'error',
    passed: legacyHmacChecks.length === 0,
    detail: legacyHmacChecks.length === 0
      ? 'No legacy HMAC verification checks are exposed.'
      : `${legacyHmacChecks.length} legacy HMAC check(s) exposed.`,
  });

  const failedOptionalVerifiedChecks = payload.verified
    ? payload.verification_checks.filter((check) => (
        !check.passed
        && ['device_signature', 'c2pa_signing'].includes(check.check.toLowerCase())
      ))
    : [];
  addCheck(checks, {
    id: 'verified_record_has_no_failed_optional_checks',
    severity: 'error',
    passed: failedOptionalVerifiedChecks.length === 0,
    detail: failedOptionalVerifiedChecks.length === 0
      ? 'Verified record has no failed optional/non-attempted public checks.'
      : `Failed optional checks: ${failedOptionalVerifiedChecks.map((check) => check.check).join(', ')}`,
  });

  const c2paFieldsPresent = !payload.c2pa.enabled || [
    payload.c2pa.claim_generator,
    payload.c2pa.manifest_hash,
    payload.c2pa.cert_issuer,
    payload.c2pa.signed_at,
  ].every((value) => typeof value === 'string' && value.length > 0);
  addCheck(checks, {
    id: 'c2pa_public_fields',
    severity: 'error',
    passed: c2paFieldsPresent,
    detail: payload.c2pa.enabled
      ? 'Enabled C2PA record includes public manifest metadata.'
      : 'C2PA is disabled for this record.',
  });

  const confirmedBlockchainHasProof = payload.blockchain.status !== 'confirmed'
    || (!!payload.blockchain.tx_hash && !!payload.blockchain.explorer_url && payload.blockchain.on_chain_verified !== false);
  addCheck(checks, {
    id: 'blockchain_consistency',
    severity: 'warning',
    passed: confirmedBlockchainHasProof,
    detail: payload.blockchain.status === 'confirmed'
      ? 'Confirmed blockchain record includes transaction proof fields.'
      : `Blockchain status is ${payload.blockchain.status}.`,
  });

  if (options.downloadBytes) {
    const actual = sha256Hex(options.downloadBytes);
    addCheck(checks, {
      id: 'download_hash',
      severity: 'error',
      passed: actual === payload.file_hash,
      detail: `Downloaded bytes hash ${actual}; expected ${payload.file_hash}.`,
    });
  }

  if (options.requireVerified) {
    addCheck(checks, {
      id: 'required_verified_record',
      severity: 'error',
      passed: payload.verified && payload.verification_status === 'verified',
      detail: 'Caller required a verified public record.',
    });
  }

  return { ...finish(checks), payload };
}

export async function verifyRemoteVerification(options: VerifyRemoteOptions): Promise<VerificationReport> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error('No fetch implementation is available.');

  const apiBase = (options.apiBase ?? 'https://proveit-app.com').replace(/\/+$/, '');
  const id = extractVerificationId(options.id);
  const verifyResponse = await fetchImpl(`${apiBase}/api/v1/verify/${encodeURIComponent(id)}`);
  if (!verifyResponse.ok) {
    return {
      status: 'fail',
      checks: [{
        id: 'fetch_verify_json',
        severity: 'error',
        passed: false,
        detail: `GET /api/v1/verify/${id} returned ${verifyResponse.status}.`,
      }],
    };
  }

  const payload = await verifyResponse.json() as unknown;
  if (options.download === false) return verifyPayload(payload);

  const downloadResponse = await fetchImpl(`${apiBase}/download/${encodeURIComponent(id)}`);
  if (!downloadResponse.ok) {
    const report = verifyPayload(payload);
    report.checks.push({
      id: 'download_fetch',
      severity: 'error',
      passed: false,
      detail: `GET /download/${id} returned ${downloadResponse.status}.`,
    });
    return finishReport(report);
  }

  const bytes = new Uint8Array(await downloadResponse.arrayBuffer());
  return verifyPayload(payload, { downloadBytes: bytes });
}

export async function verifyFixtureFile(path: string): Promise<VerificationReport> {
  const raw = await readFile(path, 'utf8');
  return verifyPayload(JSON.parse(raw));
}

export function extractVerificationId(input: string): string {
  const match = input.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return match ? match[0] : input;
}

function addCheck(checks: VerificationReportCheck[], check: VerificationReportCheck) {
  checks.push(check);
}

function finish(checks: VerificationReportCheck[]): VerificationReport {
  return finishReport({ checks, status: 'pass' });
}

function finishReport(report: VerificationReport): VerificationReport {
  const hasError = report.checks.some((check) => check.severity === 'error' && !check.passed);
  return { ...report, status: hasError ? 'fail' : 'pass' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function requireString(input: Record<string, unknown>, key: string, errors: string[]) {
  if (typeof input[key] !== 'string' || input[key].length === 0) errors.push(`${key} must be a non-empty string`);
}

function requireNumber(input: Record<string, unknown>, key: string, errors: string[]) {
  if (typeof input[key] !== 'number' || !Number.isFinite(input[key])) errors.push(`${key} must be a finite number`);
}

function requireBoolean(input: Record<string, unknown>, key: string, errors: string[]) {
  if (typeof input[key] !== 'boolean') errors.push(`${key} must be a boolean`);
}
