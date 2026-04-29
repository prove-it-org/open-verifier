import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import {
  isValidWordCodeForHash,
  normalizeWordCode,
  sha256Hex,
  verifyPayload,
  verifyRemoteVerification,
  verificationSchema,
} from '../src/index.js';

async function fixture(name: string) {
  return JSON.parse(await readFile(new URL(`../../verification-contract/fixtures/${name}.json`, import.meta.url), 'utf8'));
}

test('exports a JSON schema for the public verification record', () => {
  assert.equal(verificationSchema.title, 'ProveIT public verification record');
  assert.ok(verificationSchema.required.includes('word_code'));
  assert.ok(verificationSchema.required.includes('verification_checks'));
});

test('accepts primary, fallback-window, and numeric-suffix word codes', async () => {
  for (const name of ['primary', 'fallback-window', 'numeric-suffix']) {
    const payload = await fixture(name);
    const report = verifyPayload(payload);
    assert.equal(report.status, 'pass', name);
    assert.equal(
      report.checks.find((check) => check.id === 'word_code_hash_derivation')?.passed,
      true,
      name,
    );
  }
});

test('normalizes common user-entered word-code separators', () => {
  assert.equal(normalizeWordCode('Primal Robin.Overcast'), 'primal·robin·overcast');
  assert.equal(normalizeWordCode('vast-ranch-xyst-2'), 'vast·ranch·xyst·2');
});

test('rejects invalid word-code records', async () => {
  const payload = await fixture('invalid-word-code');
  const report = verifyPayload(payload);
  assert.equal(report.status, 'fail');
  assert.equal(
    report.checks.find((check) => check.id === 'word_code_hash_derivation')?.passed,
    false,
  );
});

test('checks downloaded bytes against the public file_hash', async () => {
  const payload = await fixture('primary');
  const bytes = new TextEncoder().encode('primary fixture');
  assert.equal(sha256Hex(bytes), payload.file_hash);
  assert.equal(verifyPayload(payload, { downloadBytes: bytes }).status, 'pass');

  const badReport = verifyPayload(payload, { downloadBytes: new TextEncoder().encode('tampered') });
  assert.equal(badReport.status, 'fail');
  assert.equal(badReport.checks.find((check) => check.id === 'download_hash')?.passed, false);
});

test('flags legacy HMAC checks and failed optional checks on verified records', async () => {
  const payload = await fixture('primary');
  payload.verification_checks.push(
    { check: 'hmac_signature', passed: true, checked_at: '2026-04-28T10:00:05.000Z' },
    { check: 'device_signature', passed: false, checked_at: '2026-04-28T10:00:05.000Z' },
  );

  const report = verifyPayload(payload);
  assert.equal(report.status, 'fail');
  assert.equal(report.checks.find((check) => check.id === 'no_legacy_hmac_signature')?.passed, false);
  assert.equal(report.checks.find((check) => check.id === 'verified_record_has_no_failed_optional_checks')?.passed, false);
});

test('verifies a remote record using supplied fetch implementation', async () => {
  const payload = await fixture('primary');
  const fileBytes = new TextEncoder().encode('primary fixture');
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('/api/v1/verify/')) {
      return Response.json(payload);
    }
    if (url.includes('/download/')) {
      return new Response(fileBytes);
    }
    return new Response('not found', { status: 404 });
  };

  const report = await verifyRemoteVerification({
    id: payload.id,
    apiBase: 'https://proveit-app.com',
    fetchImpl,
  });

  assert.equal(report.status, 'pass');
  assert.equal(calls.length, 2);
});

test('direct word-code helper matches fixture expectations', async () => {
  const fallback = await fixture('fallback-window');
  const suffix = await fixture('numeric-suffix');
  assert.equal(isValidWordCodeForHash(fallback.file_hash, fallback.word_code), true);
  assert.equal(isValidWordCodeForHash(suffix.file_hash, suffix.word_code), true);
});
