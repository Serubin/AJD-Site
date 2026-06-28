import { config } from "@/lib/config";
import { BaseViewDAO } from "./BaseViewDAO";
import type {
  CampaignSendRecord,
  SendChannel,
  SendStatus,
} from "../campaigns/types";

/**
 * Data Access Object for the per-recipient campaign send log.
 * One row per (campaign, user) makes campaign delivery idempotent and resumable:
 * a re-triggered send skips users that already have a row.
 */
export class CampaignSendsDAO extends BaseViewDAO {
  constructor() {
    const { tableId, viewId } = config.campaignSends;
    super(tableId, viewId, 0);
  }

  /**
   * Return the set of user IDs already processed for a campaign so the
   * orchestrator can resume without re-sending.
   */
  async listProcessedUserIds(campaignId: number): Promise<Set<number>> {
    const processed = new Set<number>();
    let offset = 0;
    const pageSize = 200;

    for (;;) {
      const result = await this.listRecords<CampaignSendRecord>({
        limit: pageSize,
        offset,
      });
      for (const row of result.list) {
        const rowCampaignId =
          typeof row.Campaign === "number" ? row.Campaign : row.Campaign?.Id;
        if (rowCampaignId !== campaignId) continue;
        const userId =
          typeof row.User === "number" ? row.User : row.User?.Id;
        if (typeof userId === "number") processed.add(userId);
      }
      if (result.pageInfo?.isLastPage || result.list.length === 0) break;
      offset += result.list.length;
    }

    return processed;
  }

  async recordSend(input: {
    campaignId: number;
    userId: number;
    channel: SendChannel;
    status: SendStatus;
    error?: string;
  }): Promise<void> {
    await this.createRecord({
      Campaign: input.campaignId,
      User: input.userId,
      Channel: input.channel,
      Status: input.status,
      Error: input.error ?? null,
      SentAt: new Date().toISOString(),
    });
  }
}
