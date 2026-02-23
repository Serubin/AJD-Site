import { BaseViewDAO } from "./BaseViewDAO";

export interface PresignedLinkRecord {
  Id?: number;
  Slug: string;
  User: { Id: number; Name: string };
  ExpiresAt: string;
  Used: boolean;
}

/**
 * Data Access Object for presigned update links stored in NocoDB.
 * Each link maps a unique slug to a user and has an expiration time.
 */
export class PresignedLinksDAO extends BaseViewDAO {
  constructor() {
    const tableId = process.env.PRESIGNED_LINKS_TABLE_ID;
    const viewId = process.env.PRESIGNED_LINKS_VIEW_ID;

    if (!tableId || !viewId) {
      throw new Error(
        "Missing PresignedLinks configuration: PRESIGNED_LINKS_TABLE_ID and PRESIGNED_LINKS_VIEW_ID must be set"
      );
    }

    super(tableId, viewId, 0);
  }

  /**
   * Create a new presigned link for a user with the given expiration.
   * Generates a random UUID as the slug.
   */
  async createLink(
    userId: number,
    expiresAt: Date
  ): Promise<PresignedLinkRecord> {
    const slug = crypto.randomUUID();
    const expiresAtISO = expiresAt.toISOString();

    const record = await this.createRecord<PresignedLinkRecord>({
      Slug: slug,
      User: userId,
      ExpiresAt: expiresAtISO,
      Used: false,
    });

    return {
      ...record,
      Slug: slug,
      ExpiresAt: expiresAtISO,
      Used: false,
    };
  }

  /**
   * Find an existing valid (not used, not expired) link for a given user.
   * Returns the first match or null.
   */
  async findValidByUserId(userId: number): Promise<PresignedLinkRecord | null> {
    const where = `(Used,eq,false)`;
    const result = await this.listRecords<PresignedLinkRecord>({
      where,
      limit: 100,
    });

    const now = new Date();
    return (
      result.list.find(
        (link) => link.User?.Id === userId && new Date(link.ExpiresAt) >= now
      ) ?? null
    );
  }

  /**
   * Find a presigned link by slug that is still valid (not used and not expired).
   * Returns null if the slug doesn't exist, is expired, or has been used.
   */
  async findBySlug(slug: string): Promise<PresignedLinkRecord | null> {
    const where = `(Slug,eq,${slug})~and(Used,eq,false)`;
    const result = await this.listRecords<PresignedLinkRecord>({
      where,
      limit: 1,
    });

    if (result.list.length === 0) return null;

    const link = result.list[0];

    if (new Date(link.ExpiresAt) < new Date()) {
      return null;
    }

    return link;
  }

  /**
   * Mark a presigned link as used so it cannot be reused.
   */
  async markUsed(id: number): Promise<void> {
    await this.updateRecord(id, { Used: true });
  }
}
