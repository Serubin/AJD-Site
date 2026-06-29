"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export const FILTER_ALL = "__all__";

/**
 * Mirror a flat filter object into the URL query string. Empty / undefined
 * values are removed; unmanaged params already in the URL (e.g. utm_*) are
 * preserved.
 */
export function useFilterSync(
  params: Record<string, string | undefined | null>,
): void {
  const router = useRouter();
  const pathname = usePathname();
  const serialized = JSON.stringify(params);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") {
        search.delete(key);
      } else {
        search.set(key, value);
      }
    }
    const qs = search.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    const current = window.location.pathname + window.location.search;
    if (next !== current) router.replace(next, { scroll: false });
  }, [serialized, pathname, router, params]);
}
