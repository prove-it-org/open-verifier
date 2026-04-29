import { verificationSchema } from './schema.js';

export { verificationSchema };

export interface VerificationCheck {
  check: string;
  passed: boolean;
  checked_at: string;
}

export interface VerificationPayload {
  id: string;
  word_code: string;
  file_hash: string;
  file_url?: string;
  media_available?: boolean;
  file_size: number;
  mime_type: string;
  is_video: boolean;
  verified: boolean;
  verification_status: 'verified' | 'pending' | 'failed' | 'expired' | string;
  failure_reason?: string | null;
  captured_at: string;
  uploaded_at: string;
  captured_by?: string | null;
  author_username?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  depth_capability?: string | null;
  screen_detected?: boolean | null;
  moire_score?: number | null;
  moire_detected?: boolean | null;
  c2pa: {
    enabled: boolean;
    claim_generator?: string | null;
    manifest_hash?: string | null;
    cert_issuer?: string | null;
    signed_at?: string | null;
    ingredients?: unknown;
  };
  blockchain: {
    status: string;
    tx_hash?: string | null;
    block_number?: number | null;
    network: string;
    explorer_url?: string | null;
    registered_at?: string | null;
    on_chain_verified: boolean | null;
  };
  verification_checks: VerificationCheck[];
  trust: {
    level: string;
    label: string;
    description: string;
    equivalent_to_native: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
