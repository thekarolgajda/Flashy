# Design

## Visual Theme

Light, committed. Not a system-preference toggle.

The scene: someone at a desk in daylight, about to send paper through a printer, checking that what is on screen matches what will come out of the tray. The product's output is a white sheet. A warm off-white ground makes the app continuous with that sheet; a dark UI would break the relationship between screen and paper for no gain. Flashy therefore ships light only, and does not follow `prefers-color-scheme`.

Personality comes from citrus accents against warm paper neutrals, generous spacing, and motion that reveals the printed result. Never from gradients, glass, texture overlays, or illustration.

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

Two families. **Fraunces** carries the wordmark and section headings, with its WONK axis on: the cocked, slightly hand-cut letterforms are where the product's personality lives, and they keep headings from reading as another neutral geometric sans. **Geist Sans** carries everything else. UI labels, buttons and data never use the display face.

Geist Mono is reserved for the raw input textarea and for literal character listings, where it signals editability and disambiguates glyphs.

Fixed rem scale, ratio ~1.2:

| Step | Size / line-height | Use |
|---|---|---|
| `display` | clamp(2.75rem, 7vw, 4.25rem) / 1, Fraunces 700, tracking -0.025em | Wordmark |
| `heading` | 2rem / 1, Fraunces 700, tracking -0.02em | Section headings |
| `title` | 1.375rem / 1.2, weight 600 | Section headings |
| `body` | 0.9375rem / 1.5, weight 400 | Default |
| `label` | 0.8125rem / 1.4, weight 500 | Field labels, controls |
| `micro` | 0.75rem / 1.4, weight 400 | Help text, counts |

Body prose capped at 65ch.

## Layout

Single column, max-width 64rem, centered. Two panels side by side above 64rem: input (wider) and settings. They stack on narrow screens with input first, since it is where the task starts.

Spacing is deliberately uneven for rhythm: tight within a control group (0.5rem), comfortable between fields (1.25rem), generous between page sections (4rem). Not one padding value everywhere.

The dashed cut-guide line is the recurring motif, borrowed from the PDF: it separates page sections and outlines the sheet diagram, so the app visually quotes its own output.

## Logo

Two cards caught mid-shuffle, in `src/components/logo.tsx` and mirrored as a favicon in `public/icon.svg`. Keep the two in step if the shapes change. The cards spread apart on hover, which is the one place the logo is allowed to move. The mark is the only rounded-square, saturated-lime element in the product, so it stays distinct from the UI's controls.

## Components

- **Buttons.** Primary is lime with ink text, radius 0.625rem. Secondary is a 1px `--rule` outline on card. Every button carries default, hover, focus-visible, active, disabled, and loading states.
- **Segmented control** for the input mode switch: a lime pill slides behind the active segment.
- **Drop zone.** Dashed `--rule` border, lime tint and border on drag-over.
- **Sheet diagram.** A live miniature of the chosen grid on the chosen paper, drawn from the same constants as the PDF generator. It is the primary explanation of the layout options; the select is secondary.
- **Card preview.** Real proportioned mini-cards that flip on hover and focus to reveal the back. Tangerine edge marks the back.
- Loading is inline on the action button, never a spinner over content. Empty state teaches the input format rather than saying "nothing here".

## Motion

150 to 250ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart). Transform and opacity only.

Motion is reserved for revealing state: the segmented pill, the card flip, the sheet diagram redrawing when the layout changes. No page-load choreography. All of it collapses to instant under `prefers-reduced-motion: reduce`.

## Print Design (the PDF)

The printed artifact follows the same system, adapted for ink economy. It is designed for a mono laser printer: no background fills, no colour carrying meaning, nothing that fails in black and white.

- **Fronts are set in Fraunces**, the same display face as the wordmark, so the card reads in the voice of the app that made it. Backs are Noto Sans, lighter and a size smaller. The weight difference alone tells you which side you are holding. Scripts Fraunces does not cover fall back to their pack's bold weight.
- **Text is optically centred**, lifted slightly above the true middle, which otherwise reads as sitting low.
- **Words are never broken.** The type shrinks until every word fits whole. Only scripts written without spaces (CJK) break between characters.
- **Cut guides use the printer's idiom**: solid trim marks in the margin where the blade starts, and a hairline dashed line across the card area so no heavy rule prints between cards.
- **Sheet furniture lives in the margin**, outside the trim marks: deck name, which side, which sheet. It is cut away with the waste, so it helps you handle the sheets while costing the cards nothing.
- **No index numbers or page furniture on the cards themselves.** Nothing prints that is not content or ornament.

### Category ornaments

A card front that names a category prints that category's mark beneath it. The marks are line art in a 24x24 box, one grey, sized to about 12mm, and they have to survive a mono laser at that size: no fine hatching, no fills that clog.

| Category | Mark | Why |
|---|---|---|
| Easy | Smiling face | The question, and the face you make answering it |
| Hard | Peak with a snowcap | Something to climb |
| Serious or Cringey | Comedy and tragedy masks | One category, two moods, decided when it is read out. Set side by side, never overlapping: at 12mm any overlap makes the pair read as one blob |
| Ask Others | Speech bubble with an ellipsis | Someone else does the talking |
| anything else | The Flashy card-stack | Ordinary decks still get a front marker |

Path data lives in `src/lib/categories.ts` and is shared by the PDF and the on-screen preview, so the preview cannot drift from the print.
