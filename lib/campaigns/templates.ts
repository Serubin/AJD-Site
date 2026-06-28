import { getPageContent } from "../cms";
import { normalizeTemplate } from "../templates";

const CAMPAIGNS_PAGE = "Campaigns";

/**
 * Appended to the rendered campaign markdown in every marketing email.
 * {{org_address}} renders empty when no postal address is configured.
 */
const DEFAULT_EMAIL_FOOTER = [
  "---",
  "",
  "[View this post online]({{post_url}})",
  "",
  "You are receiving this because you registered with {{app_name}}.",
  "[Unsubscribe]({{unsubscribe_url}}) at any time.",
  "",
  "{{org_address}}",
].join("\n");

/** SMS body sent when a recipient has no usable email on file. */
const DEFAULT_SMS_TEMPLATE = "{{title}} - see our latest post: {{post_url}}";

/** Mandatory opt-out notice appended to every marketing SMS. */
const DEFAULT_SMS_SUFFIX = "Reply STOP to opt out.";

export type CampaignTemplates = {
  emailFooterMarkdown: string;
  smsTemplate: string;
  smsSuffix: string;
};

export async function loadCampaignTemplates(): Promise<CampaignTemplates> {
  const sections = await getPageContent(CAMPAIGNS_PAGE);
  return {
    emailFooterMarkdown:
      normalizeTemplate(sections.EmailFooter?.raw) ?? DEFAULT_EMAIL_FOOTER,
    smsTemplate: normalizeTemplate(sections.SmsTemplate?.raw) ?? DEFAULT_SMS_TEMPLATE,
    smsSuffix: normalizeTemplate(sections.SmsSuffix?.raw) ?? DEFAULT_SMS_SUFFIX,
  };
}
