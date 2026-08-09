# Product

## Register

product

## Users

Anyone who needs physical cards. Two groups, served by the same product:

- **Studying**: language learners drilling vocabulary, students turning notes into a deck before an exam, teachers printing a set for a class.
- **Playing**: people making question decks for a game, where the front names a type of card (`Easy`, `Ask Others`) and the back carries the prompt. This came from real use, a family question game, and it is why cards carry category ornaments.

No login, no account, no library of saved decks. The user arrives with text they already have, in a hurry, and wants paper.

The job to be done is narrow and complete in one sitting: get text in, get a correct printable PDF out, print it, cut it. Success is a stack of cards where every back is on the correct front, and which looks like it was made on purpose.

## Product Purpose

Flashy converts a list of card pairs into a double-sided PDF laid out for duplex printing. It exists because the fiddly part of making physical flashcards is not the writing, it is the layout: getting backs to mirror fronts correctly so they survive a double-sided print.

Everything runs in the browser. Card text is never uploaded. That is a real property of the product, not a marketing line, and the interface should quietly reflect it.

## Brand Personality

Fresh, capable, cheerful. The tone of a well-made consumer tool that is happy to see you but does not waste your time. Confident enough to have opinions (sensible defaults, one obvious primary action), never cute at the expense of clarity.

Three words: bright, deft, unfussy.

## Anti-references

- **Generic AI/SaaS gradient look.** No purple-blue gradients, no glass cards, no hero-metric blocks, no gradient text.
- **Childish or clip-art styling.** No mascots, no cartoon flourishes, no kindergarten primaries. Adults use this; playfulness comes from color and motion, never from condescension.
- **Corporate enterprise tooling.** No grey-on-grey density, no crowded toolbars, no Bootstrap-era form controls.
- **Existing flashcard software (Anki and similar).** Utilitarian, dated, configuration-first. Flashy should feel like the opposite: opinionated defaults, almost nothing to configure.

## Design Principles

1. **The paper is the product.** The screen is a means to a printed artifact. The interface should echo paper, and the PDF deserves as much design attention as the app.
2. **Show the output, don't describe it.** Prefer a visual of what will be printed over a label stating it. The user's real question is always "what will come out of my printer".
3. **One obvious action.** Input, a handful of defaults worth changing, and a single primary button. Nothing competes with Download.
4. **Warn where it actually hurts.** The duplex flip edge and dropped characters are the two failures that waste paper. Surface those; stay quiet about everything else.
5. **Delight in moments, not pages.** A card that flips, a layout that redraws. Never decorative motion for its own sake.

## Accessibility & Inclusion

WCAG 2.1 AA as the floor: 4.5:1 for body text, 3:1 for UI boundaries and large text. The citrus accents are light, so they carry dark ink text rather than white, and are never the only signal for state. Full keyboard operation including the file picker and drop zone. Honour `prefers-reduced-motion` for the card flip and layout transitions. Form controls keep visible focus rings.
