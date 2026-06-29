import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Shared brand tokens and font loading for the `next/og` image routes
 * (favicon, apple-icon, opengraph-image, twitter-image).
 *
 * Colors mirror the site's identity in `app/globals.css` / `tailwind.config.ts`
 * and the wordmark in `public/images/logo.svg`.
 */
export const NAVY = "#081939"; // democracy-blue, --background
export const WHITE = "#f8fafc"; // --foreground (≈ hsl(210 40% 98%))
export const BLUE = "#35aaf2"; // logo accent on the italic "for"
export const MUTED = "#94a3b8"; // --muted-foreground (≈ hsl(215 20% 65%))

/** Real homepage tagline (see app/layout.tsx generateMetadata). */
export const TAGLINE =
  "Empowering American Jews to defend democracy and secure our future.";

const FONT_DIR = join(process.cwd(), "lib", "og", "fonts");

type OgFont = {
  name: string;
  data: Buffer;
  weight: 400 | 500 | 700;
  style: "normal" | "italic";
};

let cachedFonts: OgFont[] | undefined;

/**
 * Vendored OFL fonts read from disk and memoized. These routes run on the Node
 * runtime, so synchronous `fs` reads are fine and keep image generation
 * hermetic (no runtime Google Fonts dependency).
 */
export function loadFonts(): OgFont[] {
  if (!cachedFonts) {
    cachedFonts = [
      {
        name: "Playfair Display",
        data: readFileSync(join(FONT_DIR, "PlayfairDisplay-Bold.ttf")),
        weight: 700,
        style: "normal",
      },
      {
        name: "Playfair Display",
        data: readFileSync(join(FONT_DIR, "PlayfairDisplay-Italic.ttf")),
        weight: 500,
        style: "italic",
      },
      {
        name: "Merriweather",
        data: readFileSync(join(FONT_DIR, "Merriweather-Italic.ttf")),
        weight: 400,
        style: "italic",
      },
    ];
  }
  return cachedFonts;
}
