import { redirect } from "next/navigation";
import { findValidLink, type PresignedLinkRecord } from "./presignedLinks";
import { findUserById, updateUserVerified, type UserRecord } from "./users";

/**
 * Resolve a presigned link slug to a verified user. Marks the user verified
 * and redirects to /join-us if the link or user is invalid.
 */
export async function loadUserFromValidLink(
  slug: string,
): Promise<{ link: PresignedLinkRecord; user: UserRecord }> {
  const link = await findValidLink(slug);
  if (!link || !link.Id) {
    redirect("/join-us");
  }

  const user = await findUserById(link.User.Id);
  if (!user) {
    redirect("/join-us");
  }

  await updateUserVerified(user.Id!, true);

  return { link, user };
}
