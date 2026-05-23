export const PHONE_AUTH_DOMAIN = "tact-client.com";

export function normalizeEgyptPhone(input?: string | null) {
  if (!input) return "";
  let digits = String(input).trim().replace(/[^\d+]/g, "");
  digits = digits.replace(/^\+/, "").replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(4);
  if (digits.startsWith("20")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

export function phoneToDisplay(input?: string | null) {
  const local = normalizeEgyptPhone(input);
  return local ? `0${local}` : "";
}

export function phoneToProfileValue(input?: string | null) {
  const local = normalizeEgyptPhone(input);
  return local ? `+20${local}` : "";
}

export function phoneToAuthEmail(input?: string | null) {
  const local = normalizeEgyptPhone(input);
  return local ? `${local}@${PHONE_AUTH_DOMAIN}` : "";
}

export function looksLikePhoneLogin(input?: string | null) {
  if (!input) return false;
  return /^[+\d\s().-]+$/.test(String(input).trim()) && normalizeEgyptPhone(input).length >= 8;
}

export function isInternalPhoneEmail(email?: string | null) {
  return !!email && email.toLowerCase().endsWith(`@${PHONE_AUTH_DOMAIN}`);
}
