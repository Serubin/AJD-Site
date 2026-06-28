import { redirect } from "next/navigation";
import { logger } from "./logger";
import { findValidLink, type PresignedLinkRecord } from "./presignedLinks";
import { findUserById, updateUserVerified, type UserRecord } from "./users";

const log = logger.child({ component: "presigned-links" });

/**
 * Resolve a presigned link slug to a verified user. Marks the user verified
 * and redirects to /join-us if the link or user is invalid.
 */
export async function loadUserFromValidLink(
  slug: string,
): Promise<{ link: PresignedLinkRecord; user: UserRecord }> {
  const link = await findValidLink(slug);
  if (!link || !link.Id) {
    log.warn("presigned slug invalid/expired", { slug });
    redirect("/join-us");
  }

  const user = await findUserById(link.User.Id);
  if (!user) {
    log.warn("presigned slug invalid/expired", { slug, linkId: link.Id });
    redirect("/join-us");
  }

  await updateUserVerified(user.Id!, true);
  log.info("presigned slug resolved", {
    slug,
    linkId: link.Id,
    userId: user.Id,
  });

  return { link, user };
}
