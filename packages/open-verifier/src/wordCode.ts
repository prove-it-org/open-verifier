export function normalizeWordCode(value: string): string {
  return value.replace(/[\u00B7·.,\-\s]+/g, '\u00B7').toLowerCase();
}

export function isValidWordCodeShape(wordCode: string): boolean {
  const normalised = normalizeWordCode(wordCode);
  const parts = normalised.split('\u00B7');
  return parts.length === 3
    && parts.every((part) => /^[a-z]{1,8}$/.test(part));
}
