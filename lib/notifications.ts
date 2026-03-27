import sgMail from "@sendgrid/mail";

import { marked } from "marked";
import twilio from "twilio";
import { config } from "./config";
import { getPageContent } from "./cms";
import { parseStoredPhone, toE164 } from "./phone";

const APP_NAME = "American Jews for Democracy";
const LINK_EXPIRY_NOTE =
  "This link expires in 24 hours. If you did not request it, you can ignore this message.";
const NOTIFICATIONS_PAGE = "Notifications";

const DEFAULT_UPDATE_SUBJECT = `Update your information - ${APP_NAME}`;
const DEFAULT_UPDATE_BODY = [
  `${APP_NAME}`,
  "",
  "Use this link to update your information:",
  "{{update_url}}",
  "",
  "{{link_expiry_note}}",
].join("\n");

const DEFAULT_SIGNUP_SUBJECT = `Confirm your signup - ${APP_NAME}`;
const DEFAULT_SIGNUP_BODY = [
  "Hi {{name}},",
  "",
  `Thank you for signing up with ${APP_NAME}.`,
  "",
  "Please confirm your email by opening this link:",
  "{{confirm_url}}",
  "",
  "{{link_expiry_note}}",
].join("\n");

/** Slugs we already delivered on this instance; pruned after link TTL to bound memory. */
const DEDUPE_TTL_MS = 25 * 60 * 60 * 1000;
const deliveredSlugs = new Map<string, number>();
const inflightBySlug = new Map<string, Promise<void>>();

function pruneDeliveredSlugs(): void {
  const cutoff = Date.now() - DEDUPE_TTL_MS;
  for (const [slug, at] of deliveredSlugs) {
    if (at < cutoff) deliveredSlugs.delete(slug);
  }
}

function wasDelivered(slug: string): boolean {
  pruneDeliveredSlugs();
  return deliveredSlugs.has(slug);
}

function markDelivered(slug: string): void {
  deliveredSlugs.set(slug, Date.now());
}

async function oncePerSlug(slug: string, work: () => Promise<void>): Promise<void> {
  const existing = inflightBySlug.get(slug);
  if (existing) return existing;

  const run = (async () => {
    if (wasDelivered(slug)) return;
    await work();
  })().finally(() => {
    if (inflightBySlug.get(slug) === run) inflightBySlug.delete(slug);
  });

  inflightBySlug.set(slug, run);
  return run;
}

function trimEmail(value: string | undefined): string | undefined {
  const t = value?.trim();
  if (!t || !t.includes("@")) return undefined;
  return t;
}

function normalizeTemplate(input: string | undefined): string | undefined {
  const trimmed = input?.trim();
  return trimmed ? trimmed : undefined;
}

function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] ?? "";
  });
}

function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false, breaks: true }) as string;
}

function markdownToText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_~>#-]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type NotificationTemplates = {
  updateSubject: string;
  updateBodyMarkdown: string;
  signupSubject: string;
  signupBodyMarkdown: string;
};

async function loadNotificationTemplates(): Promise<NotificationTemplates> {
  const sections = await getPageContent(NOTIFICATIONS_PAGE);
  return {
    updateSubject:
      normalizeTemplate(sections.UpdateLinkSubject?.raw) ?? DEFAULT_UPDATE_SUBJECT,
    updateBodyMarkdown:
      normalizeTemplate(sections.UpdateLinkBody?.raw) ?? DEFAULT_UPDATE_BODY,
    signupSubject:
      normalizeTemplate(sections.SignupConfirmSubject?.raw) ??
      DEFAULT_SIGNUP_SUBJECT,
    signupBodyMarkdown:
      normalizeTemplate(sections.SignupConfirmBody?.raw) ?? DEFAULT_SIGNUP_BODY,
  };
}

/** Normalize stored or form phone to E.164 for Twilio. */
function smsE164(value: string | undefined): string | undefined {
  const t = value?.trim();
  if (!t) return undefined;
  const { countryCode, nationalDigits } = parseStoredPhone(t);
  const e164 = toE164(countryCode, nationalDigits);
  return e164 || undefined;
}

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<void> {
  const sg = config.sendgrid;
  if (!sg) return;
  sgMail.setApiKey(sg.apiKey);
  await sgMail.send({
    to,
    from: sg.fromEmail,
    subject,
    text,
    ...(html ? { html } : {}),
  });
}

async function sendSms(to: string, body: string): Promise<void> {
  const sms = config.twilioSms;
  if (!sms) return;
  const client = twilio(sms.accountSid, sms.authToken);
  await client.messages.create({
    body,
    from: sms.messagingPhoneNumber,
    to,
  });
}

