"use server";

import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  zipCode: z.string().optional(),
  message: z.string().optional(),
});

export type ContactFormState = {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
    states?: string[];
    congressionalDistrict?: string[];
  };
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    zipCode: formData.get("zipCode"),
    message: formData.get("message"),
  };

  const validatedFields = contactSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // TODO: When server is implemented, make actual API call
  // For now, simulate a successful submission
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // In production, this would call your API endpoint:
    // const response = await fetch('/api/contacts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(validatedFields.data),
    // });
    
    return {
      success: true,
      message: "Thank you for reaching out. We will be in touch shortly.",
    };
  } catch {
    return {
      success: false,
      message: "Failed to submit form. Please try again.",
    };
  }
}
