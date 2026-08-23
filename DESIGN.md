# Design

## Visual Theme

Light, committed. Not a system-preference toggle.

The scene: someone at a desk in daylight, about to send paper through a printer, checking that what is on screen matches what will come out of the tray. The product's output is a white sheet. A warm off-white ground makes the app continuous with that sheet; a dark UI would break the relationship between screen and paper for no gain. Flashy therefore ships light only, and does not follow `prefers-color-scheme`.

Personality comes from citrus accents against warm paper neutrals, generous spacing, and motion that reveals the printed result. Never from gradients, glass, texture overlays, or illustration.

This describes the app. The game page at `/enough-about-the-weather` is a second, deliberately unrelated visual world; see The Game Page below before assuming these rules apply site-wide.

## Color

OKLCH throughout. Every neutral is tinted toward the citrus hue (~96°) so nothing reads as cold grey. No pure black or white anywhere.

| Token | Value | Role |
|---|---|---|
| `--paper` | `oklch(0.985 0.009 96)` | Page ground, the sheet |
| `--card` | `oklch(0.997 0.004 96)` | Raised panels and inputs |
| `--ink` | `oklch(0.25 0.018 96)` | Primary text, and label text on lime |
| `--ink-soft` | `oklch(0.52 0.020 96)` | Secondary text, help copy |
| `--rule` | `oklch(0.90 0.014 96)` | Borders, dividers, cut-guide motif |
| `--lime` | `oklch(0.81 0.105 132)` | Primary action, selected state |
| `--lime-deep` | `oklch(0.52 0.098 136)` | Lime as text, step numerals, focus rings; passes AA on paper |
| `--tangerine` | `oklch(0.70 0.125 55)` | Card backs, secondary emphasis |
| `--tangerine-deep` | `oklch(0.50 0.115 52)` | Warning text; tangerine itself is too light for body copy |
| `--berry` | `oklch(0.52 0.190 22)` | Errors only |
| `--paper-warm` | `oklch(0.90 0.032 92)` | Aged-paper tone, the card behind in the logo |

**Strategy: Committed.** Lime carries the primary action and every selected state; tangerine marks the "back" side of a card throughout the UI, which makes the front/back distinction a color relationship the user learns once and reads everywhere. Both accents are light, so they always carry `--ink` text, never white. Color is never the sole signal: selected states also change weight, and the flip-edge warning carries text.

## Typography

Two families. **Fraunces** carries the wordmark, section headings, and both sides of a card wherever a card is shown, on screen or in print. Its WONK axis is on: the cocked, slightly hand-cut letterforms are where the product's personality lives, and they keep headings from reading as another neutral geometric sans. **Geist Sans** carries the interface: labels, buttons, help copy, counts. UI chrome never uses the display face, and card content never uses the interface face.

Geist Mono is reserved for the raw input textarea and for literal character listings, where it signals editability and disambiguates glyphs.

Fixed rem scale, ratio ~1.2:

| Step | Size / line-height | Use |
|---|---|---|
| `display` | clamp(2.75rem, 7vw, 4.25rem) / 1, Fraunces 700, tracking -0.025em | Wordmark |
| `heading` | 2rem / 1, Fraunces 700, tracking -0.02em | Section headings |
| `card` | 1.0625rem / 1.2, Fraunces 700 | Preview card fronts, mirroring the print |
| `body` | 0.9375rem / 1.5, weight 400 | Default |
| `label` | 0.8125rem / 1.4, weight 500 | Field labels, controls |
| `micro` | 0.8125rem / 1.4, weight 400 | Help text, counts. Not below 13px: this is the mobile floor |

Body prose capped at 65ch.

## Layout

Single column, max-width 64rem, centered. Two panels side by side above 64rem: input (wider) and settings. They stack on narrow screens with input first, since it is where the task starts.

Spacing is deliberately uneven for rhythm: tight within a control group (0.5rem), comfortable between fields (1.25rem), generous between page sections (4rem). Not one padding value everywhere.

The dashed cut-guide line is the recurring motif, borrowed from the PDF: it separates page sections and outlines the sheet diagram, so the app visually quotes its own output.

The three print steps sit full width below both panels, never inside the input column. They reference the flip setting, so on a narrow screen they have to come after it; putting them in the left column made the copy say "above" about a control that had reflowed below.

