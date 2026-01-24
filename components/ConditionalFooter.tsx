"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

const HIDDEN_PATHS = ["/", "/coming-soon"];

export function ConditionalFooter({ tagline }: { tagline: string }) {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) {
    return null;
  }

  return <Footer tagline={tagline} />;
}
