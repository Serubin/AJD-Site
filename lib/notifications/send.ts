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
  return oncePerSlug(options.linkSlug, () => sendUpdateLinkBody(options));
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
    `[Presigned Link] Update link for ${idNote} (no email/SMS sent): ${options.updateUrl}`,
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
    sendSignupConfirmationBody(options),
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
        err,
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
        err,
      );
    }
  }

  console.log(
    `[Signup Confirm] Confirmation link for ${idNote} (no email/SMS sent): ${options.confirmUrl}`,
  );
}
