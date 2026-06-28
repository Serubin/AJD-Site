import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "./config";

/**
 * Stateless, signed unsubscribe tokens. We avoid a DB lookup by encoding the
 * user id and channel into the token and signing it with a server secret, so
 * unsubscribe links never expire and support email one-click opt-out.
 */

export type UnsubscribeChannel = "email";

interface UnsubscribePayload {
  userId: number;
  channel: UnsubscribeChannel;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(data: string, secret: string): string {
  return base64url(createHmac("sha256", secret).update(data).digest());
}

export function createUnsubscribeToken(
  userId: number,
  channel: UnsubscribeChannel = "email",
): string {
  const secret = config.unsubscribeSecret;
  const data = base64url(`${userId}.${channel}`);
  const signature = sign(data, secret);
  return `${data}.${signature}`;
}

export function verifyUnsubscribeToken(
  token: string,
): UnsubscribePayload | null {
  const secret = config.unsubscribeSecret;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  const expected = sign(data, secret);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(
      data.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
  } catch {
    return null;
  }

  const [userIdStr, channel] = decoded.split(".");
  const userId = Number(userIdStr);
  if (!Number.isInteger(userId) || channel !== "email") return null;

  return { userId, channel };
}

/** Build the absolute unsubscribe URL for a user's marketing email. */
export function buildUnsubscribeUrl(userId: number): string {
  const token = createUnsubscribeToken(userId, "email");
  return `${config.app.baseUrl}/unsubscribe/${token}`;
}
