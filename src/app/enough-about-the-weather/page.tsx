import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CategoryMark } from "@/components/category-mark";
import { LogoMark } from "@/components/logo";
import { assetUrl } from "@/lib/assets";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Enough About the Weather: A Dinner-Table Question Game";
const DESCRIPTION =
  "Rules for Enough About the Weather, a question game for the dinner table. The youngest players drive, four piles run from easy to sincere, and the hardest questions pay cash. Print your own deck with Flashy.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/enough-about-the-weather" },
  openGraph: {
    type: "article",
    url: `${SITE_URL}/enough-about-the-weather`,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/*
 * The four piles, each rendered with the ornament the PDF prints. `front` is
 * the literal label a deck's first column carries, so CategoryMark resolves it
 * through categoryFor() exactly as the printed card does. The sheet cannot
 * show a mark the printer would not.
 */
const PILES = [
  {
    front: "Easy",
    blurb: "Warm-ups. Answerable without thinking, which is the point. Nobody opens cold.",
    example: "What's your favorite thing to do on a snow day?",
  },
  {
    front: "Hard",
    blurb: "Takes a beat. Still nothing personal at stake, just a question worth chewing on.",
    example: "If you could only keep one possession, what would it be?",
  },
  {
    front: "Seriously?",
    blurb:
      "The sincere ones. Every card in this pile carries a dollar value, and the pile is named for the noise people make when they draw one.",
    example: "What are you most proud of?",
  },
  {
    front: "Ask others",
    blurb:
      "The reversal. The player doesn't answer this one. They aim it at an adult, and then anyone else can follow.",
    example: "What was dating like before smartphones?",
  },
];

const STEPS: { title: string; body: ReactNode }[] = [
  {
    title: "Write the questions",
    body: (
      <>
        This is the first rule because it is the best part of the game, not preparation for it.
        Sort them into the four piles as you go, and put a dollar value on each Seriously? card.
        Write a fresh set every year. If you want somewhere to start, take{" "}
        <a
          href="#starter-questions"
          className="underline decoration-rule underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
        >
          ours
        </a>
        .
      </>
    ),
  },
  {
    title: "Print the deck",
    body: "Two columns, pile name and question, run through Flashy into a double-sided PDF you print at home and cut apart. Make it as long or as short as you like. There is no correct number of cards.",
  },
  {
    title: "The youngest players drive",
    body: "At our table that's the teens. They run the game: they pick the pile and they take the card. Adults don't deal, don't choose, and don't decide when it's time for a serious one.",
  },
  {
    title: "Pick a pile, take the top card",
    body: "Choosing the pile is choosing the temperature. A table that stays in Easy all night has still played the game correctly.",
  },
  {
    title: "Earn your way to Seriously?",
    body: "You have to answer an Easy or a Hard question before you may take a Seriously? card. Nobody opens on a sincere one, and nobody skips straight to the money.",
  },
  {
    title: "Answer it, or ask it",
    body: "Easy, Hard and Seriously? cards are answered by the player who drew them. An Ask others card gets pointed at somebody else instead.",
  },
  {
    title: "Pass as often as you like",
    body: "Any card can go back for another. No forfeit, no penalty, no comment from the table. The freedom to pass is what makes people willing to not.",
  },
  {
    title: "Play until the deck runs out",
    body: "However many cards you wrote, that's the evening. No score, everybody wins!",
  },
];

function Pile({ front, blurb, example }: (typeof PILES)[number]) {
  return (
    <li className="flex flex-col rounded-xl bg-card p-5 ring-1 ring-rule">
      <div className="flex items-center gap-3">
        <CategoryMark front={front} className="size-7 shrink-0 text-ink-soft" />
        <h3 className="font-display text-[1.25rem] leading-none font-bold tracking-[-0.015em]">
          {front}
        </h3>
      </div>
      <p className="mt-3.5 text-[0.9375rem] leading-relaxed text-ink-soft">{blurb}</p>
      <p className="font-display mt-4 border-t border-rule pt-3.5 text-[0.9375rem] leading-snug text-balance">
        {example}
      </p>
    </li>
  );
}

export default function EnoughAboutTheWeatherPage() {
  return (
    <main className="mx-auto w-full max-w-5xl grow px-6 py-14 sm:py-20">
      <Link
        href="/"
        className="logo group inline-flex items-center gap-2.5 text-ink-soft transition-colors hover:text-ink"
      >
        <LogoMark className="size-7 shrink-0" />
        <span className="font-display text-[1.125rem] leading-none font-bold tracking-[-0.02em]">
          Flashy
        </span>
      </Link>

      {/*
        Both lines are bound with non-breaking spaces rather than trusted to
        text-balance alone. Balance equalises line lengths but will still hang
        an article at a line end, and it has no idea that "Easy questions, hard
        questions" is a parallel that must not be split across lines, which is
        the whole rhythm of the sentence.
      */}
      <header className="mt-12">
        <h1 className="font-display max-w-[20ch] text-[clamp(2.5rem,6.5vw,4rem)] leading-[0.98] font-bold tracking-[-0.03em] text-balance">
          Enough About the&nbsp;Weather
        </h1>
        <p className="font-display mt-7 max-w-[40ch] text-[clamp(1.2rem,3vw,1.6rem)] leading-[1.35] font-semibold tracking-[-0.015em] text-balance">
          Easy questions, hard&nbsp;questions, and a few we&rsquo;ll pay you to&nbsp;answer.
        </p>
      </header>

      <p className="mt-8 max-w-[62ch] text-[1.0625rem] leading-relaxed text-ink-soft">
        A question game for the dinner table, built for a family with teenagers in it. You write
        the questions yourselves, which is the first rule and half the fun. The other half runs on
        one idea: the questions aren&rsquo;t the hard part. Everybody already knows what
        they&rsquo;re proudest of. Saying it out loud, to the people who raised you or the people
        you raised, is the hard part, so the cards that ask for that come with money attached.
      </p>

      <div className="rule-dashed mt-14" />

      <section className="mt-12">
        <h2 className="font-display text-[2rem] leading-none font-bold tracking-[-0.02em]">
          How it&rsquo;s played
        </h2>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-xl bg-rule ring-1 ring-rule">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-5 bg-card px-5 py-5 sm:px-6">
              <span className="font-display text-[1.5rem] leading-none font-bold text-lime-deep">
                {index + 1}
              </span>
              <div>
                <h3 className="font-display text-[1.125rem] leading-tight font-bold tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-[2rem] leading-none font-bold tracking-[-0.02em]">
          The four piles
        </h2>
        <p className="mt-4 max-w-[62ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          Every card names its pile on the front, above the mark. The deck is sorted so a player
          can see what they&rsquo;re choosing before they choose it.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {PILES.map((pile) => (
            <Pile key={pile.front} {...pile} />
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-[2rem] leading-none font-bold tracking-[-0.02em]">
          The money
        </h2>
        <div className="mt-8 rounded-xl bg-card p-6 ring-1 ring-rule sm:p-8">
          <p className="max-w-[62ch] text-[1.0625rem] leading-relaxed">
            Only <span className="font-semibold">Seriously?</span> cards pay. The amount is printed
            on the card, from{" "}
            <span className="font-mono text-[0.9375rem] text-tangerine-deep">$1</span> to{" "}
            <span className="font-mono text-[0.9375rem] text-tangerine-deep">$5</span>. We settle up
            at the end of the night, but when the money actually changes hands is up to whoever is
            playing.
          </p>
          <p className="mt-5 max-w-[62ch] text-[1.0625rem] leading-relaxed text-ink-soft">
            One adult banks the whole game. Nobody else chips in, and there&rsquo;s no pot to divide
            at the end. It&rsquo;s a bribe, paid by the person who most wants to hear the answer.
            Pass on a card and no money moves, which is the only thing passing costs.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-[2rem] leading-none font-bold tracking-[-0.02em]">
          Writing the deck
        </h2>
        <p className="mt-4 max-w-[62ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          Rule one, in practice. The deck is a two-column CSV (pile name, then question) run
          through{" "}
          <Link
            href="/"
            className="underline decoration-rule underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
          >
            Flashy
          </Link>
          , which lays it out as a double-sided PDF you can print at home and cut apart. Pick the
          20-per-sheet grid for card-game proportions.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-xl bg-card p-5 font-mono text-[0.8125rem] leading-relaxed text-ink-soft ring-1 ring-rule">
          <code>{`Easy,What is your favorite color?
Hard,What is your dream vacation?
Seriously?,What are you most proud of? $3
Ask others,What was dating like before smartphones?`}</code>
        </pre>
        <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-ink-soft">
          The pile names are recognised from the text itself, so there&rsquo;s no setting to
          change: write <span className="font-mono text-[0.9375rem]">Easy</span>,{" "}
          <span className="font-mono text-[0.9375rem]">Hard</span>,{" "}
          <span className="font-mono text-[0.9375rem]">Seriously?</span> and{" "}
          <span className="font-mono text-[0.9375rem]">Ask others</span> and each card prints its
          own mark. Rename a pile to whatever your table calls it.{" "}
          <span className="font-mono text-[0.9375rem]">Cringey</span> and{" "}
          <span className="font-mono text-[0.9375rem]">Possibly Serious</span> both land on the same
          ornament.
        </p>

        {/*
          Served from public/, so the URL needs assetUrl() to survive the /Flashy
          base path. Next prefixes its own routes but not a bare href.
        */}
        <div
          id="starter-questions"
          className="mt-8 scroll-mt-8 rounded-xl bg-card p-6 ring-1 ring-rule"
        >
          <h3 className="font-display text-[1.25rem] leading-tight font-bold tracking-[-0.015em]">
            Starter questions
          </h3>
          <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-ink-soft">
            Thirty-one of ours to begin with, across all four piles. Use them as they are, or read
            them once and then write your own, which is the better game.
          </p>
          <a
            href={assetUrl("/enough-about-the-weather-sample.csv")}
            download="enough-about-the-weather-sample.csv"
            className="mt-5 inline-flex rounded-lg border border-rule bg-card px-3.5 py-2 text-[0.8125rem] font-medium transition-colors duration-150 hover:border-ink-soft/60 active:bg-rule/30"
          >
            Download the sample deck (CSV)
          </a>
        </div>
      </section>
    </main>
  );
}
