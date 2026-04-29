import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = new URL('..', import.meta.url);
const forbidden = [
  ['..', 'backend'].join('/'),
  ['@prisma', 'client'].join('/'),
  ['@supabase', 'supabase-js'].join('/'),
  'src/lib/prisma',
  'src/config',
];

const files = await collect(root.pathname);
const failures = [];

for (const file of files) {
  if (!/\.(ts|js|json|md|yml|yaml)$/.test(file)) continue;
  if (file.includes('/node_modules/') || file.includes('/dist/')) continue;
  if (file.endsWith('/scripts/check-boundary.mjs')) continue;
  const text = await readFile(file, 'utf8');
  for (const needle of forbidden) {
    if (text.includes(needle)) failures.push(`${path.relative(root.pathname, file)} contains ${needle}`);
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
