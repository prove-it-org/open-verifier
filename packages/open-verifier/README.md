# @proveit/open-verifier

Self-contained verifier for public ProveIT verification records.

This package validates the public `GET /api/v1/verify/{id}` contract, checks
that the server-issued word code has the expected three-word shape, and can
download the original proof asset to confirm its bytes hash to `file_hash`.

## Install

```bash
npm install
npm run build
```

## CLI

```bash
npm run build
node dist/cli.js https://proveit-app.com/verify/{id}
node dist/cli.js https://example.trycloudflare.com/verify/{id}
node dist/cli.js {id} --api-base=https://proveit-app.com
node dist/cli.js ../verification-contract/fixtures/primary.json --skip-download
```

Full verify URLs infer their API host. Use `--api-base` only when passing a bare
capture ID.

The CLI exits non-zero when an error-level verification check fails.

## Library

```ts
import { verifyPayload, verifyRemoteVerification } from '@proveit/open-verifier';

const report = await verifyRemoteVerification({
  id: 'capture-id',
  apiBase: 'https://proveit-app.com',
});

console.log(report.status, report.checks);
```

## Scope

This package verifies public, portable facts:

- public JSON shape
- `verified` and `verification_status` consistency
- SHA-256 hash format
- server-issued word-code shape and version
- absence of legacy HMAC checks in public proof records
- C2PA public metadata presence when enabled
- optional original-file download hash
- optional blockchain consistency fields

It does not need database access, Supabase credentials, app secrets, or backend
source imports.
