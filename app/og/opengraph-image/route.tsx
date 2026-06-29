import { renderCard } from "@/lib/og/images";

// 1200x630 OpenGraph share card.
export const dynamic = "force-static";

export function GET() {
  return renderCard();
}
