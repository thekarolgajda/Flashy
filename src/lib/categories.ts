/**
 * Card categories and the ornament each one prints.
 *
 * A card's front text is matched against these categories. When it matches,
 * the front carries that category's mark; anything else falls back to the
 * Flashy card-stack. That means a category deck needs no extra setting: a CSV
 * whose first column is `Easy` or `Ask Others` is simply understood.
 *
 * Matching is on keywords anywhere in the label, not on the whole label, so
 * people can write the categories the way they say them out loud. "Possibly
 * Serious or Cringey", "Serious/Cringey" and "cringe" all find the same mark.
 *
 * Every mark is line art in a 24x24 box, drawn in a single grey. They have to
 * survive a mono laser printer at about 12mm wide, so there are no fills to
 * clog, no fine hatching, and no colour carrying meaning.
 */

export type CategoryId = "easy" | "hard" | "mixed" | "ask" | "default";

export type Category = {
  id: CategoryId;
  /** Keyword matched anywhere in the normalised front text. */
  matches: RegExp;
  /** SVG path in a 24x24 box, stroked. */
  stroke: string;
  /** Optional filled path, drawn under the stroke. */
  fill?: string;
};

const CATEGORIES: Category[] = [
  {
    // A plain smile: the easy question, and the face you make answering it.
    id: "easy",
    matches: /\beas(y|ier)\b/,
    stroke:
      "M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12 Z M7 13.8 A5.6 5.6 0 0 0 17 13.8",
    fill:
      "M7.4 9.3 A1.3 1.3 0 1 0 10 9.3 A1.3 1.3 0 1 0 7.4 9.3 Z M14 9.3 A1.3 1.3 0 1 0 16.6 9.3 A1.3 1.3 0 1 0 14 9.3 Z",
  },
  {
    // A peak to climb.
    id: "hard",
    matches: /\b(hard|difficult|tough|tricky)\b/,
    stroke: "M1.5 20 L9 5 L13.6 13 L16.6 8.4 L22.5 20 Z",
    fill: "M9 5 L12.1 10.4 L5.9 11.6 Z",
  },
  {
    /*
     * One category, two possible moods, decided when the question is read out.
     * Comedy and tragedy: the two faces a question can turn out to be.
     *
     * They are set side by side rather than overlapped, and each mouth sits
     * inside its own mask, because at 12mm any overlap makes the pair read as
     * one indistinct blob.
     */
    id: "mixed",
    matches: /\b(serious|cring\w*|awkward|embarrassing)\b/,
    stroke:
      "M1.5 4 A2 2 0 0 1 3.5 2 L9.5 2 A2 2 0 0 1 11.5 4 L11.5 8 A5 5 0 0 1 1.5 8 Z M4.2 9.2 Q6.5 11.4 8.8 9.2 M12.5 11 A2 2 0 0 1 14.5 9 L20.5 9 A2 2 0 0 1 22.5 11 L22.5 15 A5 5 0 0 1 12.5 15 Z M15.2 17.4 Q17.5 15.2 19.8 17.4",
    fill:
      "M3.35 5.8 A0.95 0.95 0 1 0 5.25 5.8 A0.95 0.95 0 1 0 3.35 5.8 Z M7.75 5.8 A0.95 0.95 0 1 0 9.65 5.8 A0.95 0.95 0 1 0 7.75 5.8 Z M14.35 12.8 A0.95 0.95 0 1 0 16.25 12.8 A0.95 0.95 0 1 0 14.35 12.8 Z M18.75 12.8 A0.95 0.95 0 1 0 20.65 12.8 A0.95 0.95 0 1 0 18.75 12.8 Z",
  },
  {
    // Someone else does the talking: a bubble with another voice inside it.
    id: "ask",
    matches: /\bask\w*\b/,
    stroke:
      "M2 5.5 A3 3 0 0 1 5 2.5 L19 2.5 A3 3 0 0 1 22 5.5 L22 13.5 A3 3 0 0 1 19 16.5 L9.5 16.5 L5 20.8 L5.9 16.5 A3 3 0 0 1 2 13.5 Z",
    fill:
      "M6.8 9.5 A1.25 1.25 0 1 0 9.3 9.5 A1.25 1.25 0 1 0 6.8 9.5 Z M10.75 9.5 A1.25 1.25 0 1 0 13.25 9.5 A1.25 1.25 0 1 0 10.75 9.5 Z M14.7 9.5 A1.25 1.25 0 1 0 17.2 9.5 A1.25 1.25 0 1 0 14.7 9.5 Z",
  },
  {
    // Anything that is not a category: the Flashy mark itself.
    id: "default",
    matches: /(?!)/,
    stroke:
      "M4 9.5 L15.5 6.5 L19 16 L7.5 19 Z M6.5 7 L18 4 L20 9 M10 13.5 L16 12",
  },
];

const DEFAULT_CATEGORY = CATEGORIES[CATEGORIES.length - 1];

/**
 * The category a card front names, or the fallback mark.
 *
 * Categories are checked in declaration order, so a label naming two of them
 * takes the first listed. Punctuation is flattened to spaces first, which is
 * what lets `Serious/Cringey` and `Ask-Others` match.
 */
export function categoryFor(frontText: string): Category {
  const key = frontText
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

  return CATEGORIES.find((category) => category.matches.test(key)) ?? DEFAULT_CATEGORY;
}

/** True when the deck is a set of category cards rather than plain terms. */
export function isCategoryDeck(fronts: string[]): boolean {
  if (fronts.length === 0) return false;
  const named = fronts.filter((front) => categoryFor(front).id !== "default");
  return named.length / fronts.length >= 0.6;
}
