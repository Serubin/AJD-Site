import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Create a lazy-initialized singleton from a factory function. */
export function lazyInit<T>(factory: () => T): () => T {
  let instance: T | undefined;
  return () => {
    if (instance === undefined) instance = factory();
    return instance;
  };
}

/**
 * Add our attribution param to an outbound action URL, keyed off the
 * destination host: ActBlue uses `refcode`, Mobilize uses `utm_source`.
 * Existing values for that param are overwritten. Unknown hosts and
 * malformed/relative URLs are returned untouched.
 */
export function withTracking(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === "actblue.com" || host.endsWith(".actblue.com")) {
      u.searchParams.set("refcode", "aj4d");
    } else if (host === "mobilize.us" || host.endsWith(".mobilize.us")) {
      u.searchParams.set("utm_source", "aj4d");
    }
    return u.toString();
  } catch {
    return url;
  }
}
