import { getPageContent } from "../cms";
import { normalizeTemplate } from "../templates";

export const APP_NAME = "American Jews for Democracy";
export const LINK_EXPIRY_NOTE =
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

export type NotificationTemplates = {
  updateSubject: string;
  updateBodyMarkdown: string;
  signupSubject: string;
  signupBodyMarkdown: string;
};

export async function loadNotificationTemplates(): Promise<NotificationTemplates> {
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
