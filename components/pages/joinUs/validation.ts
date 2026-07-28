import type { FormErrors } from "./types";

// Mirrors the server-side check (zod .email()): a basic but real format gate so
// "foo" no longer passes. Kept intentionally permissive — the email link is the
// authoritative validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateForm(fields: {
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNational: string;
  phone: string;
  states: string[];
}): FormErrors {
  const errors: FormErrors = {};
  if (!fields.name.trim()) errors.name = "Name is required";
  if (!fields.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_PATTERN.test(fields.email.trim())) {
    errors.email = "Enter a valid email address";
  }
  if (fields.phoneCountryCode === "1" && fields.phoneNational.length > 0 && !fields.phone) {
    errors.phone = "Enter a valid 10-digit number";
  }
  if (fields.states.length === 0) errors.states = "At least one state is required";
  return errors;
}