## Logo

Two cards caught mid-shuffle, in `src/components/logo.tsx` and mirrored as a favicon in `public/icon.svg`. Keep the two in step if the shapes change. The cards spread apart on hover, which is the one place the logo is allowed to move. The mark is the only rounded-square, saturated-lime element in the product, so it stays distinct from the UI's controls.

## Components

- **Buttons.** Primary is lime with ink text, radius 0.625rem. Secondary is a 1px `--rule` outline on card. Every button carries default, hover, focus-visible, active, disabled, and loading states.
- **Segmented control**, the single control vocabulary for every either/or choice: input mode, paper, flip edge, cutting guides. A lime pill marks the active segment. There are no native selects or checkboxes left in the product; one affordance covers all of them.
- **Drop zone.** Dashed `--rule` border, lime tint and border on drag-over.
- **Sheet diagram.** A live miniature of the chosen grid on the chosen paper, drawn from the same constants as the PDF generator, with filled cells showing how much of the sheet the deck uses. The diagrams *are* the layout control: you pick a layout by clicking the sheet you want, not from a list of numbers.
- **Card preview.** Real proportioned mini-cards carrying the same category mark and the same typeface as the print, which flip on hover and focus to reveal the back. Tangerine edge marks the back.
- Loading is inline on the action button, never a spinner over content. Empty state teaches the input format rather than saying "nothing here".

## Motion

150 to 250ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart). Transform and opacity only.

Motion is reserved for revealing state: the segmented pill, the card flip, the sheet diagram redrawing when the layout changes. No page-load choreography. All of it collapses to instant under `prefers-reduced-motion: reduce`.

## The Game Page

`/enough-about-the-weather` does not follow anything above it. Enough About the Weather! is a boxed game that happens to be printed with Flashy, not a page of Flashy, and the design says so: nothing about the route reads as the app wearing a different colour.

Everything is scoped under `.eatw` in `src/app/enough-about-the-weather/edition.css` and never touches the app's tokens. The two systems share exactly one thing, `CategoryMark`, so the four piles on screen carry the same path data the printer draws.

**Register.** Brand, not product. The app serves a task; this page is the artifact. It gets typographic risk, a drenched ground, and art direction the app would never earn.

### Colour

Strategy: **drenched**. The brick lid is the surface, not a background behind content.

| Token | Value | Role |
|---|---|---|
| `--brick` | `oklch(0.505 0.175 32)` | The lid. The page ground |
| `--brick-deep` | `oklch(0.355 0.13 30)` | Box edge, prose links on cream, the banknote figure |
| `--cream` | `oklch(0.945 0.038 85)` | Reading panels, copy on brick |
| `--cream-dim` | `oklch(0.90 0.045 84)` | Pile cards and the starter box, one step back from a panel |
| `--edition-ink` | `oklch(0.225 0.05 38)` | Every rule and border, body copy on cream |
| `--edition-ink-soft` | `oklch(0.39 0.045 40)` | Secondary copy on cream |
| `--mustard` | `oklch(0.83 0.155 85)` | Primary buttons, the second headline line, the footer rule |
| `--fluo` | `oklch(0.70 0.235 8)` | Fluorescent pink. **Fills only** |
| `--fluo-deep` | `oklch(0.58 0.235 8)` | The same ink where it has to carry a glyph |
| `--edition-teal` | `oklch(0.55 0.10 205)` | The Hard disc, and the banknote's hatching |

**The pink is spent on four things and no more:** the exclamation point, the words "one of them pays", the Seriously? sticker, and the rule numerals. That is the pile carrying money and the promise that it does, so the loudest ink in the system points at the one thing the game is about. Spending it anywhere else spends the only emphasis the page has.

**Pink is a fill, not a text colour.** At riso brightness it measures 2.77:1 on cream and 1.97:1 on brick, so it fails as type in both directions. Anything set *in* pink uses `--fluo-deep` (4.11:1 on cream); anything set *on* pink takes `--edition-ink` (5.32:1). The hero's exclamation point is mustard with the pink offset behind it, two inks out of register, which is how it stays both legible and fluorescent. Mustard is likewise large-text only on brick at 3.76:1: the ticker, footer copy and links are cream.

### Typography

