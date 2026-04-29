# ProveIT Open Verifier

Public workspace for ProveIT verification artifacts published under the
`@proveit` npm organization.

## Packages

- `@proveit/verification-contract`: public verification record types, JSON
  schema, and contract fixtures.
- `@proveit/open-verifier`: CLI and library for validating public ProveIT
  verification records.

## Development

```bash
npm ci
npm run verify
```

The verifier is intentionally independent from the private ProveIT backend. It
does not require database access, Supabase credentials, app attestation secrets,
or backend source imports.
