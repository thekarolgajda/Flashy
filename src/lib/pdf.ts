/**
 * Duplex flashcard PDF generation, entirely client-side. Card text never
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
import { categoryFor } from "./categories";

/* Declaration order is the order the options appear in the UI. */
export const PAGE_SIZES = {
  letter: { label: "US Letter", width: 612, height: 792 },
  a4: { label: "A4", width: 595.28, height: 841.89 },
} as const;

export type PageSizeId = keyof typeof PAGE_SIZES;

export const LAYOUTS = {
  "3x4": { label: "12 per sheet (small)", cols: 3, rows: 4 },
  "2x4": { label: "8 per sheet (medium)", cols: 2, rows: 4 },
  "2x2": { label: "4 per sheet (large)", cols: 2, rows: 2 },
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

/**
 * Scripts written without spaces, which may be broken between any two
 * characters. Latin words may not.
 */
const BREAK_ANYWHERE =
  /[　-〿぀-ヿ㐀-䶿一-鿿豈-﫿가-힯＀-｠]/;

type Token = { text: string; spaceBefore: boolean };

/**
 * Splits a line into the smallest pieces that may not be broken apart: whole
 * Latin words, and individual CJK characters.
 */
function tokenize(paragraph: string): Token[] {
  const tokens: Token[] = [];
  let word = "";
  let wordSpace = false;
  let pendingSpace = false;

  const flush = () => {
    if (word !== "") tokens.push({ text: word, spaceBefore: wordSpace });
    word = "";
  };

  for (const char of paragraph) {
    if (/\s/.test(char)) {
      flush();
      pendingSpace = true;
      continue;
    }
    if (BREAK_ANYWHERE.test(char)) {
      flush();
      tokens.push({ text: char, spaceBefore: pendingSpace });
      pendingSpace = false;
      continue;
    }
    if (word === "") {
      wordSpace = pendingSpace;
      pendingSpace = false;
    }
    word += char;
  }

  flush();
  return tokens;
}

/**
 * Greedy wrap that never splits a word. When a word cannot fit the column at
 * this size, `overflow` is set so `fitText` can try a smaller size instead of
 * hyphenating or chopping it.
 */
function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): { lines: string[]; overflow: boolean } {
  const lines: string[] = [];
  let overflow = false;

  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }

    let line = "";

    for (const token of tokenize(paragraph)) {
      const joiner = token.spaceBefore ? " " : "";
      const candidate = line === "" ? token.text : line + joiner + token.text;

      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }

      if (line !== "") lines.push(line);
      line = token.text;

      // The token is wider than the column even on a line of its own.
      if (font.widthOfTextAtSize(token.text, size) > maxWidth) overflow = true;
    }

    if (line !== "") lines.push(line);
  }

  return { lines, overflow };
}

/**
 * Largest size in [MIN, max] at which the text fits the box with every word
 * intact. Shrinking is always preferred over breaking a word.
 */
function fitText(
  text: string,
  font: PDFFont,
  maxWidth: number,
  maxHeight: number,
  maxSize: number,
): { size: number; lines: string[] } {
  for (let size = maxSize; size >= MIN_FONT_SIZE; size -= 1) {
    const { lines, overflow } = wrap(text, font, size, maxWidth);
    if (!overflow && lines.length * size * LINE_HEIGHT <= maxHeight) {
      return { size, lines };
    }
  }

  // Nothing fits: a single word longer than the column even at the floor size.
  return { size: MIN_FONT_SIZE, lines: wrap(text, font, MIN_FONT_SIZE, maxWidth).lines };
}

const INK = rgb(0.14, 0.135, 0.12);
const GUIDE_INK = rgb(0.6, 0.59, 0.56);
const TRIM_INK = rgb(0.42, 0.41, 0.39);
const ORNAMENT_INK = rgb(0.55, 0.54, 0.51);

/** Draws wrapped lines downward from the top of the text block. */
function drawLines(
  page: PDFPage,
  box: Box,
  lines: string[],
  size: number,
  font: PDFFont,
  blockTop: number,
) {
  let baseline = blockTop - size * LINE_HEIGHT;

  for (const line of lines) {
    const width = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: box.x + (box.width - width) / 2,
      y: baseline + (size * (LINE_HEIGHT - 1)) / 2,
      size,
      font,
      color: INK,
    });
    baseline -= size * LINE_HEIGHT;
  }
}

/**
 * Optical centring: a block centred on the true middle of a card reads as
 * sitting slightly low.
 */
function opticalLift(box: Box): number {
  return box.height * 0.02;
}

