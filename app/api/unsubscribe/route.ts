import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api";
import { setEmailOptedOut } from "@/lib/users";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

export const runtime = "nodejs";

async function resolveToken(request: NextRequest): Promise<string | null> {
  const queryToken = request.nextUrl.searchParams.get("token");
  if (queryToken) return queryToken;
  try {
    const body = (await request.json()) as { token?: string };
    return body.token ?? null;
  } catch {
    return null;
  }
}

/**
 * Opt a user out of marketing email. Accepts the token via query string
 * (email one-click List-Unsubscribe-Post) or JSON body (confirmation page).
 */
export async function POST(request: NextRequest) {
  const token = await resolveToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    await setEmailOptedOut(payload.userId, true);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to unsubscribe");
  }
}
