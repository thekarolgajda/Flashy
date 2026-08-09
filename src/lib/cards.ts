/**
 * Card parsing: turns the raw textarea contents into the card list the PDF
 * generator consumes. Deliberately dependency-free so it can be unit tested
 * and reused from a future server route.
 */

export type Card = {
  front: string;
  back: string;
};

export type ParseResult = {
  cards: Card[];
  /** 1-indexed source lines that had no separator and were skipped. */
  skippedLines: number[];
};

/** Turns a literal backslash-n typed by the user into a real line break. */
function unescapeBreaks(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

/**
 * One card per non-empty line, `front<separator>back`. Only the first
 * occurrence of the separator splits, so backs may contain it freely.
 */
export function parseCards(input: string, separator = "|"): ParseResult {
  const cards: Card[] = [];
  const skippedLines: number[] = [];

  input.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === "") return;

    const at = line.indexOf(separator);
    if (at === -1) {
      skippedLines.push(index + 1);
      return;
    }

    const front = unescapeBreaks(line.slice(0, at));
    const back = unescapeBreaks(line.slice(at + separator.length));
    if (front === "" && back === "") return;

    cards.push({ front, back });
  });

  return { cards, skippedLines };
}

export const SAMPLE_INPUT = `bonjour | hello
merci | thank you
s'il vous plaît | please
au revoir | goodbye
Where is the station? | Où est la gare ?`;
