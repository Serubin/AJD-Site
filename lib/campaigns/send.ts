import { config } from "../config";
import { sendEmail, sendSms } from "../notifications/transports";
import { runExclusive } from "../runExclusive";
import { lazyInit } from "../utils";
import { CampaignsDAO } from "../nocodb/CampaignsDAO";
import { CampaignSendsDAO } from "../nocodb/CampaignSendsDAO";
import { composeEmail, composeSms } from "./compose";
import { getCampaignRecipients, type Recipient } from "./recipients";
import { loadCampaignTemplates, type CampaignTemplates } from "./templates";
import type { CampaignRecord } from "./types";

const getCampaignsDAO = lazyInit(() => new CampaignsDAO());
const getCampaignSendsDAO = lazyInit(() => new CampaignSendsDAO());

/** Number of recipients delivered to concurrently; keeps provider rate limits sane. */
const SEND_CONCURRENCY = 5;

export interface CampaignSendResult {
  campaignId: number;
  emailsSent: number;
  smsSent: number;
  skipped: number;
  failed: number;
}

/** Run an async worker over items with a bounded number in flight. */
async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      for (;;) {
        const index = cursor++;
        if (index >= items.length) return;
        await worker(items[index]);
      }
    },
  );
  await Promise.all(runners);
}

async function deliverOne(
  recipient: Recipient,
  campaign: CampaignRecord,
  templates: CampaignTemplates,
  tally: CampaignSendResult,
): Promise<void> {
  const userId = recipient.user.Id!;
  const sendsDAO = getCampaignSendsDAO();

  if (recipient.channel === "skip") {
    tally.skipped += 1;
    await sendsDAO.recordSend({
      campaignId: campaign.Id!,
      userId,
      channel: "skipped",
      status: "skipped",
    });
    return;
  }

  try {
    if (
      recipient.channel === "email" &&
      recipient.email &&
      config.emailEnabled &&
      config.twilioEmail
    ) {
      const email = composeEmail(campaign, userId, templates);
      await sendEmail(
        recipient.email,
        email.subject,
        email.text,
        email.html,
        email.headers,
        { userId, kind: "campaign", campaignId: campaign.Id },
      );
      tally.emailsSent += 1;
      await sendsDAO.recordSend({
        campaignId: campaign.Id!,
        userId,
        channel: "email",
        status: "sent",
      });
      return;
    }

    if (
      recipient.channel === "sms" &&
      recipient.phone &&
      config.smsEnabled &&
      config.twilioSms
    ) {
      const body = composeSms(campaign, templates);
      await sendSms(recipient.phone, body, {
        userId,
        kind: "campaign",
        campaignId: campaign.Id,
      });
      tally.smsSent += 1;
      await sendsDAO.recordSend({
        campaignId: campaign.Id!,
        userId,
        channel: "sms",
        status: "sent",
      });
      return;
    }

    // Channel resolved but transport not configured: count as skipped, not failed.
    tally.skipped += 1;
    await sendsDAO.recordSend({
      campaignId: campaign.Id!,
      userId,
      channel: "skipped",
      status: "skipped",
      error: "transport not configured",
    });
  } catch (err) {
    tally.failed += 1;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[campaigns] delivery failed for user ${userId}:`, err);
    await sendsDAO.recordSend({
      campaignId: campaign.Id!,
      userId,
      channel: recipient.channel === "sms" ? "sms" : "email",
      status: "failed",
      error: message,
    });
  }
}

/**
 * Send a campaign to all eligible recipients. Idempotent and resumable: users
 * already present in the send log are skipped, so the webhook can safely retry.
 * Publishes the post page before sending so SMS/email links resolve.
 */
export async function sendCampaign(
  campaignId: number,
): Promise<CampaignSendResult> {
  return runExclusive(`campaign:${campaignId}`, async () => {
    const campaignsDAO = getCampaignsDAO();
    const sendsDAO = getCampaignSendsDAO();

    const campaign = await campaignsDAO.findById(campaignId);
    if (!campaign || !campaign.Id) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    if (campaign.Status === "Sent") {
      return {
        campaignId,
        emailsSent: campaign.EmailsSent ?? 0,
        smsSent: campaign.SmsSent ?? 0,
        skipped: campaign.Skipped ?? 0,
        failed: campaign.Failed ?? 0,
      };
    }

    await campaignsDAO.updateStatus(campaign.Id, "Sending", {
      ...(campaign.PublishedAt ? {} : { PublishedAt: new Date().toISOString() }),
    });

    const tally: CampaignSendResult = {
      campaignId,
      emailsSent: 0,
      smsSent: 0,
      skipped: 0,
      failed: 0,
    };

    try {
      const templates = await loadCampaignTemplates();
      const [recipients, processed] = await Promise.all([
        getCampaignRecipients(),
        sendsDAO.listProcessedUserIds(campaign.Id),
      ]);

      const pending = recipients.filter(
        (r) => !processed.has(r.user.Id!),
      );

      await runPool(pending, SEND_CONCURRENCY, (recipient) =>
        deliverOne(recipient, campaign, templates, tally),
      );

      const finalStatus = tally.failed > 0 && tally.emailsSent + tally.smsSent === 0
        ? "Failed"
        : "Sent";

      await campaignsDAO.updateStatus(campaign.Id, finalStatus, {
        SentAt: new Date().toISOString(),
        EmailsSent: (campaign.EmailsSent ?? 0) + tally.emailsSent,
        SmsSent: (campaign.SmsSent ?? 0) + tally.smsSent,
        Skipped: (campaign.Skipped ?? 0) + tally.skipped,
        Failed: (campaign.Failed ?? 0) + tally.failed,
      });

      return tally;
    } catch (err) {
      console.error(`[campaigns] send failed for campaign ${campaignId}:`, err);
      await campaignsDAO.updateStatus(campaign.Id, "Failed");
      throw err;
    }
  });
}
