import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CategoryMark } from "@/components/category-mark";
import { assetUrl } from "@/lib/assets";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { WeatherMark } from "./mark";

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
 * through categoryFor() exactly as the printed card does. The page cannot
 * show a mark the printer would not.
 */
const PILES = [
  {
    front: "Easy",
    blurb: "Light questions. Favorites, would-you-rathers, what you got up to this year.",
    example: "What’s your favorite thing to do on a snow day?",
    sticker: null,
  },
  {
    front: "Hard",
    blurb: "Questions that take more thought. Still nothing personal at stake.",
    example: "If you could only keep one possession, what would it be?",
    sticker: null,
  },
  {
    front: "Seriously?",
    blurb: "The sincere ones. Every card in this pile carries a dollar value.",
    example: "What are you most proud of?",
    sticker: "Pays $1 to $5",
  },
  {
    front: "Ask others",
    blurb: "You don’t answer this one. You ask it of somebody else at the table.",
    example: "What was dating like before smartphones?",
    sticker: null,
  },
];

const RULES: { title: string; body: ReactNode }[] = [
  {
    title: "Write the questions",
    body: (
      <>
        Part of the game, not preparation for it. Sort them into the four piles as you go, and put
        a dollar value on each Seriously? card. Start from <a href="#starter-questions">ours</a> if
        you like.
      </>
    ),
  },
  { title: "Print the deck", body: "Any length. There is no correct number of cards." },
  {
    title: "The youngest players drive",
    body: "At our table that’s the teens. They run the deck all evening, so the rules below call them the drivers.",
  },
  {
    title: "Pick a pile, take the top card",
    body: "The four piles sit face down. The driver reaches for one, takes the top card and reads it out. They choose the pile, not the question.",
  },
  {
    title: "Earn your way to Seriously?",
    body: "Answer an Easy or a Hard question first. No opening on a money question.",
  },
  {
    title: "Answer it, or ask it",
    body: "Easy, Hard and Seriously? cards are answered by the player who drew them. An Ask others card gets pointed at somebody else, and once they have answered it opens to the table, so anyone who wants to answer it can.",
  },
  {
    title: "Pass as often as you like",
    body: "Put it back and draw another. No forfeit, no penalty.",
  },
  {
    title: "Play until the deck runs out",
    body: "However many cards you wrote, that’s the evening. No score, everybody wins!",
  },
];

function Pile({ front, blurb, example, sticker }: (typeof PILES)[number]) {
  return (
    <li className="pile">
      {sticker && <span className="sticker display">{sticker}</span>}
      <span className="disc">
        <CategoryMark front={front} />
      </span>
      <h3 className="display">{front}</h3>
      <p>{blurb}</p>
      <p className="example">{example}</p>
    </li>
  );
}

export default function EnoughAboutTheWeatherPage() {
  return (
    <main className="lid">
      <div className="lid-inner">
        <div className="brandbar">
          <span className="mark display">
            <WeatherMark />
            <b>Enough About the Weather!</b>
          </span>
          <span className="ticker display">
            A dinner-table question game &middot; Print it yourself
          </span>
        </div>

        {/*
          The line breaks are authored rather than left to wrapping: the
          headline is set as three stacked lines of one composition, and the
          exclamation point has to stay welded to the word it belongs to.
        */}
        <header className="hero">
          <span className="edition display">2026 edition</span>
          <h1 className="display">
            <span>Enough</span>
            <span className="l2">About the</span>
            <span className="l3">
              Weather<span className="bang">!</span>
            </span>
          </h1>
          <div className="stripe" />
          <div className="deck-line">
            <p className="tag display">
              Easy questions, hard questions, and{" "}
              <mark>a few we&rsquo;ll pay you to answer.</mark>
            </p>
            <div>
              <p className="meta">
                A question game for a family with teenagers in it. You write the cards, the
                youngest players run the evening, and one pile carries cash.
              </p>
              <ul className="players display">
                <li>3 to 10 players</li>
                <li>Ages 12 and up</li>
                <li>One evening</li>
                <li>Bring scissors</li>
              </ul>
              <div className="cta">
                <a className="btn btn-primary display" href="#starter-questions">
                  Get the deck
                </a>
                <a className="btn btn-secondary display" href="#rules">
                  Rules
                </a>
              </div>
            </div>
          </div>
        </header>

        <section className="panel">
          <h2 className="display">
            Four piles.
            <br />
            <em>One of them pays.</em>
          </h2>
          <ul className="piles">
            {PILES.map((pile) => (
              <Pile key={pile.front} {...pile} />
            ))}
          </ul>
        </section>

        <section className="panel" id="rules">
          <h2 className="display">How it&rsquo;s played</h2>
          <p className="sub">Eight &ldquo;rules&rdquo;.</p>
          <ol className="rules">
            {RULES.map((rule) => (
              <li key={rule.title}>
                <div>
                  <h3 className="display">{rule.title}</h3>
                  <p>{rule.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="money on-brick">
          <div className="note">
            <div className="note-line display">
              <span>Seriously? pile</span>
              <span>No. 003</span>
            </div>
            <p className="note-figure display">
              $1&ndash;$5<small>Printed on the card</small>
            </p>
            <div className="note-line display">
              <span>One banker</span>
              <span>Paid on sincerity</span>
            </div>
          </div>
          <div>
            <h2 className="display">The money</h2>
            <p className="sub">
              Only Seriously? cards carry money, and the amount is printed on the card. An adult
              banks the whole game.
            </p>
            <p className="sub">
              Pass on a card and you don&rsquo;t collect, which is all passing costs. When you
              settle up is your business. We do it at the end of the night.
            </p>
          </div>
        </section>

        <section className="panel">
          <h2 className="display">Make your own deck</h2>
          <p className="sub">
            Rule one, in practice. The deck is a two-column CSV (pile name, then question) run
            through <Link href="/">Flashy</Link>, which lays it out as a double-sided PDF you can
            print at home and cut apart. Pick the 20-per-sheet grid for card-game proportions.
          </p>
          <pre>
            <code>{`Easy,What is your favorite color?
Hard,What is your dream vacation?
Seriously?,What are you most proud of? $3
Ask others,What was dating like before smartphones?`}</code>
          </pre>
          <p className="sub">
            The pile names are recognised from the text itself, so there&rsquo;s no setting to
            change: write <span className="literal">Easy</span>,{" "}
            <span className="literal">Hard</span>, <span className="literal">Seriously?</span> and{" "}
            <span className="literal">Ask others</span> if you want to play it like we do.
          </p>

          {/*
            Served from public/, so the URL needs assetUrl() to survive the
            /Flashy base path. Next prefixes its own routes but not a bare href.
          */}
          <div className="starter" id="starter-questions">
            <h3 className="display">Starter questions</h3>
            <p className="sub">
              Thirty-one of ours, across all four piles. Use them as they are, or write your own.
            </p>
            <div className="cta">
              <a
                className="btn btn-primary display"
                href={assetUrl("/enough-about-the-weather-sample.csv")}
                download="enough-about-the-weather-sample.csv"
              >
                Download the deck (CSV)
              </a>
              <Link className="btn btn-secondary display" href="/">
                Open Flashy
              </Link>
            </div>
          </div>
        </section>

        <footer>
          <span>
            Made with <Link href="/">Flashy</Link> by{" "}
            <a href="https://karol.gajda.com">Karol Gajda</a>
          </span>
          <span>Your questions never leave your browser</span>
        </footer>
      </div>
    </main>
  );
}
