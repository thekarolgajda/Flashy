/**
 * Minimal RFC 4180 CSV reader. Hand-rolled rather than pulled from npm because
 * the requirement is narrow (two columns of user text) and correct quote
 * handling is the only hard part.
 */

import type { Card, ParseResult } from "./cards";

/** Splits CSV text into rows of raw cell strings. */
export function parseCsvRows(input: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  // Strip a UTF-8 BOM, which spreadsheet exports commonly prepend.
  const text = input.replace(/^﻿/, "");

  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char !== '"') {
        cell += char;
      } else if (text[i + 1] === '"') {
        cell += '"'; // Escaped quote.
        i += 1;
      } else {
        inQuotes = false;
      }
      continue;
    }

    if (char === '"' && cell.trim() === "") {
      cell = "";
      inQuotes = true;
    } else if (char === delimiter) {
      endCell();
    } else if (char === "\n") {
      endRow();
    } else if (char === "\r") {
      // Swallow; the \n that follows ends the row.
    } else {
      cell += char;
    }
  }

  // Trailing cell, unless the file simply ended with a newline.
  if (cell !== "" || row.length > 0) endRow();

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Guesses the delimiter by counting candidates outside quoted regions. */
function detectDelimiter(input: string): string {
  const sample = input.slice(0, 4000).replace(/"[^"]*"/g, "");
  const counts = [",", ";", "\t"].map(
    (d) => [d, sample.split(d).length - 1] as const,
  );
  const best = counts.reduce((a, b) => (b[1] > a[1] ? b : a));
  return best[1] > 0 ? best[0] : ",";
}

const HEADER_WORDS = new Set([
  "front",
  "back",
  "question",
  "answer",
  "term",
  "definition",
  "prompt",
  "response",
  "word",
  "translation",
  "meaning",
]);

/** A first row of column names should become headers, not a flashcard. */
function looksLikeHeader(row: string[]): boolean {
  return row
    .slice(0, 2)
    .some((cell) => HEADER_WORDS.has(cell.trim().toLowerCase()));
}

/**
 * Reads a CSV into cards using the first two columns. Rows with only one
 * populated column are reported as skipped so the UI can surface them.
 */
/**
 * Number of columns the file is meant to have: the header's width when there
 * is one, otherwise the most common row width. Rows wider than this contain an
 * unquoted delimiter rather than a genuine extra column.
 */
function expectedColumnCount(rows: string[][], hasHeader: boolean): number {
  if (hasHeader) return rows[0].length;

  const tally = new Map<number, number>();
  for (const row of rows) tally.set(row.length, (tally.get(row.length) ?? 0) + 1);

  let best = 2;
  let bestCount = 0;
  for (const [width, count] of tally) {
    if (count > bestCount || (count === bestCount && width < best)) {
      best = width;
      bestCount = count;
    }
  }
  return Math.max(best, 2);
}

export function parseCardsFromCsv(input: string): ParseResult {
  const delimiter = detectDelimiter(input);
  const rows = parseCsvRows(input, delimiter);
  const hasHeader = rows.length > 0 && looksLikeHeader(rows[0]);
  const body = hasHeader ? rows.slice(1) : rows;
  const expected = expectedColumnCount(rows, hasHeader);

  const cards: Card[] = [];
  const skippedLines: number[] = [];
  const offset = hasHeader ? 2 : 1; // 1-indexed, plus the header if present.

  body.forEach((row, index) => {
    // An unquoted delimiter inside the final column splits it into extra
    // cells; stitch them back together rather than dropping the tail.
    const cells =
      row.length > expected
        ? [...row.slice(0, expected - 1), row.slice(expected - 1).join(delimiter)]
        : row;

    const front = (cells[0] ?? "").trim();
    const back = (cells[1] ?? "").trim();

    if (front === "" || back === "") {
      skippedLines.push(index + offset);
      return;
    }
    cards.push({ front, back });
  });

  return { cards, skippedLines };
}
