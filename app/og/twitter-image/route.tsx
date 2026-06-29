import { renderCard } from "@/lib/og/images";

// Twitter/X card (summary_large_image) — same 1200x630 art as the OG card.
export const dynamic = "force-static";

export function GET() {
  return renderCard();
}
