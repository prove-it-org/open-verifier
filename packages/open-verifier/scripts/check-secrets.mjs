import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('..', import.meta.url);
const patterns = [
  /SUPABASE_(SERVICE|ANON|JWT|URL|KEY)/i,
  /DATABASE_URL/i,
  /DIRECT_URL/i,
  /PRIVATE_KEY/i,
  /APPLE_TEAM_ID/i,
  /gho_[A-Za-z0-9_]+/,
  /sk-[A-Za-z0-9_-]{20,}/,
];

const files = await collect(root.pathname);
const failures = [];

for (const file of files) {
  if (!/\.(ts|js|json|md)$/.test(file)) continue;
  if (file.includes('/node_modules/') || file.includes('/dist/')) continue;
  if (file.endsWith('/scripts/check-secrets.mjs')) continue;
  const text = await readFile(file, 'utf8');
  for (const pattern of patterns) {
    if (pattern.test(text)) failures.push(`${path.relative(root.pathname, file)} matches ${pattern}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collect(full));
    else out.push(full);
  }
  return out;
}