/** Card backs: one centred block of text. */
function drawCardText(page: PDFPage, box: Box, text: string, font: PDFFont, maxSize: number) {
  if (text === "") return;

  const { size, lines } = fitText(
    text,
    font,
    box.width - CARD_PADDING * 2,
    box.height - CARD_PADDING * 2,
    maxSize,
  );
  const blockHeight = lines.length * size * LINE_HEIGHT;

  drawLines(
    page,
    box,
    lines,
    size,
    font,
    box.y + box.height / 2 + blockHeight / 2 + opticalLift(box),
  );
}

/**
 * Card fronts: the category mark, then the label beneath it.
 *
 * Mark and text are laid out as one composition and centred together, rather
 * than the mark being pinned to the card edge. Pinning it left a short label
 * like "Easy" floating far above its ornament while a three-line label sat
 * tight against one, so the spacing looked accidental from card to card.
 */
function drawCardFront(
  page: PDFPage,
  box: Box,
  text: string,
  font: PDFFont,
  maxSize: number,
  frontText: string,
) {
  const markSize = Math.min(34, box.height * 0.19);
  const gap = Math.min(15, Math.max(8, box.height * 0.05));

  const { size, lines } = fitText(
    text,
    font,
    box.width - CARD_PADDING * 2,
    box.height - CARD_PADDING * 2 - markSize - gap,
    maxSize,
  );
  const blockHeight = lines.length * size * LINE_HEIGHT;

  const total = markSize + gap + blockHeight;
  const top = box.y + box.height / 2 + total / 2 + opticalLift(box);

  drawFrontOrnament(page, box, frontText, top - markSize / 2, markSize);
  drawLines(page, box, lines, size, font, top - markSize - gap);
}

/**
 * The ornament under a card front: the mark for its category, flanked by
 * hairlines so it reads as a deliberate device rather than a stray icon.
 *
 * It earns its ink twice over. It says which side you are holding and which
 * type of card it is, without a word of extra furniture, and it is line art so
 * it costs almost nothing on a mono laser printer.
 */
function drawFrontOrnament(
  page: PDFPage,
  box: Box,
  frontText: string,
  centerY: number,
  size: number,
) {
  const category = categoryFor(frontText);
  const centerX = box.x + box.width / 2;
  const y = centerY;

  // Marks are authored in a 24x24 box; this scales them to the printed size.
  const scale = size / 24;

  if (category.fill) {
    page.drawSvgPath(category.fill, {
      x: centerX - size / 2,
      y: y + size / 2,
      scale,
      color: ORNAMENT_INK,
      borderWidth: 0,
    });
  }

  page.drawSvgPath(category.stroke, {
    x: centerX - size / 2,
    y: y + size / 2,
    scale,
    borderColor: ORNAMENT_INK,
    borderWidth: 0.9,
  });
}

/**
 * Cut guides in the printer's idiom: solid trim marks in the margin, where the
 * blade actually starts, and a hairline dashed line across the card area so
 * the cut can be followed without a heavy rule printing between every card.
 */
function drawCutGuides(page: PDFPage, cols: number, rows: number, w: number, h: number) {
  const hairline = { thickness: 0.45, color: GUIDE_INK, dashArray: [2.5, 3] };
  const mark = { thickness: 0.7, color: TRIM_INK };
  const cellWidth = (w - MARGIN * 2) / cols;
  const cellHeight = (h - MARGIN * 2) / rows;
  const tick = 11;
  const gap = 5;

  for (let col = 0; col <= cols; col += 1) {
    const x = MARGIN + col * cellWidth;
    page.drawLine({
      start: { x, y: MARGIN + gap },
      end: { x, y: h - MARGIN - gap },
      ...hairline,
    });
    // Trim marks sit clear of the card area, in the part that gets cut away.
    page.drawLine({ start: { x, y: MARGIN - gap }, end: { x, y: MARGIN - gap - tick }, ...mark });
    page.drawLine({
      start: { x, y: h - MARGIN + gap },
      end: { x, y: h - MARGIN + gap + tick },
      ...mark,
    });
  }

  for (let row = 0; row <= rows; row += 1) {
    const y = MARGIN + row * cellHeight;
    page.drawLine({
      start: { x: MARGIN + gap, y },
      end: { x: w - MARGIN - gap, y },
      ...hairline,
    });
    page.drawLine({ start: { x: MARGIN - gap, y }, end: { x: MARGIN - gap - tick, y }, ...mark });
    page.drawLine({
      start: { x: w - MARGIN + gap, y },
      end: { x: w - MARGIN + gap + tick, y },
      ...mark,
    });
  }
}

