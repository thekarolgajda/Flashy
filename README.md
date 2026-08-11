# Flashy

Web-based flashcard generator. Give it your cards and get back a printable,
double-sided PDF laid out for duplex printing, so every back lands on the right
front.

Everything happens in your browser: no account, no upload, no server. Your card
text never leaves the page.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Input

**Type or paste**: one card per line, front and back split by a separator
(default `|`, configurable):

```
bonjour | hello
merci | thank you
```

Use `\n` for a line break inside a card. Only the first separator on a line
splits, so backs can contain it.

**Upload CSV**: first column is the front, second is the back. Quoted cells,
embedded commas and newlines, `;`/tab delimiters, and header rows are all
handled. Commas inside an unquoted column are fine too. See
`public/sample-flashcards.csv`.

## Category decks

Cards do not have to be term and definition. If a card's front names a card
type, it prints that type's mark beneath the name, which is enough to build a
question game: front tells you what kind of card you drew, back has the prompt.

| Front reads | Mark |
|---|---|
| Easy | smiling face |
| Hard | peak |
| Serious, Cringey, or both | comedy and tragedy masks |
| Ask Others | speech bubble |
| anything else | the Flashy card-stack |

Nothing to configure: a CSV of `Category,Question` is simply recognised.
Matching is on keywords, so `Possibly Serious or Cringey` and `Serious/Cringey`
both find the masks.

## Printing

The PDF alternates front and back pages, one pair per sheet. Print it
double-sided and make sure the **flip edge in your print dialog matches the
setting in the app**. Long edge is the usual default. If the backs come out on
the wrong cards, that setting is the reason.

Cutting guides are drawn by default: solid trim marks in the margin where the
blade starts, and dashed lines across the cards to follow. The deck name, which
side it is, and the sheet number are printed in the margin, outside the trim
marks, so they are cut away with the waste and never appear on a card.

Everything is set in black only, so it prints on a mono laser without losing
anything.

## Languages

Latin, Greek, Cyrillic, Chinese, Japanese and Korean all print correctly. Fonts are fetched only when your deck needs them, so an English deck never downloads a CJK font. Anything no bundled font can draw (emoji, mostly) is listed in the app and left off the cards.

## Development

```bash
npm run build   # production build, also typechecks
npm run lint
```

There is no test runner yet. `src/lib/` is deliberately free of React and
browser globals so one can be added without further work. `CLAUDE.md` documents
the architecture and the font traps worth knowing before changing print output.

## Stack

Next.js (App Router) · React · Tailwind CSS · [pdf-lib](https://pdf-lib.js.org)
· harfbuzz-wasm for font subsetting · Fraunces and Noto Sans

## Licence

The code is MIT, see [LICENSE](LICENSE).

The bundled third-party files keep their own licences, which travel with them:

- Fraunces and Noto Sans, including the CJK faces in `public/fonts/`, are under
  the SIL Open Font License 1.1. The licence text sits beside them as
  `OFL-Fraunces.txt`, `OFL-NotoSans.txt` and `OFL-NotoSansCJK.txt`.
- `public/harfbuzz-subset.wasm` comes from
  [harfbuzzjs](https://github.com/harfbuzz/harfbuzzjs) and is MIT, see
  `public/LICENSE-harfbuzzjs.txt`.

Cards are subsetted from these fonts and embedded in the PDFs you generate,
which the OFL permits: the licence restricts selling the fonts themselves, not
documents set in them.

---

Made by [Karol Gajda](https://karol.gajda.com).
