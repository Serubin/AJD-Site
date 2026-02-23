import { config } from "./config";
import {
  PresignedLinksDAO,
  type PresignedLinkRecord,
} from "./nocodb/PresignedLinksDAO";

export type { PresignedLinkRecord };

const LINK_EXPIRY_HOURS = 24;

let dao: PresignedLinksDAO | null = null;

function getDAO(): PresignedLinksDAO {
  if (!dao) {
    dao = new PresignedLinksDAO();
  }
  return dao;
}

/**
 * Return an existing valid presigned link for the user, or create a new one
 * with a default 24-hour expiration.
 */
export async function createPresignedLink(
  userId: number
): Promise<PresignedLinkRecord> {
  const existing = await getDAO().findValidByUserId(userId);
  if (existing) return existing;

  const expiresAt = new Date(Date.now() + LINK_EXPIRY_HOURS * 60 * 60 * 1000);
  return getDAO().createLink(userId, expiresAt);
}

/**
 * Find a valid (not expired, not used) presigned link by slug.
 */
export async function findValidLink(
  slug: string
): Promise<PresignedLinkRecord | null> {
  return getDAO().findBySlug(slug);
}

/**
 * Mark a presigned link as used so it cannot be reused.
 */
export async function expireLink(id: number): Promise<void> {
  return getDAO().markUsed(id);
}
