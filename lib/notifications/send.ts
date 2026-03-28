import { config } from "../config";
import { smsE164 } from "../phone";
import { renderTemplate, markdownToHtml, markdownToText } from "../templates";
import { oncePerSlug, wasDelivered, markDelivered } from "./dedup";
import { APP_NAME, LINK_EXPIRY_NOTE, loadNotificationTemplates } from "./templates";
import { sendEmail, sendSms } from "./transports";

function trimEmail(value: string | undefined): string | undefined {
  const t = value?.trim();
  if (!t || !t.includes("@")) return undefined;
  return t;
}

interface NotificationOptions {
  linkSlug: string;
  toEmail?: string;
  toPhone?: string;
  userId?: number;
}

interface UpdateOptions extends NotificationOptions {
  kind: "update";
  updateUrl: string;
}

interface SignupOptions extends NotificationOptions {
  kind: "signup";
  name: string;
  confirmUrl: string;
}

type SendOptions = UpdateOptions | SignupOptions;

function resolveTemplateVars(opts: SendOptions): Record<string, string> {
  const base = { app_name: APP_NAME, link_expiry_note: LINK_EXPIRY_NOTE };
  if (opts.kind === "update") {
    return { ...base, update_url: opts.updateUrl };
  }
  return { ...base, name: opts.name, confirm_url: opts.confirmUrl };
}

function resolveSmsBody(opts: SendOptions): string {
  if (opts.kind === "update") {
    return `${APP_NAME}: Update your info: ${opts.updateUrl} (${LINK_EXPIRY_NOTE})`;
  }
  return `${APP_NAME}: Hi ${opts.name}, confirm signup: ${opts.confirmUrl}`;
}

function resolveLogPrefix(opts: SendOptions): string {
  return opts.kind === "update" ? "[Presigned Link]" : "[Signup Confirm]";
}

function resolveUrl(opts: SendOptions): string {
  return opts.kind === "update" ? opts.updateUrl : opts.confirmUrl;
}

async function sendNotificationBody(opts: SendOptions): Promise<void> {
  if (wasDelivered(opts.linkSlug)) return;

  const templates = await loadNotificationTemplates();
  const email = trimEmail(opts.toEmail);
  const phone = smsE164(opts.toPhone);
  const idNote = opts.userId !== undefined ? `user ${opts.userId}` : "user";

  const subjectKey = opts.kind === "update" ? "updateSubject" : "signupSubject";
  const bodyKey = opts.kind === "update" ? "updateBodyMarkdown" : "signupBodyMarkdown";
  const vars = resolveTemplateVars(opts);

  const renderedMarkdown = renderTemplate(templates[bodyKey], vars);
  const textBody = markdownToText(renderedMarkdown);
  const htmlBody = markdownToHtml(renderedMarkdown);
  const subject = renderTemplate(templates[subjectKey], vars);

  if (email && config.sendgrid) {
    try {
      await sendEmail(email, subject, textBody, htmlBody);
      markDelivered(opts.linkSlug);
      return;
    } catch (err) {
      console.error(`[notifications] SendGrid ${opts.kind} failed:`, err);
    }
  }

  if (!email && phone && config.twilioSms) {
    try {
      await sendSms(phone, resolveSmsBody(opts));
      markDelivered(opts.linkSlug);
      return;
    } catch (err) {
      console.error(`[notifications] Twilio ${opts.kind} failed:`, err);
    }
  }

  console.log(
    `${resolveLogPrefix(opts)} Link for ${idNote} (no email/SMS sent): ${resolveUrl(opts)}`,
  );
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
    sendNotificationBody({ kind: "update", ...options }),
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
    sendNotificationBody({ kind: "signup", ...options }),
  );
}
