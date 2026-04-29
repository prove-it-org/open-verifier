# @proveit/open-verifier

Self-contained verifier for public ProveIT verification records.

This package validates the public `GET /api/v1/verify/{id}` contract, checks
that the user-facing word code is derived from the published SHA-256 file hash,
and can download the original proof asset to confirm its bytes hash to
`file_hash`.

## Install

```bash
npm install
npm run build
```

## CLI

```bash
npm run build
node dist/cli.js https://proveit-app.com/verify/{id}
node dist/cli.js {id} --api-base=https://proveit-app.com
node dist/cli.js ../verification-contract/fixtures/primary.json --skip-download
```

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
- persisted word-code derivation
- absence of legacy HMAC checks in public proof records
- C2PA public metadata presence when enabled
- optional original-file download hash
- optional blockchain consistency fields

It does not need database access, Supabase credentials, app secrets, or backend
source imports.
