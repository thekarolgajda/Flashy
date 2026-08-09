/**
 * Duplex flashcard PDF generation, entirely client-side — card text never
 * leaves the browser.
 *
 * Sheet model: every sheet of paper produces two PDF pages, a front page and
 * the back page immediately after it. The back page mirrors the grid
 * horizontally so that when the stack is printed double-sided the backs land
 * on the reverse of their own fronts. See `mirrorColumn`.
 */

import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { Card } from "./cards";
import { loadPacksFor, pickPack, unrenderableCharacters, type LoadedPack } from "./fonts";
import { subsetFont } from "./subset";

export const PAGE_SIZES = {
  a4: { label: "A4", width: 595.28, height: 841.89 },
  letter: { label: "US Letter", width: 612, height: 792 },
} as const;

export type PageSizeId = keyof typeof PAGE_SIZES;

export const LAYOUTS = {
  "2x2": { label: "4 per page (large)", cols: 2, rows: 2 },
  "2x4": { label: "8 per page (medium)", cols: 2, rows: 4 },
  "3x4": { label: "12 per page (small)", cols: 3, rows: 4 },
} as const;

export type LayoutId = keyof typeof LAYOUTS;

/**
 * Which sheet edge the printer flips on. This is the single setting most
 * likely to be wrong for a given printer, so it is user-facing.
 */
export type FlipEdge = "long" | "short";

export type GenerateOptions = {
  pageSize: PageSizeId;
  layout: LayoutId;
  flipEdge: FlipEdge;
  cutGuides: boolean;
  title?: string;
};

const MARGIN = 36; // 0.5in
const CARD_PADDING = 14;
/** Fronts are set larger and bolder, so the side is legible from the weight alone. */
const MAX_FONT_SIZE = { front: 30, back: 23 };
const MIN_FONT_SIZE = 7;
const LINE_HEIGHT = 1.3;

/** Room reserved at the foot of a card for its index number. */
const INDEX_SIZE = 7;
const INDEX_INSET = 9;

/**
 * Grid position of a card's back, given the position of its front.
 *
 * Long-edge flip (the common default) turns the sheet about its vertical
 * axis, so columns reverse and rows stay put. Short-edge flip turns it about
 * the horizontal axis, so rows reverse and columns stay put.
 */
function mirrorSlot(
  slot: number,
  cols: number,
  rows: number,
  flipEdge: FlipEdge,
): number {
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  return flipEdge === "long"
    ? row * cols + (cols - 1 - col)
    : (rows - 1 - row) * cols + col;
}

type Box = { x: number; y: number; width: number; height: number };

function slotBox(
  slot: number,
  cols: number,
  rows: number,
  pageWidth: number,
  pageHeight: number,
): Box {
  const cellWidth = (pageWidth - MARGIN * 2) / cols;
  const cellHeight = (pageHeight - MARGIN * 2) / rows;
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  return {
    x: MARGIN + col * cellWidth,
    // PDF origin is bottom-left; rows are numbered from the top.
    y: pageHeight - MARGIN - (row + 1) * cellHeight,
    width: cellWidth,
    height: cellHeight,
  };
}

/** Greedy word wrap, breaking over-long words character by character. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    let line = "";

    const push = () => {
      if (line !== "") lines.push(line);
      line = "";
    };

    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line === "" ? word : `${line} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      push();

      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word;
        continue;
      }
      // Word alone overflows: split it.
      for (const char of word) {
        if (font.widthOfTextAtSize(line + char, size) > maxWidth && line !== "") push();
        line += char;
      }
    }

    push();
    if (paragraph.trim() === "") lines.push("");
  }

  return lines;
}

/** Largest size in [MIN, MAX] whose wrapped text fits the box, and its lines. */
function fitText(
  text: string,
  font: PDFFont,
  maxWidth: number,
  maxHeight: number,
): { size: number; lines: string[] } {
  for (let size = MAX_FONT_SIZE; size > MIN_FONT_SIZE; size -= 1) {
    const lines = wrap(text, font, size, maxWidth);
    if (lines.length * size * LINE_HEIGHT <= maxHeight) return { size, lines };
  }
  return { size: MIN_FONT_SIZE, lines: wrap(text, font, MIN_FONT_SIZE, maxWidth) };
}

function drawCardText(page: PDFPage, box: Box, text: string, font: PDFFont) {
  if (text === "") return;

  const maxWidth = box.width - CARD_PADDING * 2;
  const maxHeight = box.height - CARD_PADDING * 2;
  const { size, lines } = fitText(text, font, maxWidth, maxHeight);

  const blockHeight = lines.length * size * LINE_HEIGHT;
  // Center the block vertically, then step down line by line.
  let baseline = box.y + box.height / 2 + blockHeight / 2 - size * LINE_HEIGHT;

  for (const line of lines) {
    const width = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: box.x + (box.width - width) / 2,
      y: baseline + (size * (LINE_HEIGHT - 1)) / 2,
      size,
      font,
      color: rgb(0.06, 0.06, 0.09),
    });
    baseline -= size * LINE_HEIGHT;
  }
}

