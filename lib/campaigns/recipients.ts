import { config } from "../config";
import { smsE164 } from "../phone";
import { listAllUsers, type UserRecord } from "../users";

export type ResolvedChannel = "email" | "sms" | "skip";

export interface Recipient {
  user: UserRecord;
  channel: ResolvedChannel;
  email?: string;
  phone?: string;
}

function validEmail(value: string | undefined): string | undefined {
  const t = value?.trim();
  if (!t || !t.includes("@")) return undefined;
  return t;
}

/** A user counts as verified unless explicitly marked Verified=false. */
function isVerified(user: UserRecord): boolean {
  return user.Verified !== false;
}

/**
 * Resolve the delivery channel for a single user, honoring per-channel opt-outs
 * and the global channel kill-switches. Email is preferred; SMS is only used
 * when there is no usable email.
 */
export function resolveChannel(user: UserRecord): Recipient {
  const email = validEmail(user.Email);
  const phone = smsE164(user.Phone);

  if (email && !user.EmailOptedOut && config.emailEnabled) {
    return { user, channel: "email", email, phone };
  }
  if (!email && phone && !user.SmsOptedOut && config.smsEnabled) {
    return { user, channel: "sms", phone };
  }
  return { user, channel: "skip", email, phone };
}

/**
 * Enumerate every verified user and resolve each to a delivery channel.
 * Opted-out and unreachable users resolve to "skip" so they are never messaged.
 */
export async function getCampaignRecipients(): Promise<Recipient[]> {
  const users = await listAllUsers();
  return users
    .filter((user) => typeof user.Id === "number" && isVerified(user))
    .map(resolveChannel);
}
