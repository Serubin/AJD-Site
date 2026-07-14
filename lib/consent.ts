/**
 * Version identifier for the SMS consent disclosure the user agrees to at opt-in.
 *
 * Stored alongside the consent timestamp on the user record so we can prove which
 * disclosure wording a subscriber accepted (TCPA record-keeping). Bump this whenever
 * the disclosure text materially changes — that text lives in the consent checkbox in
 * `components/pages/joinUs/JoinUsForm.tsx`.
 */
export const SMS_CONSENT_VERSION = "2026-07-13";
