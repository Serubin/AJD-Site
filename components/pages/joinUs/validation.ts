import type { FormErrors } from "./types";

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
  if (!fields.email.trim()) errors.email = "Email is required";
  if (fields.phoneCountryCode === "1" && fields.phoneNational.length > 0 && !fields.phone) {
    errors.phone = "Enter a valid 10-digit number";
  }
  if (fields.states.length === 0) errors.states = "At least one state is required";
  return errors;
}
