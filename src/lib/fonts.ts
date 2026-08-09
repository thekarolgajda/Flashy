/**
 * Unicode font loading.
 *
 * The built-in PDF fonts are WinAnsi-only, so real Unicode support means
 * embedding font files. CJK faces are 4 to 8 MB each, which is far too much to
 * ship to every visitor, so fonts are split into script packs and fetched
 * lazily: a Latin-only deck never downloads a CJK font.
 *
 * Glyph coverage is queried through fontkit before embedding, which lets us
 * pick a face per string and report genuinely unrenderable characters instead
 * of letting pdf-lib throw at save time.
 */

import fontkit from "@pdf-lib/fontkit";

export type FontPackId = "latin" | "sc" | "jp" | "kr";

type PackDefinition = {
  label: string;
  /** Regular and bold URLs; packs without a bold face reuse the regular. */
  regular: string;
  bold?: string;
  /**
   * The brand's typeface, so the printed card is set in the same voice as the
   * app that made it: `display` for fronts, `text` for backs, both Fraunces so
   * the two sides of a card match. Only the Latin pack has these; other
   * scripts fall back to their bold and regular weights.
   */
  display?: string;
  text?: string;
};

const PACKS: Record<FontPackId, PackDefinition> = {
  latin: {
    label: "Noto Sans",
    regular: "/fonts/NotoSans-Regular.ttf",
    bold: "/fonts/NotoSans-Bold.ttf",
    display: "/fonts/Fraunces-Front.ttf",
    text: "/fonts/Fraunces-Back.ttf",
  },
  // CJK faces must be TrueType, not the smaller CFF-flavoured OTFs: fontkit
  // subsets CFF glyphs incorrectly and every character renders as tofu.
  sc: { label: "Noto Sans SC", regular: "/fonts/NotoSansSC-var.ttf" },
  jp: { label: "Noto Sans JP", regular: "/fonts/NotoSansJP-var.ttf" },
  kr: { label: "Noto Sans KR", regular: "/fonts/NotoSansKR-var.ttf" },
};

export type LoadedPack = {
  id: FontPackId;
  regular: Uint8Array;
  bold: Uint8Array;
  /** Display face for fronts, or null when this script has none. */
  display: Uint8Array | null;
  /** Text face for backs, or null when this script has none. */
  text: Uint8Array | null;
  /** True when the pack has a glyph for every code point in the string. */
  covers(text: string): boolean;
  /** True when the display face can set the string. */
  displayCovers(text: string): boolean;
  /** True when the text face can set the string. */
  textCovers(text: string): boolean;
};

type FontkitFont = { hasGlyphForCodePoint(codePoint: number): boolean };

const cache = new Map<FontPackId, Promise<LoadedPack>>();

async function fetchFont(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load font ${url} (${response.status})`);
  return new Uint8Array(await response.arrayBuffer());
}

function loadPack(id: FontPackId): Promise<LoadedPack> {
  const cached = cache.get(id);
  if (cached) return cached;

  const definition = PACKS[id];
  const pending = (async (): Promise<LoadedPack> => {
    const [regular, bold, display, text] = await Promise.all([
      fetchFont(definition.regular),
      definition.bold ? fetchFont(definition.bold) : Promise.resolve(null),
      definition.display ? fetchFont(definition.display) : Promise.resolve(null),
      definition.text ? fetchFont(definition.text) : Promise.resolve(null),
    ]);

    // fontkit mutates the buffer it parses, so hand it a copy and keep the
    // pristine bytes for pdf-lib to embed.
    const probe = fontkit.create(regular.slice()) as unknown as FontkitFont;
    const displayProbe = display
      ? (fontkit.create(display.slice()) as unknown as FontkitFont)
      : null;
    const textProbe = text
      ? (fontkit.create(text.slice()) as unknown as FontkitFont)
      : null;

    const coveredBy = (font: FontkitFont, text: string) => {
      for (const char of text) {
        const codePoint = char.codePointAt(0);
        if (codePoint === undefined) continue;
        // Line breaks are handled by the layout code, never drawn.
        if (char === "\n") continue;
        if (!font.hasGlyphForCodePoint(codePoint)) return false;
      }
      return true;
    };

    return {
      id,
      regular,
      bold: bold ?? regular,
      display,
      text,
      covers: (value: string) => coveredBy(probe, value),
      displayCovers: (value: string) =>
        displayProbe !== null && coveredBy(displayProbe, value),
      textCovers: (value: string) =>
        textProbe !== null && coveredBy(textProbe, value),
    };
  })();

  cache.set(id, pending);
  // A failed fetch shouldn't poison the cache for later retries.
  pending.catch(() => cache.delete(id));
  return pending;
}

const SCRIPT_TESTS: { pack: FontPackId; test: RegExp }[] = [
  // Hangul first: Korean text mixes in ideographs that SC would also match.
  { pack: "kr", test: /[ᄀ-ᇿ㄰-㆏가-힯]/u },
  // Kana implies Japanese; its kanji are covered by the JP face.
  { pack: "jp", test: /[぀-ゟ゠-ヿ]/u },
  { pack: "sc", test: /[㐀-䶿一-鿿豈-﫿]|[\u{20000}-\u{2ffff}]/u },
];

/**
 * Which packs a deck needs. `latin` is always included, being the default
 * face and the smallest, and CJK packs still fall back to it for Latin text
 * in mixed decks only when they lack coverage.
 */
export function requiredPacks(texts: string[]): FontPackId[] {
  const packs = new Set<FontPackId>(["latin"]);
  const joined = texts.join("\n");

  for (const { pack, test } of SCRIPT_TESTS) {
    if (test.test(joined)) packs.add(pack);
  }
  return [...packs];
}

/** Loads every pack a deck needs, in parallel. Latin is always first. */
export async function loadPacksFor(texts: string[]): Promise<LoadedPack[]> {
  const ids = requiredPacks(texts);
  const packs = await Promise.all(ids.map(loadPack));
  return packs.sort((a, b) => (a.id === "latin" ? -1 : b.id === "latin" ? 1 : 0));
}

/**
 * First pack that can render the whole string. Selection is per string rather
 * than per character run because CJK faces include Latin glyphs, so a mixed
 * "猫 = cat" card renders correctly from a single face.
 */
export function pickPack(text: string, packs: LoadedPack[]): LoadedPack | null {
  return packs.find((pack) => pack.covers(text)) ?? null;
}

/** Characters no available pack can render. Empty for virtually all decks. */
export function unrenderableCharacters(texts: string[], packs: LoadedPack[]): string[] {
  const bad = new Set<string>();

  for (const text of texts) {
    for (const char of text) {
      if (char === "\n" || bad.has(char)) continue;
      if (!packs.some((pack) => pack.covers(char))) bad.add(char);
    }
  }
  return [...bad];
}
