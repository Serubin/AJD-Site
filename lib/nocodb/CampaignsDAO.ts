import { config } from "@/lib/config";
import { BaseViewDAO } from "./BaseViewDAO";
import type { CampaignRecord, CampaignStatus } from "../campaigns/types";

/**
 * Data Access Object for marketing campaigns stored in NocoDB.
 * Campaigns hold the markdown body that is rendered to the public post page,
 * delivered as email, or summarized in an SMS.
 */
export class CampaignsDAO extends BaseViewDAO {
  constructor() {
    const { tableId, viewId } = config.campaigns;
    super(tableId, viewId, 0);
  }

  async findById(id: number): Promise<CampaignRecord | null> {
    const where = `(Id,eq,${id})`;
    const result = await this.listRecords<CampaignRecord>({ where, limit: 1 });
    return result.list.length > 0 ? result.list[0] : null;
  }

  async findBySlug(slug: string): Promise<CampaignRecord | null> {
    const where = `(Slug,eq,${slug})`;
    const result = await this.listRecords<CampaignRecord>({ where, limit: 1 });
    return result.list.length > 0 ? result.list[0] : null;
  }

  /**
   * Find a campaign by slug only when it has been published.
   * Used by the public post page so unpublished drafts stay hidden.
   */
  async findPublishedBySlug(slug: string): Promise<CampaignRecord | null> {
    const campaign = await this.findBySlug(slug);
    if (!campaign || !campaign.PublishedAt) return null;
    return campaign;
  }

  async updateStatus(
    id: number,
    status: CampaignStatus,
    extra?: Partial<CampaignRecord>,
  ): Promise<void> {
    await this.updateRecord(id, { Status: status, ...extra });
  }
}
