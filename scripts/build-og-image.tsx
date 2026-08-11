import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/*
 * Renders public/opengraph-image.png, the card social platforms and search
 * results show. Run it with `npm run og` after changing the copy or palette.
 *
 * This is a build script rather than an app/opengraph-image route on purpose:
 * a route under `output: export` writes an extensionless file, which GitHub
 * Pages then serves as application/octet-stream, and every scraper rejects it.
 * A committed .png is served correctly by any static host.
 *
 * The palette is copied from globals.css as literal sRGB, because ImageResponse
 * resolves neither CSS custom properties nor oklch(). If the brand colours
 * move, they move here too.
 */

const size = { width: 1200, height: 630 };

const PAPER = "#fcfaf2";
const INK = "#33302a";
const INK_SOFT = "#7d7768";
const LIME_DEEP = "#5c7a2e";
const RULE = "#e3ded0";

async function render() {
  // Fraunces is what makes the card recognisably Flashy rather than a default
  // system-font share image. It is already vendored for the PDF side.
  const fraunces = await readFile(path.join(process.cwd(), "public/fonts/Fraunces-Front.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: PAPER,
          padding: "90px 100px",
          fontFamily: "Fraunces",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="15" fill={LIME_DEEP} />
            <g transform="translate(32 32)">
              <rect x="-18" y="-13" width="36" height="26" rx="4" fill="#e6d9b8" />
              <rect
                x="-18"
                y="-13"
                width="36"
                height="26"
                rx="4"
                fill={PAPER}
                stroke={LIME_DEEP}
                strokeWidth="2.5"
              />
              <line
                x1="-8.5"
                y1="0"
                x2="8.5"
                y2="0"
                stroke={LIME_DEEP}
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </g>
          </svg>
          <div style={{ fontSize: 104, color: INK, letterSpacing: "-0.025em" }}>Flashy</div>
        </div>

        <div
          style={{
            marginTop: 44,
            fontSize: 52,
            color: INK,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 940,
          }}
        >
          Free printable flashcards, laid out for double-sided printing.
        </div>

        <div style={{ display: "flex", marginTop: 40, height: 1, background: RULE }} />

        <div style={{ marginTop: 34, fontSize: 30, color: INK_SOFT }}>
          Type them or upload a CSV · Every back lands on the right front
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fraunces", data: fraunces, style: "normal", weight: 700 }],
    },
  );
}

// Wrapped rather than top-level await: tsx transpiles this file to CJS, which
// has no top-level await.
async function main() {
  const out = path.join(process.cwd(), "public/opengraph-image.png");
  await writeFile(out, Buffer.from(await (await render()).arrayBuffer()));
  console.log(`wrote ${out}`);
}

void main();
