import { renderMonogram } from "@/lib/og/images";

// Apple touch icon: AJ4D monogram, 180px, navy to the edges (iOS masks corners).
export const dynamic = "force-static";

export function GET() {
  return renderMonogram({
    width: 180,
    height: 180,
    fontSize: 78,
    colGap: 7,
    rowGap: 6,
    lift: 15,
    radius: 0,
  });
}
