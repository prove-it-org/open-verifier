#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import {
  extractVerificationId,
  verifyPayload,
  verifyRemoteVerification,
} from './index.js';

async function main() {
  const args = process.argv.slice(2);
  const target = args.find((arg) => !arg.startsWith('--'));
  if (!target) {
    console.error('Usage: proveit-verify <verify-url|capture-id|fixture.json> [--api-base=https://proveit-app.com] [--skip-download]');
    console.error('For local dev captures, pass the API URL printed by ios-dev-up/android-dev-up, e.g. --api-base=https://example.trycloudflare.com/api/v1');
    process.exitCode = 2;
    return;
  }

  const apiBaseFlag = readFlag(args, 'api-base');
  const apiBase = apiBaseFlag ?? 'https://proveit-app.com';
  if (!apiBaseFlag && isProveItWebUrl(target)) {
    console.error('Note: no --api-base was provided, so this will verify against production https://proveit-app.com.');
    console.error('For local dev captures, rerun with --api-base set to the API URL printed by ios-dev-up/android-dev-up.');
  }
  const skipDownload = args.includes('--skip-download');
  const report = existsSync(target)
    ? verifyPayload(JSON.parse(await readFile(target, 'utf8')))
    : await verifyRemoteVerification({
        id: extractVerificationId(target),
        apiBase,
        download: !skipDownload,
      });

  console.log(JSON.stringify(report, null, 2));
  if (report.status === 'fail') process.exitCode = 1;
}

function readFlag(args: string[], name: string): string | null {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return null;
}

function isProveItWebUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.hostname === 'proveit-app.com' && url.pathname.includes('/verify/');
  } catch {
    return false;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
