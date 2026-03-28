/** Slugs we already delivered on this instance; pruned after link TTL to bound memory. */
const DEDUPE_TTL_MS = 25 * 60 * 60 * 1000;
const deliveredSlugs = new Map<string, number>();
const inflightBySlug = new Map<string, Promise<void>>();

function pruneDeliveredSlugs(): void {
  const cutoff = Date.now() - DEDUPE_TTL_MS;
  for (const [slug, at] of deliveredSlugs) {
    if (at < cutoff) deliveredSlugs.delete(slug);
  }
}

export function wasDelivered(slug: string): boolean {
  pruneDeliveredSlugs();
  return deliveredSlugs.has(slug);
}

export function markDelivered(slug: string): void {
  deliveredSlugs.set(slug, Date.now());
}

/**
 * Coalesce concurrent calls for the same slug and skip if already delivered.
 * At most one in-flight attempt per slug; duplicate callers share the same promise.
 */
export async function oncePerSlug(
  slug: string,
  work: () => Promise<void>,
): Promise<void> {
  const existing = inflightBySlug.get(slug);
  if (existing) return existing;

  const run = (async () => {
    if (wasDelivered(slug)) return;
    await work();
  })().finally(() => {
    if (inflightBySlug.get(slug) === run) inflightBySlug.delete(slug);
  });

  inflightBySlug.set(slug, run);
  return run;
}
