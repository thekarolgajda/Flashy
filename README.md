# Flashy

Web-based flashcard generator. Give it a list of terms and get back a printable,
double-sided PDF laid out for duplex printing.

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
handled. See `public/sample-flashcards.csv`.

## Printing

The PDF alternates front and back pages, one pair per sheet. Print it
double-sided and make sure the **flip edge in your print dialog matches the
setting in the app**. Long edge is the usual default. If the backs come out on
the wrong cards, that setting is the reason.

Cutting guides are drawn by default.

## Languages

Latin, Greek, Cyrillic, Chinese, Japanese and Korean all print correctly. Fonts are fetched only when your deck needs them, so an English deck never downloads a CJK font. Anything no bundled font can draw (emoji, mostly) is listed in the app and left off the cards.

## Stack

Next.js (App Router) · React · Tailwind CSS · [pdf-lib](https://pdf-lib.js.org)
