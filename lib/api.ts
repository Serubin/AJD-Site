import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "./logger";

export async function parseJsonBody(
  request: NextRequest,
): Promise<Record<string, unknown> | NextResponse> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

export const joinUsPayloadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phone: z.string().optional().default(""),
  states: z.array(z.string()).min(1, "At least one state is required"),
  congressionalDistrict: z.string().optional().default(""),
});

export type JoinUsPayload = z.infer<typeof joinUsPayloadSchema>;

export function buildConflictResponse(
  emailTaken: boolean,
  phoneTaken: boolean,
): NextResponse {
  const errors: Record<string, string> = {};
  if (emailTaken) errors.email = "This email is already registered.";
  if (phoneTaken) errors.phone = "This phone number is already registered.";
  const error =
    emailTaken && phoneTaken
      ? "This email and phone number are already registered."
      : emailTaken
        ? "This email is already registered."
        : "This phone number is already registered.";
  return NextResponse.json({ error, errors }, { status: 409 });
}

export function handleApiError(error: unknown, message: string): NextResponse {
  logger.error(message, { err: error });
  return NextResponse.json({ error: message }, { status: 500 });
}