/**
 * Sends the presigned update link: email if a valid email exists, else SMS if phone is valid.
 * Same `linkSlug` is never delivered twice on this instance; concurrent calls share one attempt.
 */
export async function sendUpdateLink(options: {
  linkSlug: string;
  toEmail?: string;
  toPhone?: string;
  updateUrl: string;
  userId?: number;
}): Promise<void> {
  return oncePerSlug(options.linkSlug, () =>
    sendUpdateLinkBody(options)
  );
}

async function sendUpdateLinkBody(options: {
  linkSlug: string;
  toEmail?: string;
  toPhone?: string;
  updateUrl: string;
  userId?: number;
}): Promise<void> {
  if (wasDelivered(options.linkSlug)) return;

  const templates = await loadNotificationTemplates();
  const email = trimEmail(options.toEmail);
  const phone = smsE164(options.toPhone);
  const idNote =
    options.userId !== undefined ? `user ${options.userId}` : "user";
  const renderedMarkdown = renderTemplate(templates.updateBodyMarkdown, {
    app_name: APP_NAME,
    update_url: options.updateUrl,
    link_expiry_note: LINK_EXPIRY_NOTE,
  });
  const textBody = markdownToText(renderedMarkdown);
  const htmlBody = markdownToHtml(renderedMarkdown);
  const subject = renderTemplate(templates.updateSubject, {
    app_name: APP_NAME,
    update_url: options.updateUrl,
  });

  if (email && config.sendgrid) {
    try {
      await sendEmail(email, subject, textBody, htmlBody);
      markDelivered(options.linkSlug);
      return;
    } catch (err) {
      console.error("[notifications] SendGrid sendUpdateLink failed:", err);
    }
  }

  if (!email && phone && config.twilioSms) {
    try {
      const smsBody = `${APP_NAME}: Update your info: ${options.updateUrl} (${LINK_EXPIRY_NOTE})`;
      await sendSms(phone, smsBody);
      markDelivered(options.linkSlug);
      return;
    } catch (err) {
      console.error("[notifications] Twilio sendUpdateLink failed:", err);
    }
  }

  console.log(
    `[Presigned Link] Update link for ${idNote} (no email/SMS sent): ${options.updateUrl}`
  );
}

/**
 * Post-signup confirmation with verify link; email preferred, else SMS.
 */
export async function sendSignupConfirmation(options: {
  linkSlug: string;
  toEmail?: string;
  toPhone?: string;
  name: string;
  confirmUrl: string;
  userId?: number;
}): Promise<void> {
  return oncePerSlug(options.linkSlug, () =>
    sendSignupConfirmationBody(options)
  );
}

async function sendSignupConfirmationBody(options: {
  linkSlug: string;
  toEmail?: string;
  toPhone?: string;
  name: string;
  confirmUrl: string;
  userId?: number;
}): Promise<void> {
  if (wasDelivered(options.linkSlug)) return;

  const templates = await loadNotificationTemplates();
  const email = trimEmail(options.toEmail);
  const phone = smsE164(options.toPhone);
  const idNote =
    options.userId !== undefined ? `user ${options.userId}` : "user";
  const renderedMarkdown = renderTemplate(templates.signupBodyMarkdown, {
    app_name: APP_NAME,
    name: options.name,
    confirm_url: options.confirmUrl,
    link_expiry_note: LINK_EXPIRY_NOTE,
  });
  const textBody = markdownToText(renderedMarkdown);
  const htmlBody = markdownToHtml(renderedMarkdown);
  const subject = renderTemplate(templates.signupSubject, {
    app_name: APP_NAME,
    name: options.name,
    confirm_url: options.confirmUrl,
  });

  if (email && config.sendgrid) {
    try {
      await sendEmail(email, subject, textBody, htmlBody);
      markDelivered(options.linkSlug);
      return;
    } catch (err) {
      console.error(
        "[notifications] SendGrid sendSignupConfirmation failed:",
        err
      );
    }
  }

  if (!email && phone && config.twilioSms) {
    try {
      const smsBody = `${APP_NAME}: Hi ${options.name}, confirm signup: ${options.confirmUrl}`;
      await sendSms(phone, smsBody);
      markDelivered(options.linkSlug);
      return;
    } catch (err) {
      console.error(
        "[notifications] Twilio sendSignupConfirmation failed:",
        err
      );
    }
  }

  console.log(
    `[Signup Confirm] Confirmation link for ${idNote} (no email/SMS sent): ${options.confirmUrl}`
  );
}
