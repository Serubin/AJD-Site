"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export function ConditionalFooter({ tagline }: { tagline: string}) {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return <Footer tagline={tagline} />;
}