function drawCutGuides(page: PDFPage, cols: number, rows: number, w: number, h: number) {
  const guide = { thickness: 0.5, color: rgb(0.75, 0.75, 0.78), dashArray: [3, 3] };
  const cellWidth = (w - MARGIN * 2) / cols;
  const cellHeight = (h - MARGIN * 2) / rows;

  for (let col = 0; col <= cols; col += 1) {
    const x = MARGIN + col * cellWidth;
    page.drawLine({ start: { x, y: MARGIN }, end: { x, y: h - MARGIN }, ...guide });
  }
  for (let row = 0; row <= rows; row += 1) {
    const y = MARGIN + row * cellHeight;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: w - MARGIN, y }, ...guide });
  }
}

/** All text a deck will render, used for font selection and coverage checks. */
function deckTexts(cards: Card[]): string[] {
  return cards.flatMap((card) => [card.front, card.back]);
}

/**
 * Characters no bundled font can render. Fetches only the script packs the
 * deck actually needs, so this is cheap for Latin decks.
 */
export async function findUnsupportedCharacters(cards: Card[]): Promise<string[]> {
  if (cards.length === 0) return [];
  const texts = deckTexts(cards);
  return unrenderableCharacters(texts, await loadPacksFor(texts));
}

/** Identifies one embedded face: a script pack at a given weight. */
function faceKey(pack: LoadedPack, bold: boolean): string {
  return `${pack.id}:${bold ? "bold" : "regular"}`;
}

/**
 * Chooses a face per string, then embeds each face once, subset to exactly the
 * characters drawn with it.
 *
 * Subsetting happens up front rather than lazily because harfbuzz needs the
 * full character set for a face before it can produce the reduced font.
 */
async function embedFaces(
  doc: PDFDocument,
  cards: Card[],
  packs: LoadedPack[],
): Promise<Map<string, PDFFont>> {
  // Fall back to Latin for text nothing covers; unrenderable characters are
  // reported to the user separately and are dropped at draw time.
  const chosen = (text: string) => pickPack(text, packs) ?? packs[0];

  const usage = new Map<string, { source: Uint8Array; text: string }>();
  const record = (text: string, bold: boolean) => {
    const pack = chosen(text);
    const key = faceKey(pack, bold);
    const existing = usage.get(key);

    if (existing) existing.text += text;
    else usage.set(key, { source: bold ? pack.bold : pack.regular, text });
  };

  for (const card of cards) {
    record(card.front, true);
    record(card.back, false);
  }

  const entries = await Promise.all(
    [...usage].map(async ([key, { source, text }]) => {
      const subset = await subsetFont(source, text);
      return [key, await doc.embedFont(subset, { subset: false })] as const;
    }),
  );

  return new Map(entries);
}

/** Strips characters no font can draw, so generation never throws mid-deck. */
function sanitize(text: string, font: PDFFont): string {
  return [...text]
    .filter((char) => {
      if (char === "\n") return true;
      try {
        font.widthOfTextAtSize(char, 12);
        return true;
      } catch {
        return false;
      }
    })
    .join("");
}

export async function generateFlashcardPdf(
  cards: Card[],
  options: GenerateOptions,
): Promise<Uint8Array> {
  const { width, height } = PAGE_SIZES[options.pageSize];
  const { cols, rows } = LAYOUTS[options.layout];
  const perSheet = cols * rows;

  const packs = await loadPacksFor(deckTexts(cards));

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(options.title?.trim() || "Flashy flashcards");
  doc.setCreator("Flashy");

  const faces = await embedFaces(doc, cards, packs);
  const fontFor = (text: string, bold: boolean) =>
    faces.get(faceKey(pickPack(text, packs) ?? packs[0], bold))!;

  for (let start = 0; start < cards.length; start += perSheet) {
    const sheet = cards.slice(start, start + perSheet);

    const frontPage = doc.addPage([width, height]);
    const backPage = doc.addPage([width, height]);

    if (options.cutGuides) {
      drawCutGuides(frontPage, cols, rows, width, height);
      drawCutGuides(backPage, cols, rows, width, height);
    }

    for (const [slot, card] of sheet.entries()) {
      const frontFont = fontFor(card.front, true);
      drawCardText(
        frontPage,
        slotBox(slot, cols, rows, width, height),
        sanitize(card.front, frontFont),
        frontFont,
      );

      const backFont = fontFor(card.back, false);
      const backSlot = mirrorSlot(slot, cols, rows, options.flipEdge);
      drawCardText(
        backPage,
        slotBox(backSlot, cols, rows, width, height),
        sanitize(card.back, backFont),
        backFont,
      );
    }
  }

  return doc.save();
}

export function sheetCount(cardCount: number, layout: LayoutId): number {
  return Math.ceil(cardCount / (LAYOUTS[layout].cols * LAYOUTS[layout].rows));
}
