@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Flashy is

A web app that turns a list of term/definition pairs into a **double-sided PDF laid out for duplex printing**. Users supply cards either by typing/pasting text or by uploading a CSV, pick a paper size and grid, and download the PDF.

## Commands

```bash
npm run dev     # dev server (Turbopack) on :3000
npm run build   # production build; also runs the TypeScript check
npm run lint    # eslint
npx tsc --noEmit  # typecheck alone
```

There is no test runner configured yet. The pure modules in `src/lib/` are dependency-free by design and are the natural place to add one (`vitest` fits the ESM/TS setup with no extra config).

To exercise PDF output without the browser, run a scratch script with `npx tsx` that imports `src/lib/pdf.ts` and writes the bytes to disk, then inspect with `pdftotext -layout` (verifies card placement) or `pdftoppm -png` (verifies rendering).

## Architecture

Everything runs client-side. There are no API routes, no server actions, and no persistence — card text never leaves the browser, which is a deliberate privacy property worth preserving.

- `src/lib/cards.ts` — the `Card` type (`{front, back}`) and the line-based text parser. Splits on the **first** occurrence of the separator only, so backs may contain it.
- `src/lib/csv.ts` — hand-rolled RFC 4180 reader. Handles quoted cells, embedded commas/newlines, doubled `""` escapes, BOM stripping, delimiter auto-detection (`,` `;` tab), and header-row detection via a known-words list. Both parsers return the same `ParseResult`, so the UI treats the two input modes identically downstream.
- `src/lib/pdf.ts` — all layout and PDF generation via `pdf-lib`.
- `src/app/page.tsx` — the single client component holding all UI state.

### The duplex model (the core domain logic)

Each sheet of paper emits **two consecutive PDF pages**: fronts, then backs. The back page mirrors the grid so backs land on the reverse of their own fronts once printed double-sided. `mirrorSlot()` in `src/lib/pdf.ts` owns this:

- **Long-edge flip** (the common printer default) rotates about the vertical axis → reverse the column, keep the row.
- **Short-edge flip** rotates about the horizontal axis → reverse the row, keep the column.

Getting this wrong is silent — the PDF still looks fine, and only misprints reveal it. Any change here must be verified by generating a PDF with identifiable cards (`FRONT-1`…) and reading back the actual positions, not by inspection.

PDF coordinates originate at the **bottom-left**, while grid rows are numbered from the top; `slotBox()` does that inversion.

### Text fitting

`fitText()` picks the largest font size from 28pt down to 7pt whose greedily wrapped text fits the card box, then `drawCardText()` centers the block vertically. Cards never overflow; they shrink.

### Font limitation

The built-in PDF fonts (`StandardFonts.Helvetica`) are **WinAnsi-only** — Latin-1 plus a punctuation block. CJK, Cyrillic, Greek, and similar scripts cannot be encoded, and `pdf-lib` throws at draw time rather than degrading. `findUnsupportedCharacters()` pre-screens the deck and the UI blocks download with the offending characters listed.

This is the most likely feature request, since language decks are a primary use case. Lifting it means embedding a real Unicode font: register `@pdf-lib/fontkit` (already a dependency) via `doc.registerFontkit()`, `doc.embedFont(bytes, { subset: true })`, and drop the `findUnsupportedCharacters` gate. The cost is shipping a font file — subset a Noto face rather than bundling a full CJK font.

## Conventions

- Page sizes, grid layouts, and other option sets are **`as const` object maps keyed by id**, with their ids derived as types (`PageSizeId`, `LayoutId`). The UI renders selects by iterating `Object.entries`, so adding an option means editing only the map in `src/lib/pdf.ts`.
- Keep `src/lib/` free of React and browser globals — it is plain TypeScript so it stays testable and could move server-side unchanged.
- Comments explain *why* (coordinate inversions, encoding limits, parser choices), not what.
