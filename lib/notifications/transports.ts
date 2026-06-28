import twilio from "twilio";
import { config } from "../config";
import { logger } from "../logger";

const TWILIO_EMAIL_API_URL = "https://comms.twilio.com/v1/Emails";

const log = logger.child({ component: "comms" });

/**
 * Optional context attached to outbound-comm log lines. Carries the recipient's
 * user id and originating flow so a sent message can be correlated to a user
 * without logging their (redacted) email/phone address.
 */
export interface CommContext {
  userId?: number;
  /** Originating flow, e.g. "signup", "update", "campaign". */
  kind?: string;
  campaignId?: number;
  slug?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  headers?: Record<string, string>,
  context?: CommContext,
): Promise<void> {
  const email = config.twilioEmail;
  if (!email) return;

  const credentials = Buffer.from(
    `${email.accountSid}:${email.authToken}`,
  ).toString("base64");

  const content: Record<string, unknown> = { subject, text };
  if (html) content.html = html;
  if (headers) content.headers = headers;

  const response = await fetch(TWILIO_EMAIL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { address: email.fromEmail, name: email.fromName },
      to: [{ address: to }],
      content,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Twilio Email API error (${response.status}): ${body || response.statusText}`,
    );
  }

  log.info("comm sent", {
    channel: "email",
    userId: context?.userId,
    kind: context?.kind,
    campaignId: context?.campaignId,
    slug: context?.slug,
    subject,
    body: text,
  });
}

export async function sendSms(
  to: string,
  body: string,
  context?: CommContext,
): Promise<void> {
  const sms = config.twilioSms;
  if (!sms) return;
  const client = twilio(sms.accountSid, sms.authToken);
  await client.messages.create({
    body,
    from: sms.messagingPhoneNumber,
    to,
  });

  log.info("comm sent", {
    channel: "sms",
    userId: context?.userId,
    kind: context?.kind,
    campaignId: context?.campaignId,
    slug: context?.slug,
    body,
  });
}
