@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Flashy is

A web app that turns a list of card pairs into a **double-sided PDF laid out for duplex printing**. Users supply cards by typing them or uploading a CSV, pick a paper size and grid, and download the PDF.

Two shapes of deck are supported by the same code path, with no mode switch:

- **Term and definition**, the ordinary flashcard: front is the prompt, back is the answer.
- **Category and prompt**, for game decks: the first column names a card type (`Easy`, `Ask Others`) and prints its ornament, the second column carries the question. This is recognised from the text itself, see Categories below.

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
- `src/lib/fonts.ts`: script packs, lazy loading, and per-string face selection.
- `src/lib/subset.ts`: harfbuzz-wasm font subsetting.
- `src/lib/categories.ts`: card categories and their ornament path data.
- `src/app/(paper)/page.tsx`: the single client component holding all UI state. The `(paper)` group exists so the app and its credit footer share a layout the game page does not; route groups do not change URLs, so this is still `/`.
- `src/app/enough-about-the-weather/`: the game's own page, with its own fonts, stylesheet and mark. It is a separate visual world on purpose; see The Game Page in DESIGN.md before editing it.
- `src/components/`: the logo and the category mark, both shared with the print side's design.

A row width note for CSV: the expected column count comes from the header, or the modal row width. Rows **wider** than expected are treated as an unquoted delimiter inside the last column and stitched back together, rather than having their tail dropped. That was a real bug; a question containing a comma silently lost everything after it.

### The duplex model (the core domain logic)

Each sheet of paper emits **two consecutive PDF pages**: fronts, then backs. The back page mirrors the grid so backs land on the reverse of their own fronts once printed double-sided. `mirrorSlot()` in `src/lib/pdf.ts` owns this:

- **Long-edge flip** (the common printer default) rotates about the vertical axis → reverse the column, keep the row.
- **Short-edge flip** rotates about the horizontal axis → reverse the row, keep the column.

Getting this wrong is silent. The PDF still looks fine, and only misprints reveal it. Any change here must be verified by generating a PDF with identifiable cards (`FRONT-1`…) and reading back the actual positions, not by inspection.

PDF coordinates originate at the **bottom-left**, while grid rows are numbered from the top; `slotBox()` does that inversion.

### Text fitting

`fitText()` picks the largest size (30pt fronts, 23pt backs, floor 7pt) at which the wrapped text fits the card, so cards never overflow, they shrink.

**Words are never broken.** `tokenize()` splits a line into the smallest units that may not be divided: whole Latin words, and individual CJK characters, which legitimately break anywhere because those scripts have no spaces. If a word cannot fit the column at a given size, `wrap()` reports `overflow` and `fitText()` tries a smaller size rather than hyphenating or chopping. Only a single word too long for the column even at 7pt falls back to breaking.

Card fronts are laid out by `drawCardFront()`, which composes the category mark and the label as **one block and centres them together**. Do not pin the mark to the card edge: that was the original implementation and it made the gap between mark and text a function of how many lines the label ran to, so a one-word label floated while a three-line label sat tight.

### Fonts and subsetting

Real Unicode support means embedding font files, and CJK faces are 4 to 17 MB, so `src/lib/fonts.ts` splits them into **script packs** fetched on demand: a Latin-only deck never downloads a CJK font. Packs live in `public/fonts/`.

- `requiredPacks()` decides which packs a deck needs from its characters. `latin` is always included. It carries three faces: Noto Sans regular and bold for coverage, plus **Fraunces** in a display cut for fronts and a text cut for backs, which is what makes the print match the app.
- A pack exposes `covers`, `displayCovers` and `textCovers`. `weightFor()` in `pdf.ts` uses them to pick a face per string, falling back from Fraunces to the pack's bold/regular when a script is not covered.
- A face is chosen **per string**, not per character run, because CJK faces include Latin glyphs. That makes a mixed card like `猫 = cat` render from one face.
- `findUnsupportedCharacters()` reports what nothing can draw (emoji, mostly). Those characters are dropped at draw time rather than throwing.

**Subsetting does not use pdf-lib's built-in subsetter.** Its bundled fontkit silently drops glyphs from large CJK faces: kana and Hangul come out blank while neighbouring characters render fine. `src/lib/subset.ts` drives harfbuzz (`public/harfbuzz-subset.wasm`) directly, then embeds the already-minimal result with `subset: false`. This keeps output PDFs at tens of kilobytes and is why `@pdf-lib/fontkit` is still registered but never asked to subset.

Four traps if you touch this:

- Fraunces cuts must be instanced with **`opsz=44` pinned**. At the axis default the instance renders with gaps inside words through pdf-lib, even though its `hmtx` advances look correct when inspected. Symptom: `What's the` prints as `Wh at's th e`.

- **Ligatures must stay off**, via `features: { liga: false, clig: false, dlig: false, rlig: false }` on the `embedFont()` call. pdf-lib derives both the `/W` widths and the `ToUnicode` map from `allGlyphsInFontSortedById`, which resolves glyphs from `font.characterSet` — by code point. A ligature glyph is reachable only through GSUB, so it lands in neither table: the viewer falls back to the PDF default width of 1000/1000 em against a real advance of 642, and the glyph carries no text mapping. Symptom: `first` prints as `fi rst` and extracts as ` rst`. Note this looks like the `opsz` trap above but is a different fault — check whether the gaps sit only at ligature pairs (`fi`, `fl`, `ffi`) before reaching for the axis. It also desyncs layout from print, since `fitText()` measures through `widthOfTextAtSize()` and gets the correct advance the viewer ignores, so an affected line can overrun the card.

- CJK fonts must be **TrueType**, not the smaller CFF-flavoured OTFs. fontkit mis-parses subsetted CFF and every glyph renders as tofu.
- fontkit mutates the buffer it parses, so `fonts.ts` probes coverage on a copy and keeps pristine bytes for embedding.

### Categories

`src/lib/categories.ts` maps a card's front text to an ornament. This is how a deck of game cards works with no extra setting: a CSV whose first column reads `Easy` or `Ask Others` is simply recognised, and anything unrecognised gets the default Flashy mark.

Matching is on **keywords anywhere in the label**, after punctuation is flattened to spaces, not on the whole label. People write these categories the way they say them, so `Possibly Serious or Cringey`, `Serious/Cringey` and `cringe` must all find the same mark. Exact-match was the original implementation and it silently dropped every real-world label to the default. If you add a category, test it against wordy labels, not just the bare noun. Marks are SVG path strings in a 24x24 box, consumed by `drawFrontOrnament()` in the PDF and by `CategoryMark` on screen, so the two can never disagree.

The mark sits **above** the label, and `drawCardFront()` centres the two together as one composition.

## Conventions

- Page sizes, grid layouts, and other option sets are **`as const` object maps keyed by id**, with their ids derived as types (`PageSizeId`, `LayoutId`). The UI renders its controls by iterating `Object.keys`, and **declaration order is display order**, so adding or reordering an option means editing only the map in `src/lib/pdf.ts`.
- Anything that appears both on screen and in print (category marks, sheet diagrams) is driven from one source, so the preview cannot drift from the artifact.
- Keep `src/lib/` free of React and browser globals. It stays plain TypeScript, so it remains testable and could move server-side unchanged.
- Comments explain *why* (coordinate inversions, encoding limits, parser choices), not what.
