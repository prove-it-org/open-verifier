import { threeWordCode, threeWordsAtOffset } from './hashWordMapper.js';

export function normalizeWordCode(value: string): string {
  return value.replace(/[\u00B7·.,\-\s]+/g, '\u00B7').toLowerCase();
}

export function candidateWordCodes(hash: string): string[] {
  return [0, 6, 12, 18, 24].map((offset) => (
    threeWordsAtOffset(hash, offset).join('\u00B7').toLowerCase()
  ));
}

export function isValidWordCodeForHash(hash: string, wordCode: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(hash)) return false;

  const normalised = normalizeWordCode(wordCode);
  const parts = normalised.split('\u00B7');
  if (parts.length !== 3 && parts.length !== 4) return false;
  if (!parts.slice(0, 3).every((part) => part.length >= 2)) return false;
  if (parts.length === 4 && !/^[1-9]\d*$/.test(parts[3])) return false;

  const primary = threeWordCode(hash).toLowerCase();
  const numericSuffixCode = parts.length === 4 && normalised.startsWith(`${primary}\u00B7`);
  return candidateWordCodes(hash).includes(normalised) || numericSuffixCode;
}
