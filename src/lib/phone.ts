const BD_PHONE_REGEX = /^(?:\+?880)?1[0-9]{9}$/;

export function isValidBDPhone(raw: string): boolean {
  const cleaned = raw.replace(/[\s-]/g, "");
  return BD_PHONE_REGEX.test(cleaned);
}

export function normalizeBDPhone(raw: string): string {
  let cleaned = raw.replace(/[\s-]/g, "");
  if (cleaned.startsWith("+880")) cleaned = cleaned.slice(4);
  else if (cleaned.startsWith("880")) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith("0")) cleaned = cleaned.slice(1);
  return `+880${cleaned}`;
}

export function displayBDPhone(normalized: string): string {
  if (normalized.startsWith("+880")) return `0${normalized.slice(4)}`;
  return normalized;
}
