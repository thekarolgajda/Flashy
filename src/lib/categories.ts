/**
 * Card categories and the ornament each one prints.
 *
 * A card's front text is matched against these categories. When it matches,
 * the front carries that category's mark; anything else falls back to the
 * Flashy card-stack. That means a category deck needs no extra setting: a CSV
 * whose first column is `Easy` or `Ask Others` is simply understood.
 *
 * Every mark is line art in a 24x24 box, drawn in a single grey. They have to
 * survive a mono laser printer at about 12mm wide, so there are no fills to
 * clog, no fine hatching, and no colour carrying meaning.
 */

export type CategoryId = "easy" | "hard" | "mixed" | "ask" | "default";

export type Category = {
  id: CategoryId;
  /** Matched against the lowercased, trimmed front text. */
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
    matches: /^easy$/,
    stroke:
      "M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12 Z M7 13.8 A5.6 5.6 0 0 0 17 13.8",
    fill:
      "M7.4 9.3 A1.3 1.3 0 1 0 10 9.3 A1.3 1.3 0 1 0 7.4 9.3 Z M14 9.3 A1.3 1.3 0 1 0 16.6 9.3 A1.3 1.3 0 1 0 14 9.3 Z",
  },
  {
    // A peak to climb.
    id: "hard",
    matches: /^hard$/,
    stroke: "M1.5 20 L9 5 L13.6 13 L16.6 8.4 L22.5 20 Z",
    fill: "M9 5 L12.1 10.4 L5.9 11.6 Z",
  },
  {
    /*
     * One category, two possible moods, decided when the question is read out.
     * A disc half light and half dark says either/or without committing to a
     * face for each.
     */
    id: "mixed",
    matches: /^(serious|cringey|cringy|serious or cringey|serious\/cringey)$/,
    stroke: "M2 12 A10 10 0 1 0 22 12 A10 10 0 1 0 2 12 Z M12 2 L12 22",
    fill: "M12 2 A10 10 0 0 1 12 22 Z",
  },
  {
    // Someone else does the talking: a bubble with another voice inside it.
    id: "ask",
    matches: /^(ask others|ask someone|ask another|ask)$/,
    stroke:
      "M2 5.5 A3 3 0 0 1 5 2.5 L19 2.5 A3 3 0 0 1 22 5.5 L22 13.5 A3 3 0 0 1 19 16.5 L9.5 16.5 L5 20.8 L5.9 16.5 A3 3 0 0 1 2 13.5 Z",
    fill:
      "M6.8 9.5 A1.25 1.25 0 1 0 9.3 9.5 A1.25 1.25 0 1 0 6.8 9.5 Z M10.75 9.5 A1.25 1.25 0 1 0 13.25 9.5 A1.25 1.25 0 1 0 10.75 9.5 Z M14.7 9.5 A1.25 1.25 0 1 0 17.2 9.5 A1.25 1.25 0 1 0 14.7 9.5 Z",
  },
  {
    // Anything that is not a category: the Flashy mark itself.
    id: "default",
    matches: /^$/,
    stroke:
      "M4 9.5 L15.5 6.5 L19 16 L7.5 19 Z M6.5 7 L18 4 L20 9 M10 13.5 L16 12",
  },
];

const DEFAULT_CATEGORY = CATEGORIES[CATEGORIES.length - 1];

/** The category a card front names, or the fallback mark. */
export function categoryFor(frontText: string): Category {
  const key = frontText.trim().toLowerCase();
  return CATEGORIES.find((category) => category.matches.test(key)) ?? DEFAULT_CATEGORY;
}

/** True when the deck is a set of category cards rather than plain terms. */
export function isCategoryDeck(fronts: string[]): boolean {
  if (fronts.length === 0) return false;
  const named = fronts.filter((front) => categoryFor(front).id !== "default");
  return named.length / fronts.length >= 0.6;
}
