/**
 * Phone normalization and formatting for the get-involved form.
 * US display format (xxx) xxx-xxxx; storage as E.164 so API/NocoDB stay unchanged.
 */

/**
 * Format up to 10 digits as (xxx) xxx-xxxx (with optional trailing partial).
 */
export function formatNationalUS(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * Strip non-digits from national number and return E.164 (e.g. +15555551234).
 * For US (+1) expects 10 digits; otherwise returns partial or empty if invalid.
 */
export function toE164(countryCode: string, nationalDigits: string): string {
  const code = countryCode.replace(/\D/g, "") || "1";
  const digits = nationalDigits.replace(/\D/g, "");
  if (code === "1" && digits.length !== 10) return "";
  if (code !== "1") {
    // Other countries: require some digits; no strict length for now
    if (digits.length === 0) return "";
    return `+${code}${digits}`;
  }
  return `+${code}${digits}`;
}

/**
 * Parse a stored phone (E.164 or legacy) for prefill.
 * Legacy values without + are treated as US 10-digit national.
 */
export function parseStoredPhone(
  stored: string
): { countryCode: string; nationalDigits: string } {
  const trimmed = (stored || "").trim();
  if (!trimmed) return { countryCode: "1", nationalDigits: "" };

  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+")) {
    // US/Canada: +1 followed by 10 national digits
    if (digits.startsWith("1") && digits.length >= 11) {
      return { countryCode: "1", nationalDigits: digits.slice(1, 11) };
    }
    if (digits.startsWith("1")) {
      return { countryCode: "1", nationalDigits: digits.slice(1) };
    }
    // Other: 2-digit country code (e.g. 44, 33), rest is national
    if (digits.length >= 2) {
      const code = digits.slice(0, 2);
      return { countryCode: code, nationalDigits: digits.slice(2) };
    }
    return { countryCode: digits || "1", nationalDigits: "" };
  }

  // Legacy: no +, assume US 10-digit national
  return { countryCode: "1", nationalDigits: digits.slice(0, 10) };
}
