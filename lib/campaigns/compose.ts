import { config } from "../config";
import { APP_NAME } from "../notifications/templates";
import { renderTemplate, markdownToHtml, markdownToText } from "../templates";
import { createUnsubscribeToken } from "../unsubscribe";
import type { CampaignRecord } from "./types";
import type { CampaignTemplates } from "./templates";

export function buildPostUrl(slug: string): string {
  return `${config.app.baseUrl}/posts/${slug}`;
}

function buildOneClickUnsubscribeUrl(userId: number): string {
  const token = createUnsubscribeToken(userId, "email");
  return `${config.app.baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`;
}

export interface ComposedEmail {
  subject: string;
  text: string;
  html: string;
  headers: Record<string, string>;
}

/**
 * Build a compliant marketing email: campaign body + footer with an unsubscribe
 * link and postal address, plus List-Unsubscribe headers for one-click opt-out.
 */
export function composeEmail(
  campaign: CampaignRecord,
  userId: number,
  templates: CampaignTemplates,
): ComposedEmail {
  const subject = campaign.EmailSubject?.trim() || campaign.Title;
  const postUrl = buildPostUrl(campaign.Slug);
  const unsubscribeUrl = `${config.app.baseUrl}/unsubscribe/${createUnsubscribeToken(userId, "email")}`;
  const oneClickUrl = buildOneClickUnsubscribeUrl(userId);
  const { orgPostalAddress } = config.campaignSending;

  const footer = renderTemplate(templates.emailFooterMarkdown, {
    app_name: APP_NAME,
    post_url: postUrl,
    unsubscribe_url: unsubscribeUrl,
    org_address: orgPostalAddress,
  });

  const fullMarkdown = `${campaign.BodyMarkdown.trim()}\n\n${footer}`;

  return {
    subject,
    text: markdownToText(fullMarkdown),
    html: markdownToHtml(fullMarkdown),
    headers: {
      "List-Unsubscribe": `<${oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

/**
 * Build a marketing SMS body. Always ends with the opt-out notice so every
 * campaign text is compliant (transactional one-time codes are exempt and use
 * a different code path).
 */
export function composeSms(
  campaign: CampaignRecord,
  templates: CampaignTemplates,
): string {
  const postUrl = buildPostUrl(campaign.Slug);
  const base = (
    campaign.SmsOverride?.trim() ||
    renderTemplate(templates.smsTemplate, {
      title: campaign.Title,
      post_url: postUrl,
      app_name: APP_NAME,
    })
  ).trim();

  const suffix = templates.smsSuffix.trim();
  if (base.toLowerCase().includes("stop")) return base;
  return `${base}\n\n${suffix}`;
}