**Anybody** for display, **Archivo** for reading, loaded in the route's own layout so they never ship with the app. Neither appears anywhere else in Flashy, which is the point.

Anybody is a variable grotesque carrying a width axis, and the width is doing the work, not the weight alone: the headline runs at `wdth 120 / wght 900` so it fills the lid edge to edge, section headings at 116, buttons and stickers at 78 to 86 where the copy has to compress. Set `font-variation-settings` explicitly on anything display; the axis default is nowhere near wide enough and reads as an ordinary bold sans.

The headline is authored as three stacked lines rather than left to wrap, and the last line is `white-space: nowrap` so the exclamation point can never separate from the word it belongs to.

### Composition

A box lid: a 3px ink border with a dashed cream rule inside it, cream panels stacked down the middle, and a hard offset shadow that makes the whole thing sit on the page like an object with a thickness.

- **The four piles are dealt, not gridded.** Each card carries a small fixed rotation and squares up on hover. Even spacing would make them a table of contents.
- **The edition stamp is load-bearing.** The deck is reissued yearly, so the year is stated on the lid like a date stamp on a box. Next year it changes and the page is new again. It is not decoration and should not be dropped.
- **Buttons are physical**: 3px ink border, a 5px hard shadow underneath, and they travel on press. No radius anywhere on the page except the discs and the mark.

### The mark

A rain cloud that is also a speech bubble, with the rain replaced by an exclamation point. Small talk, ended. It lives in `src/app/enough-about-the-weather/mark.tsx` and is deliberately not the Flashy card-stack: the game is its own object. Flashy is credited in the footer instead.

### Route structure

The app and its credit footer live in the `(paper)` route group; the game page brings its own footer and could not sit on Flashy's paper ground. Route groups do not change URLs, so `/` is unaffected.

## Print Design (the PDF)

The printed artifact follows the same system, adapted for ink economy. It is designed for a mono laser printer: no background fills, no colour carrying meaning, nothing that fails in black and white.

- **Both sides are set in Fraunces**, the same face as the wordmark, so a card reads as one object rather than two halves: the display cut on the front, a lighter cut a size smaller on the back. The weight difference alone tells you which side you are holding. Scripts Fraunces does not cover (CJK, Cyrillic, Greek) fall back to their pack's bold and regular weights.

  Both Fraunces cuts are instanced at `opsz=44`. The optical-size axis at its default (14) produces broken advance widths through pdf-lib, showing as gaps inside words; pin `opsz` when adding any further cut.
- **Text is optically centred**, lifted slightly above the true middle, which otherwise reads as sitting low.
- **Words are never broken.** The type shrinks until every word fits whole. Only scripts written without spaces (CJK) break between characters.
- **Cut guides use the printer's idiom**: solid trim marks in the margin where the blade starts, and a dashed line across the card area so no heavy rule prints between cards. They are drawn dark enough to follow with scissors under ordinary light, which matters more than keeping them invisible: they sit exactly on the cut, so a clean cut removes them anyway.
- **Sheet furniture lives in the margin**, outside the trim marks: deck name, which side, which sheet. It is cut away with the waste, so it helps you handle the sheets while costing the cards nothing.
- **No index numbers or page furniture on the cards themselves.** Nothing prints that is not content or ornament.

### Category ornaments

A card front that names a category prints that category's mark above it. Mark and label are laid out as one composition and centred together, never with the mark pinned to the card edge: pinning left a one-word label floating far from its mark while a three-line label sat tight against one, so the spacing read as accidental from card to card. The marks are line art in a 24x24 box, one grey, sized to about 12mm, and they have to survive a mono laser at that size: no fine hatching, no fills that clog.

| Category | Mark | Why |
|---|---|---|
| Easy | Smiling face | The question, and the face you make answering it |
| Hard | Peak with a snowcap | Something to climb |
| Serious or Cringey | Comedy and tragedy masks | One category, two moods, decided when it is read out. Set side by side, never overlapping: at 12mm any overlap makes the pair read as one blob |
| Ask Others | Speech bubble with an ellipsis | Someone else does the talking |
| anything else | The Flashy card-stack | Ordinary decks still get a front marker |

Path data lives in `src/lib/categories.ts` and is shared by the PDF and the on-screen preview, so the preview cannot drift from the print.
