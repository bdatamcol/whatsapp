const INVALID_NAME_PATTERNS = [
  /\bdesconocid[oa]\b/i,
  /^n\/?a$/i,
  /\bsin\s+nombre\b/i,
  /\busuario\s*\d+\b/i,
  /\bcampan[aa]\b/i,
  /\blead(s)?\b/i,
  /\bfacebook\b/i,
  /\bwhatsapp\b/i,
  /\bmeta\b/i,
  /\bcrm\b/i,
  /https?:\/\//i,
  /www\./i,
];

function normalizeSpaces(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function titleCase(input: string): string {
  return input
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function sanitizeCustomerName(input: string): string | undefined {
  if (!input) return undefined;

  let cleaned = input;
  cleaned = cleaned.replace(/\([^)]*\)/g, ' ');
  cleaned = cleaned.replace(/[\[\]{}<>]/g, ' ');
  cleaned = normalizeSpaces(cleaned);

  cleaned = cleaned.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
  cleaned = normalizeSpaces(cleaned);

  if (!cleaned) return undefined;
  if (!/[\p{L}]/u.test(cleaned)) return undefined;

  if (cleaned.length > 40) {
    cleaned = cleaned.slice(0, 40).trim();
  }

  return titleCase(cleaned);
}

export function isUsableCustomerName(input: string | undefined): boolean {
  if (!input) return false;

  const name = normalizeSpaces(input);
  if (name.length < 2 || name.length > 40) return false;
  if (!/[\p{L}]/u.test(name)) return false;

  for (const pattern of INVALID_NAME_PATTERNS) {
    if (pattern.test(name)) return false;
  }

  return true;
}
