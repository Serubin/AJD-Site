import { NextRequest, NextResponse } from "next/server";

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window counters keyed by `<scope>:<identifier>`.
 *
 * In-process and therefore per-pod: exact at `replicas: 1`, and above that the
 * effective allowance multiplies by pod count. Counters also reset on restart.
 * That is an accepted trade — the alternative is a Redis dependency this app
 * does not otherwise need.
 */
const windows = new Map<string, Window>();

/**
 * Bound on tracked windows. Keys are partly attacker-influenced (a spoofed
 * forwarded-for value, an arbitrary email), so without a cap the map is itself
 * a memory-exhaustion vector. On overflow we prune expired entries first and
 * only clear wholesale if that didn't help; dropping counters fails open for a
 * single window, which beats unbounded growth.
 */
const MAX_WINDOWS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

const ALLOWED: RateLimitResult = { ok: true, retryAfterSeconds: 0 };

function pruneExpired(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    if (windows.size >= MAX_WINDOWS) {
      pruneExpired(now);
      if (windows.size >= MAX_WINDOWS) windows.clear();
    }
    windows.set(key, { count: 1, resetAt: now + opts.windowMs });
    return ALLOWED;
  }

  existing.count += 1;
  if (existing.count > opts.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return ALLOWED;
}

/**
 * Best-effort client address.
 *
 * The app is never exposed directly, so proxy headers are all we have. Take the
 * *last* `x-forwarded-for` entry rather than the first: everything to the left
 * is client-supplied and trivially spoofed, while the rightmost value is the
 * peer the ingress actually observed.
 */
export function clientIp(request: NextRequest): string {
  const cloudflare = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }

  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;

  // Everything unattributable shares one bucket, so an anonymous flood still
  // throttles rather than getting a free pass per request.
  return "unknown";
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

/** Lowercased/trimmed identifier so case and padding variants share a bucket. */
export function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}
