import {
  PresignedLinksDAO,
  type PresignedLinkRecord,
} from "./nocodb/PresignedLinksDAO";
import { runExclusive } from "./runExclusive";

export type { PresignedLinkRecord };

const LINK_EXPIRY_HOURS = 24;

let dao: PresignedLinksDAO | null = null;

function getDAO(): PresignedLinksDAO {
  if (!dao) {
    dao = new PresignedLinksDAO();
  }
  return dao;
}

export type CreatePresignedLinkResult = {
  link: PresignedLinkRecord;
  /** True only when a new row was inserted; false when reusing an existing valid link. */
  isNew: boolean;
};

/**
 * Return an existing valid presigned link for the user, or create a new one
 * with a default 24-hour expiration. Per-user serialization avoids duplicate
 * rows and duplicate notifications under concurrent requests.
 */
export async function createPresignedLink(
  userId: number
): Promise<CreatePresignedLinkResult> {
  return runExclusive(`presigned-link:${userId}`, async () => {
    const existing = await getDAO().findValidByUserId(userId);
    if (existing) return { link: existing, isNew: false };

    const expiresAt = new Date(
      Date.now() + LINK_EXPIRY_HOURS * 60 * 60 * 1000
    );
    const link = await getDAO().createLink(userId, expiresAt);
    return { link, isNew: true };
  });
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
