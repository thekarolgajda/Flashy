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
| `--lime` | `oklch(0.84 0.190 122)` | Primary action, selected state |
| `--lime-deep` | `oklch(0.60 0.160 128)` | Lime as text or on hover; passes AA on paper |
| `--tangerine` | `oklch(0.75 0.170 58)` | Card backs, secondary emphasis, warnings |
| `--berry` | `oklch(0.56 0.200 20)` | Errors only |

**Strategy: Committed.** Lime carries the primary action and every selected state; tangerine marks the "back" side of a card throughout the UI, which makes the front/back distinction a color relationship the user learns once and reads everywhere. Both accents are light, so they always carry `--ink` text, never white. Color is never the sole signal: selected states also change weight, and the flip-edge warning carries text.

## Typography

Geist Sans throughout, one family. Geist Mono only for the raw input textarea and for literal character listings, where it signals editability and disambiguates glyphs.

Fixed rem scale, ratio ~1.2:

| Step | Size / line-height | Use |
|---|---|---|
| `display` | 2.75rem / 1.05, weight 600, tracking -0.03em | Wordmark only |
| `title` | 1.375rem / 1.2, weight 600 | Section headings |
| `body` | 0.9375rem / 1.5, weight 400 | Default |
| `label` | 0.8125rem / 1.4, weight 500 | Field labels, controls |
| `micro` | 0.75rem / 1.4, weight 400 | Help text, counts |

Body prose capped at 65ch.

## Layout

Single column, max-width 64rem, centered. Two panels side by side above 64rem: input (wider) and settings. They stack on narrow screens with input first, since it is where the task starts.

Spacing is deliberately uneven for rhythm: tight within a control group (0.5rem), comfortable between fields (1.25rem), generous between page sections (4rem). Not one padding value everywhere.

The dashed cut-guide line is the recurring motif, borrowed from the PDF: it separates page sections and outlines the sheet diagram, so the app visually quotes its own output.

## Components

- **Buttons.** Primary is lime with ink text, radius 0.625rem. Secondary is a 1px `--rule` outline on card. Every button carries default, hover, focus-visible, active, disabled, and loading states.
- **Segmented control** for the input mode switch: a lime pill slides behind the active segment.
- **Drop zone.** Dashed `--rule` border, lime tint and border on drag-over.
- **Sheet diagram.** A live miniature of the chosen grid on the chosen paper, drawn from the same constants as the PDF generator. It is the primary explanation of the layout options; the select is secondary.
- **Card preview.** Real proportioned mini-cards that flip on hover and focus to reveal the back. Tangerine edge marks the back.
- Loading is inline on the action button, never a spinner over content. Empty state teaches the input format rather than saying "nothing here".

## Motion

150–250ms, `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quart). Transform and opacity only.

Motion is reserved for revealing state: the segmented pill, the card flip, the sheet diagram redrawing when the layout changes. No page-load choreography. All of it collapses to instant under `prefers-reduced-motion: reduce`.

## Print Design (the PDF)

The printed artifact follows the same system, adapted for ink economy. Ink-light and typographic: no background fills, no colored rules, nothing that costs a colour cartridge or fails on a mono laser printer.

- Fronts set in bold at a larger optical size; backs regular and slightly smaller. The weight difference alone tells you which side you are holding.
- Text auto-fits and centers optically within the card.
- Cut guides are hairline dashed rules in a light grey, extending to the sheet edge.
- Each card carries a small muted index number on both sides, positioned so it lands in the same corner after cutting. It lets the user verify duplex alignment at a glance and re-pair cards that get shuffled while cutting. This is the one piece of non-content ink on the page and it earns its place.
