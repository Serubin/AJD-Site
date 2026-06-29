import { renderMonogram } from "@/lib/og/images";

// Favicon: AJ4D monogram, 48px (browsers downscale for the 16/32px tab).
export const dynamic = "force-static";

export function GET() {
  return renderMonogram({
    width: 48,
    height: 48,
    fontSize: 21,
    colGap: 2,
    rowGap: 2,
    lift: 4,
    radius: 8,
  });
}
