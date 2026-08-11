/*
 * One source for the questions people actually arrive with. Rendered on the
 * page by <Faq> and emitted as FAQPage JSON-LD by <StructuredData>.
 *
 * They must stay one source: Google treats FAQ markup describing text that is
 * not visible on the page as a structured-data violation, so a copy that
 * drifted from the rendered section would be worse than no markup at all.
 * Answers are plain strings for that reason too — nothing here can carry
 * formatting the JSON-LD would have to strip.
 */
export type FaqEntry = { question: string; answer: string };

export const FAQ: FaqEntry[] = [
  {
    question: "Is Flashy really free?",
    answer:
      "Yes. Flashy is free, with no account, no sign-up, no watermark, and no limit on how many flashcards you make. It is open source under the MIT licence.",
  },
  {
    question: "How do I print double-sided flashcards so the backs line up?",
    answer:
      "Flashy lays the PDF out for you. Each sheet becomes two pages, fronts then backs, and the back page mirrors the grid so every answer prints on the reverse of its own question. Pick whether your printer flips on the long edge or the short edge, print the PDF double-sided at 100% scale, then cut along the guides.",
  },
  {
    question: "Can I make flashcards from a CSV or spreadsheet?",
    answer:
      "Yes. Export your sheet as CSV and upload it: the first column is the front, the second is the back. Quoted cells, commas and line breaks inside a cell, semicolon and tab delimiters, and header rows are all handled, so an export from Excel, Numbers, Google Sheets, Anki, or Quizlet generally works as-is.",
  },
  {
    question: "Does my card text get uploaded anywhere?",
    answer:
      "No. Everything runs in your browser, including reading the CSV and building the PDF. Nothing you type is sent to a server, because there is no server. You can put the page in a browser tab, go offline, and it still works.",
  },
  {
    question: "What paper sizes and card sizes can I use?",
    answer:
      "A4 and US Letter, with grids from 2x2 up to 4x5 cards per sheet. A smaller grid gives bigger cards; the preview shows the exact proportions you will print.",
  },
  {
    question: "Can I make flashcards in Japanese, Chinese, Korean, or other scripts?",
    answer:
      "Yes. Flashy embeds real Unicode fonts and loads only the ones your deck needs, so Japanese, Chinese, Korean, Cyrillic, Greek and accented Latin all print correctly rather than as blank boxes. Text is never broken mid-word: cards that hold a lot shrink their type instead of overflowing.",
  },
];
