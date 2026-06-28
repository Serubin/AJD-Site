import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { config } from "@/lib/config";
import { parseStoredPhone } from "@/lib/phone";
import { findUserByPhone, setSmsOptedOut } from "@/lib/users";

export const runtime = "nodejs";

const STOP_KEYWORDS = new Set([
  "STOP",
  "STOPALL",
  "UNSUBSCRIBE",
  "CANCEL",
  "END",
  "QUIT",
]);
const START_KEYWORDS = new Set(["START", "YES", "UNSTOP"]);

function twiml(body = ""): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

/** Locate a user by inbound phone, tolerating E.164 vs legacy national storage. */
async function findUserByInboundPhone(from: string) {
  const direct = await findUserByPhone(from);
  if (direct) return direct;
  const { nationalDigits } = parseStoredPhone(from);
  if (nationalDigits && nationalDigits !== from) {
    return findUserByPhone(nationalDigits);
  }
  return null;
}

export async function POST(request: NextRequest) {
  const sms = config.twilioSms;
  if (!sms) {
    return NextResponse.json({ error: "SMS not configured" }, { status: 503 });
  }

  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") params[key] = value;
  }

  const signature = request.headers.get("x-twilio-signature") ?? "";
  const url = `${config.app.baseUrl}/api/twilio/inbound`;
  const valid = twilio.validateRequest(sms.authToken, signature, url, params);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const from = (params.From ?? "").trim();
  const keyword = (params.Body ?? "").trim().toUpperCase();

  if (!from || (!STOP_KEYWORDS.has(keyword) && !START_KEYWORDS.has(keyword))) {
    return twiml();
  }

  try {
    const user = await findUserByInboundPhone(from);
    if (user?.Id) {
      if (STOP_KEYWORDS.has(keyword)) {
        await setSmsOptedOut(user.Id, true);
      } else if (START_KEYWORDS.has(keyword)) {
        await setSmsOptedOut(user.Id, false);
      }
    }
  } catch (err) {
    console.error("[twilio] failed to sync opt-out:", err);
  }

  // Empty TwiML: Twilio's Advanced Opt-Out handles the carrier-required reply.
  return twiml();
}
