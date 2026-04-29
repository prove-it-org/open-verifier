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
    process.exitCode = 2;
    return;
  }

  const apiBase = readFlag(args, 'api-base') ?? 'https://proveit-app.com';
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
