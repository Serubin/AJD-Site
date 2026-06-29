import { ImageResponse } from "next/og";
import { BLUE, MUTED, NAVY, TAGLINE, WHITE, loadFonts } from "./brand";

/**
 * Shared `next/og` renderers for the image route handlers under `app/og/`.
 * Kept here so the route files stay thin and the favicon/apple-icon (and the
 * OG/Twitter cards) share a single source of truth.
 */

const playfairNormal = () =>
  loadFonts().filter((f) => f.name === "Playfair Display" && f.style === "normal");

type MonogramOpts = {
  width: number;
  height: number;
  fontSize: number;
  colGap: number;
  rowGap: number;
  /** Pixels to lift the "4" so its old-style descender rests on the baseline. */
  lift: number;
  radius: number;
};

/** AJ4D monogram tile — used for both the favicon and the Apple touch icon. */
export function renderMonogram(opts: MonogramOpts): ImageResponse {
  const { width, height, fontSize, colGap, rowGap, lift, radius } = opts;
  const glyph: React.CSSProperties = {
    display: "flex",
    fontFamily: "Playfair Display",
    fontWeight: 700,
    fontSize,
    lineHeight: 1,
  };
  const row: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: colGap };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: rowGap,
          background: NAVY,
          borderRadius: radius,
          color: WHITE,
          overflow: "hidden",
        }}
      >
        <div style={row}>
          <span style={glyph}>A</span>
          <span style={glyph}>J</span>
        </div>
        <div style={row}>
          {/* Playfair's "4" is an old-style figure with a descender; lift it
              so it visually rests on the same baseline as the letters. */}
          <span style={{ ...glyph, color: BLUE, transform: `translateY(-${lift}px)` }}>4</span>
          <span style={glyph}>D</span>
        </div>
      </div>
    ),
    { width, height, fonts: playfairNormal() },
  );
}

/** 1200x630 social share card — used for both the OpenGraph and Twitter images. */
export function renderCard(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 96px",
          backgroundColor: NAVY,
          backgroundImage: `radial-gradient(circle at 50% 42%, ${BLUE}26 0%, ${BLUE}0d 28%, ${NAVY}00 60%)`,
          color: WHITE,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair Display",
            fontWeight: 700,
            fontSize: 104,
            lineHeight: 1.04,
          }}
        >
          American Jews
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Playfair Display",
            fontSize: 104,
            lineHeight: 1.04,
          }}
        >
          <span style={{ fontStyle: "italic", fontWeight: 500, color: BLUE }}>for</span>
          <span style={{ fontWeight: 700 }}>&nbsp;Democracy</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            maxWidth: 880,
            fontFamily: "Merriweather",
            fontStyle: "italic",
            fontSize: 34,
            lineHeight: 1.35,
            color: MUTED,
          }}
        >
          {TAGLINE}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: loadFonts() },
  );
}
