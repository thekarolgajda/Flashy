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

To exercise PDF output without the browser, run a scratch script with `npx tsx` **from the project root** (module resolution needs it) that imports `src/lib/pdf.ts` and writes the bytes to disk. The font loader and subsetter fetch from absolute paths like `/fonts/...`, so stub `globalThis.fetch` to read from `public/` first.

Inspect the result with `pdftotext -layout` (proves what text landed where, so it catches duplex mirroring bugs) and `pdftoppm -png` (proves glyphs actually render, which text extraction will not: a PDF can contain correct text and still draw blank boxes). Both checks are needed; the CJK font bug was invisible to the first one.

Playwright is available for UI verification: screenshot at desktop and mobile widths and check the console for errors.

## Architecture

Everything runs client-side. There are no API routes, no server actions, and no persistence. Card text never leaves the browser, which is a deliberate privacy property worth preserving.

- `src/lib/cards.ts`: the `Card` type (`{front, back}`) and the line-based text parser. Splits on the **first** occurrence of the separator only, so backs may contain it.
- `src/lib/csv.ts`: hand-rolled RFC 4180 reader. Handles quoted cells, embedded commas/newlines, doubled `""` escapes, BOM stripping, delimiter auto-detection (`,` `;` tab), and header-row detection via a known-words list. Both parsers return the same `ParseResult`, so the UI treats the two input modes identically downstream.
- `src/lib/pdf.ts`: all layout and PDF generation via `pdf-lib`.
- `src/app/page.tsx`: the single client component holding all UI state.

### The duplex model (the core domain logic)

Each sheet of paper emits **two consecutive PDF pages**: fronts, then backs. The back page mirrors the grid so backs land on the reverse of their own fronts once printed double-sided. `mirrorSlot()` in `src/lib/pdf.ts` owns this:

- **Long-edge flip** (the common printer default) rotates about the vertical axis → reverse the column, keep the row.
- **Short-edge flip** rotates about the horizontal axis → reverse the row, keep the column.

Getting this wrong is silent. The PDF still looks fine, and only misprints reveal it. Any change here must be verified by generating a PDF with identifiable cards (`FRONT-1`…) and reading back the actual positions, not by inspection.

PDF coordinates originate at the **bottom-left**, while grid rows are numbered from the top; `slotBox()` does that inversion.

### Text fitting

`fitText()` picks the largest font size from 28pt down to 7pt whose greedily wrapped text fits the card box, then `drawCardText()` centers the block vertically. Cards never overflow; they shrink.

### Fonts and subsetting

Real Unicode support means embedding font files, and CJK faces are 4 to 17 MB, so `src/lib/fonts.ts` splits them into **script packs** fetched on demand: a Latin-only deck never downloads a CJK font. Packs live in `public/fonts/`.

- `requiredPacks()` decides which packs a deck needs from its characters. `latin` (Noto Sans, covering Latin/Greek/Cyrillic) is always included.
- A face is chosen **per string**, not per character run, because CJK faces include Latin glyphs. That makes a mixed card like `猫 = cat` render from one face.
- `findUnsupportedCharacters()` reports what nothing can draw (emoji, mostly). Those characters are dropped at draw time rather than throwing.

**Subsetting does not use pdf-lib's built-in subsetter.** Its bundled fontkit silently drops glyphs from large CJK faces: kana and Hangul come out blank while neighbouring characters render fine. `src/lib/subset.ts` drives harfbuzz (`public/harfbuzz-subset.wasm`) directly, then embeds the already-minimal result with `subset: false`. This keeps output PDFs at tens of kilobytes and is why `@pdf-lib/fontkit` is still registered but never asked to subset.

Two traps if you touch this:

- CJK fonts must be **TrueType**, not the smaller CFF-flavoured OTFs. fontkit mis-parses subsetted CFF and every glyph renders as tofu.
- fontkit mutates the buffer it parses, so `fonts.ts` probes coverage on a copy and keeps pristine bytes for embedding.

## Conventions

- Page sizes, grid layouts, and other option sets are **`as const` object maps keyed by id**, with their ids derived as types (`PageSizeId`, `LayoutId`). The UI renders selects by iterating `Object.entries`, so adding an option means editing only the map in `src/lib/pdf.ts`.
- Keep `src/lib/` free of React and browser globals. It stays plain TypeScript, so it remains testable and could move server-side unchanged.
- Comments explain *why* (coordinate inversions, encoding limits, parser choices), not what.
