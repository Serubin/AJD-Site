import { config } from "../config";
import { logger } from "../logger";
import { smsE164 } from "../phone";
import { renderTemplate, markdownToHtml, markdownToText } from "../templates";
import { oncePerSlug, wasDelivered, markDelivered } from "./dedup";
import { APP_NAME, LINK_EXPIRY_NOTE, loadNotificationTemplates } from "./templates";
import { sendEmail, sendSms } from "./transports";

const log = logger.child({ component: "notifications" });

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
  /** When true, suppress the SMS fallback: the user has opted out of SMS. */
  smsOptedOut?: boolean;
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

/** Outcome of an attempt to deliver a link, used to keep the UI truthful. */
export type DeliveryResult = {
  delivered: boolean;
  channel: "email" | "sms" | null;
};

const ALREADY_DELIVERED: DeliveryResult = { delivered: true, channel: null };

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

function resolveUrl(opts: SendOptions): string {
  return opts.kind === "update" ? opts.updateUrl : opts.confirmUrl;
}

async function sendNotificationBody(opts: SendOptions): Promise<DeliveryResult> {
  if (wasDelivered(opts.linkSlug)) {
    log.debug("notification skipped: already delivered on this instance", {
      kind: opts.kind,
      userId: opts.userId,
      slug: opts.linkSlug,
    });
    return ALREADY_DELIVERED;
  }

  const templates = await loadNotificationTemplates();
  const email = trimEmail(opts.toEmail);
  const phone = smsE164(opts.toPhone);

  log.debug("notification dispatch", {
    kind: opts.kind,
    userId: opts.userId,
    slug: opts.linkSlug,
    hasEmail: !!email,
    hasPhone: !!phone,
    emailConfigured: !!config.twilioEmail,
    smsConfigured: !!config.twilioSms,
  });

  const subjectKey = opts.kind === "update" ? "updateSubject" : "signupSubject";
  const bodyKey = opts.kind === "update" ? "updateBodyMarkdown" : "signupBodyMarkdown";
  const vars = resolveTemplateVars(opts);

  const renderedMarkdown = renderTemplate(templates[bodyKey], vars);
  const textBody = markdownToText(renderedMarkdown);
  const htmlBody = markdownToHtml(renderedMarkdown);
  const subject = renderTemplate(templates[subjectKey], vars);

  // Email is preferred when present; SMS is only a fallback for users without
  // an email. A channel must be both enabled and configured to be attempted.
  if (email && config.emailEnabled && config.twilioEmail) {
    try {
      await sendEmail(email, subject, textBody, htmlBody, undefined, {
        userId: opts.userId,
        kind: opts.kind,
        slug: opts.linkSlug,
      });
      markDelivered(opts.linkSlug);
      return { delivered: true, channel: "email" };
    } catch (err) {
      log.error("Twilio email send failed", { err, kind: opts.kind });
    }
  }

  if (!email && phone && config.smsEnabled && config.twilioSms) {
    if (opts.smsOptedOut) {
      log.info("transactional SMS suppressed: user opted out of SMS", {
        kind: opts.kind,
        userId: opts.userId,
      });
      return { delivered: false, channel: null };
    }
    try {
      await sendSms(phone, resolveSmsBody(opts), {
        userId: opts.userId,
        kind: opts.kind,
        slug: opts.linkSlug,
      });
      markDelivered(opts.linkSlug);
      return { delivered: true, channel: "sms" };
    } catch (err) {
      log.error("Twilio SMS send failed", { err, kind: opts.kind });
    }
  }

  // Reaching here means no channel delivered. Surface the specific reason so a
  // silent non-send is debuggable from the logs alone.
  let reason: string;
  if (!email && !phone) {
    reason = "no valid email or phone on record";
  } else if (email && !config.emailEnabled) {
    reason = "email present but email channel is disabled (SMS is skipped when an email exists)";
  } else if (email && !config.twilioEmail) {
    reason = "email present but email transport not configured (SMS is skipped when an email exists)";
  } else if (email) {
    reason = "email channel enabled and configured but send threw (see prior error)";
  } else if (phone && !config.smsEnabled) {
    reason = "phone present but SMS channel is disabled";
  } else if (phone && !config.twilioSms) {
    reason = "phone present but SMS transport not configured";
  } else {
    reason = "SMS channel enabled and configured but send threw (see prior error)";
  }

  log.warn("link not delivered", {

    kind: opts.kind,
    userId: opts.userId,
    reason,
    hasEmail: !!email,
    hasPhone: !!phone,
    emailConfigured: !!config.twilioEmail,
    smsConfigured: !!config.twilioSms,
    url: resolveUrl(opts),
  });
  return { delivered: false, channel: null };
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
  smsOptedOut?: boolean;
}): Promise<DeliveryResult> {
  return oncePerSlug(
    options.linkSlug,
    () => sendNotificationBody({ kind: "update", ...options }),
    () => ALREADY_DELIVERED,
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
  smsOptedOut?: boolean;
}): Promise<DeliveryResult> {
  return oncePerSlug(
    options.linkSlug,
    () => sendNotificationBody({ kind: "signup", ...options }),
    () => ALREADY_DELIVERED,
  );
}