/** Characters the sheet label may need, so its face is always embedded. */
export const SHEET_LABEL_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ·/";

/**
 * Identification for the printout: deck name, which side, which sheet.
 *
 * It sits in the margin, outside the trim marks, so it is cut away with the
 * waste and never appears on a finished card. That is what lets the sheet be
 * useful to handle while costing the cards nothing.
 */
function drawSheetLabel(
  page: PDFPage,
  w: number,
  h: number,
  font: PDFFont,
  meta: { deck?: string; side: string; sheetNumber: number; sheets: number },
) {
  const deck = (meta.deck ?? "").trim();
  const parts = [deck || "Flashy", meta.side];
  if (meta.sheets > 1) parts.push(`Sheet ${meta.sheetNumber} of ${meta.sheets}`);

  const size = 7.5;
  // Deck names are user text, so drop anything this face cannot draw.
  const label = sanitize(parts.join("  ·  "), font);
  const width = font.widthOfTextAtSize(label, size);

  page.drawText(label, {
    x: (w - width) / 2,
    y: MARGIN - 15 - size,
    size,
    font,
    color: TRIM_INK,
  });
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

type Weight = "display" | "bold" | "regular";

/**
 * Which face a string is set in.
 *
 * Fronts want the brand's display face, so the printed card reads in the same
 * voice as the app. Fraunces only covers Latin, so anything else falls back to
 * the script pack's bold weight, and backs are always the regular sans.
 */
function weightFor(text: string, isFront: boolean, pack: LoadedPack): Weight {
  if (!isFront) return "regular";
  return pack.displayCovers(text) ? "display" : "bold";
}

/** Identifies one embedded face: a script pack at a given weight. */
function faceKey(pack: LoadedPack, weight: Weight): string {
  return `${pack.id}:${weight}`;
}

function faceBytes(pack: LoadedPack, weight: Weight): Uint8Array {
  if (weight === "display" && pack.display) return pack.display;
  return weight === "regular" ? pack.regular : pack.bold;
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
  const record = (text: string, isFront: boolean) => {
    const pack = chosen(text);
    const weight = weightFor(text, isFront, pack);
    const key = faceKey(pack, weight);
    const existing = usage.get(key);

    if (existing) existing.text += text;
    else usage.set(key, { source: faceBytes(pack, weight), text });
  };

  for (const card of cards) {
    record(card.front, true);
    record(card.back, false);
  }

  // Sheet furniture in the trimmed margin is always set in the regular sans.
  record(SHEET_LABEL_CHARS, false);


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
  const fontFor = (text: string, isFront: boolean) => {
    const pack = pickPack(text, packs) ?? packs[0];
    return faces.get(faceKey(pack, weightFor(text, isFront, pack)))!;
  };
  const labelFont = fontFor(SHEET_LABEL_CHARS, false);
  const sheets = Math.ceil(cards.length / perSheet) || 1;

  for (let start = 0; start < cards.length; start += perSheet) {
    const sheet = cards.slice(start, start + perSheet);
    const sheetNumber = start / perSheet + 1;

    const frontPage = doc.addPage([width, height]);
    const backPage = doc.addPage([width, height]);

    if (options.cutGuides) {
      drawCutGuides(frontPage, cols, rows, width, height);
      drawCutGuides(backPage, cols, rows, width, height);
    }

    drawSheetLabel(frontPage, width, height, labelFont, {
      deck: options.title,
      side: "Fronts",
      sheetNumber,
      sheets,
    });
    drawSheetLabel(backPage, width, height, labelFont, {
      deck: options.title,
      side: "Backs",
      sheetNumber,
      sheets,
    });

    for (const [slot, card] of sheet.entries()) {
      const frontBox = slotBox(slot, cols, rows, width, height);
      const backBox = slotBox(
        mirrorSlot(slot, cols, rows, options.flipEdge),
        cols,
        rows,
        width,
        height,
      );

      const frontFont = fontFor(card.front, true);
      drawCardFront(
        frontPage,
        frontBox,
        sanitize(card.front, frontFont),
        frontFont,
        MAX_FONT_SIZE.front,
        card.front,
      );

      const backFont = fontFor(card.back, false);
      drawCardText(
        backPage,
        backBox,
        sanitize(card.back, backFont),
        backFont,
        MAX_FONT_SIZE.back,
      );

    }
  }

  return doc.save();
}

export function sheetCount(cardCount: number, layout: LayoutId): number {
  return Math.ceil(cardCount / (LAYOUTS[layout].cols * LAYOUTS[layout].rows));
}
