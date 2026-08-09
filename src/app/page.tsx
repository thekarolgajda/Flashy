"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseCards, SAMPLE_INPUT, type Card, type ParseResult } from "@/lib/cards";
import { parseCardsFromCsv } from "@/lib/csv";
import { requiredPacks } from "@/lib/fonts";
import { Logo } from "@/components/logo";
import { CategoryMark } from "@/components/category-mark";
import {
  findUnsupportedCharacters,
  generateFlashcardPdf,
  sheetCount,
  LAYOUTS,
  PAGE_SIZES,
  type FlipEdge,
  type LayoutId,
  type PageSizeId,
} from "@/lib/pdf";

type InputMode = "text" | "csv";

const EMPTY: ParseResult = { cards: [], skippedLines: [] };

/** Segmented control. A lime pill marks the active option. */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-1 rounded-xl bg-rule/40 p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-[0.8125rem] transition-colors duration-150 ${
              active
                ? "bg-lime font-semibold text-ink shadow-sm"
                : "font-medium text-ink-soft hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A miniature of the sheet that comes out of the printer, drawn from the same
 * constants as the generator. This is the real explanation of the layout
 * options; the count underneath is secondary.
 */
function SheetDiagram({
  pageSize,
  layout,
  filled,
}: {
  pageSize: PageSizeId;
  layout: LayoutId;
  filled: number;
}) {
  const { width, height } = PAGE_SIZES[pageSize];
  const { cols, rows } = LAYOUTS[layout];

  return (
    <div
      className="grid w-full gap-[3px] rounded-[3px] bg-card p-[5px] ring-1 ring-rule"
      style={{
        aspectRatio: `${width} / ${height}`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {Array.from({ length: cols * rows }, (_, index) => (
        <div
          key={index}
          className={`rounded-[2px] transition-colors duration-200 ${
            index < filled ? "bg-lime/60" : "bg-rule/50"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * What to do once the PDF lands. Duplex printing is the step people get wrong,
 * so it is spelled out on the page rather than left to the PDF.
 */
function PrintSteps({ flipEdge }: { flipEdge: FlipEdge }) {
  const steps = [
    {
      title: "Print both sides",
      body: "Two PDF pages make one sheet: fronts, then backs.",
    },
    {
      title: `Flip on the ${flipEdge} edge`,
      body: "Set this in the print dialog to match the flip setting.",
    },
    {
      title: "Cut along the guides",
      body: "The dashed lines run to the paper's edge for a clean trim.",
    },
  ];

  return (
    <ol className="mt-14 grid gap-px overflow-hidden rounded-xl bg-rule sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="bg-card px-4 py-4">
          <span className="font-display text-[1.5rem] leading-none font-bold text-lime-deep">
            {index + 1}
          </span>
          <p className="mt-2 text-[0.8125rem] font-semibold">{step.title}</p>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Preview card that turns over on hover or focus. The back is the payoff. */
function PreviewCard({
  card,
  ratio,
  index,
}: {
  card: Card;
  ratio: number;
  index: number;
}) {
  // Deterministic scatter, so cards do not jump around between renders.
  const tilt = ((index % 5) - 2) * 1.6;

  return (
    <li
      tabIndex={0}
      className="flip card-scatter rounded-xl"
      style={{ aspectRatio: ratio, "--tilt": `${tilt}deg` } as React.CSSProperties}
    >
      <div className="flip-inner relative h-full w-full">
        <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-2.5 rounded-xl bg-card px-4 text-center ring-1 ring-rule">
          <CategoryMark front={card.front} className="size-7 text-ink-soft/70" />
          <span className="font-display text-[1.0625rem] leading-tight font-bold text-balance whitespace-pre-wrap">
            {card.front}
          </span>
        </div>
        <div className="flip-back flip-face absolute inset-0 flex items-center justify-center rounded-xl bg-card px-4 text-center ring-1 ring-tangerine/70">
          <span className="font-display text-[0.9375rem] leading-snug text-balance whitespace-pre-wrap text-ink-soft">
            {card.back}
          </span>
        </div>
      </div>
    </li>
  );
}

export default function Home() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState(SAMPLE_INPUT);
  const [separator, setSeparator] = useState("|");

  const [csvText, setCsvText] = useState("");
  const [csvName, setCsvName] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [title, setTitle] = useState("");
  const [pageSize, setPageSize] = useState<PageSizeId>("letter");
  const [layout, setLayout] = useState<LayoutId>("3x4");
  const [flipEdge, setFlipEdge] = useState<FlipEdge>("long");
  const [cutGuides, setCutGuides] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(() => {
    if (mode === "csv") return csvText ? parseCardsFromCsv(csvText) : EMPTY;
    return parseCards(text, separator || "|");
  }, [mode, text, separator, csvText]);

  const { cards, skippedLines } = result;

  // Coverage depends on font files fetched on demand, so this runs off the
  // render path and is debounced against typing.
  const [unsupported, setUnsupported] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      findUnsupportedCharacters(cards)
        .then((chars) => {
          if (!cancelled) setUnsupported(chars);
        })
        .catch(() => {
          if (!cancelled) setUnsupported([]);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cards]);

  useEffect(() => () => {
    if (doneTimer.current) clearTimeout(doneTimer.current);
  }, []);

  const sheets = sheetCount(cards.length, layout);
  const perSheet = LAYOUTS[layout].cols * LAYOUTS[layout].rows;
  const cardRatio =
    PAGE_SIZES[pageSize].width /
    LAYOUTS[layout].cols /
    (PAGE_SIZES[pageSize].height / LAYOUTS[layout].rows);

  const needsCjkFont = useMemo(
    () =>
      requiredPacks(cards.flatMap((card) => [card.front, card.back])).some(
        (pack) => pack !== "latin",
      ),
    [cards],
  );

  async function readFile(file: File) {
    setCsvError(null);
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setCsvError("That needs to be a .csv file.");
      return;
    }
    try {
      const contents = await file.text();
      setCsvText(contents);
      setCsvName(file.name);
      setMode("csv");
    } catch {
      setCsvError("That file could not be read.");
    }
  }

  async function download() {
    setError(null);
    setBusy(true);
    try {
      const bytes = await generateFlashcardPdf(cards, {
        pageSize,
        layout,
        flipEdge,
        cutGuides,
        title,
      });
      // Copy into a fresh buffer so the Blob gets a plain ArrayBuffer.
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(title.trim() || "flashcards").replace(/[^\w-]+/g, "-")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      // Brief confirmation, since a browser download is easy to miss.
      setDone(true);
      if (doneTimer.current) clearTimeout(doneTimer.current);
      doneTimer.current = setTimeout(() => setDone(false), 2600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not build the PDF.");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-rule bg-card px-3 py-2 text-[0.9375rem] transition-colors duration-150 hover:border-ink-soft/40 focus:border-lime-deep focus:outline-none";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-16 pb-24">
      <header className="mb-14">
        <h1>
          <Logo />
        </h1>
        <p className="mt-5 max-w-[58ch] text-[1.125rem] leading-[1.55] text-ink-soft">
          Write your cards, or upload a CSV. Out comes a double-sided PDF,
          laid out so every back lands on the right front when you print it.
        </p>
        <p className="mt-2.5 text-[0.8125rem] text-ink-soft">
          Built in your browser. Nothing you type is uploaded anywhere.
        </p>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
        <section className="flex flex-col">
          <div className="mb-5 max-w-[19rem]">
            <Segmented
              label="How to add cards"
              value={mode}
              onChange={setMode}
              options={[
                { value: "text", label: "Type it out" },
                { value: "csv", label: "Upload a CSV" },
              ]}
            />
          </div>

          {mode === "text" ? (
            <>
              <label htmlFor="cards" className="text-[0.8125rem] font-medium">
                One card per line
              </label>
              <textarea
                id="cards"
                value={text}
                onChange={(event) => setText(event.target.value)}
                spellCheck={false}
                rows={13}
                placeholder={"front | back\nbonjour | hello"}
                className={`${fieldClass} mt-2 resize-y font-mono text-[0.875rem] leading-relaxed lg:min-h-[30rem]`}
              />
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.8125rem] text-ink-soft">
                <label htmlFor="separator" className="font-medium">
                  Split on
                </label>
                <input
                  id="separator"
                  value={separator}
                  onChange={(event) => setSeparator(event.target.value)}
                  maxLength={3}
                  className="h-9 w-14 rounded-md border border-rule bg-card px-2 text-center font-mono text-ink focus:border-lime-deep focus:outline-none"
                />
                <span className="max-w-[46ch]">
                  Everything after the first{" "}
                  <code className="font-mono text-ink">{separator || "|"}</code> is the
                  back. Type <code className="font-mono text-ink">\n</code> for a line
                  break.
                </span>
              </div>
            </>
          ) : (
            <>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const file = event.dataTransfer.files[0];
                  if (file) void readFile(file);
                }}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-150 ${
                  dragging ? "border-lime-deep bg-lime/10" : "border-rule bg-card"
                }`}
              >
                <p className="font-semibold">Drop a CSV here</p>
                <p className="mt-1.5 max-w-[44ch] text-[0.875rem] leading-relaxed text-ink-soft">
                  First column the front, second the back. Commas inside a
                  column are fine, and a header row is skipped for you.
                </p>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-5 rounded-lg border border-rule bg-card px-3.5 py-2 text-[0.8125rem] font-medium transition-colors duration-150 hover:border-ink-soft/60 active:bg-rule/30"
                >
                  Choose a file
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,.tsv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void readFile(file);
                    event.target.value = "";
                  }}
                />
              </div>
              {csvName && (
                <p className="mt-3 text-[0.8125rem] text-ink-soft">
                  <span className="font-medium text-ink">{csvName}</span>, {cards.length}{" "}
                  card{cards.length === 1 ? "" : "s"} found.
                </p>
              )}
              {csvError && <p className="mt-3 text-[0.8125rem] text-berry">{csvError}</p>}
            </>
          )}

          {skippedLines.length > 0 && (
            <p className="mt-3 max-w-[60ch] text-[0.8125rem] leading-relaxed text-tangerine-deep">
              Skipped {skippedLines.length} row{skippedLines.length === 1 ? "" : "s"}{" "}
              missing a front or a back (line
              {skippedLines.length === 1 ? " " : "s "}
              {skippedLines.slice(0, 8).join(", ")}
              {skippedLines.length > 8 ? "…" : ""}).
            </p>
          )}

          {unsupported.length > 0 && (
            <p className="mt-3 max-w-[60ch] text-[0.8125rem] leading-relaxed text-tangerine-deep">
              No bundled font covers{" "}
              <span className="font-mono text-ink">{unsupported.join(" ")}</span>, so those
              characters will be left off the cards.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-7">
          <div>
            <span className="text-[0.8125rem] font-medium">Cards per sheet</span>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => {
                const active = id === layout;
                const count = LAYOUTS[id].cols * LAYOUTS[id].rows;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setLayout(id)}
                    className={`rounded-xl p-2 text-center transition-shadow duration-150 ${
                      active
                        ? "bg-lime/20 ring-2 ring-lime-deep"
                        : "ring-1 ring-rule hover:ring-ink-soft/40"
                    }`}
                  >
                    <SheetDiagram
                      pageSize={pageSize}
                      layout={id}
                      filled={Math.min(cards.length, count)}
                    />
                    <span
                      className={`mt-2 block text-[0.8125rem] ${
                        active ? "font-semibold" : "text-ink-soft"
                      }`}
                    >
                      {count} per sheet
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="text-[0.8125rem] font-medium">Paper</span>
            <div className="mt-2">
              <Segmented
                label="Paper size"
                value={pageSize}
                onChange={setPageSize}
                options={(Object.keys(PAGE_SIZES) as PageSizeId[]).map((id) => ({
                  value: id,
                  label: PAGE_SIZES[id].label,
                }))}
              />
            </div>
          </div>

          <div>
            <span className="text-[0.8125rem] font-medium">
              Your printer flips on the
            </span>
            <div className="mt-2">
              <Segmented
                label="Flip edge"
                value={flipEdge}
                onChange={setFlipEdge}
                options={[
                  { value: "long", label: "Long edge" },
                  { value: "short", label: "Short edge" },
                ]}
              />
            </div>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft">
              Match this to your print dialog. Get it wrong and every back lands
              on the wrong card. Long edge is the usual default.
            </p>
          </div>

          <div>
            <span className="text-[0.8125rem] font-medium">Cutting guides</span>
            <div className="mt-2">
              <Segmented
                label="Cutting guides"
                value={cutGuides ? "on" : "off"}
                onChange={(value) => setCutGuides(value === "on")}
                options={[
                  { value: "on", label: "Show" },
                  { value: "off", label: "Hide" },
                ]}
              />
            </div>
          </div>

          <div>
            <label htmlFor="title" className="text-[0.8125rem] font-medium">
              Deck name
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="flashcards"
              className={`${fieldClass} mt-2`}
            />
          </div>

          <div className="mt-1">
            <div className="rule-dashed" />
            <p className="mt-4 text-[0.8125rem] text-ink-soft">
              {cards.length === 0 ? (
                "No cards yet."
              ) : (
                <>
                  <span className="font-semibold text-ink">{cards.length}</span> card
                  {cards.length === 1 ? "" : "s"} across{" "}
                  <span className="font-semibold text-ink">{sheets}</span> sheet
                  {sheets === 1 ? "" : "s"}
                  {cards.length % perSheet !== 0 && `, ${perSheet - (cards.length % perSheet)} slot${perSheet - (cards.length % perSheet) === 1 ? "" : "s"} spare`}
                </>
              )}
            </p>
            {needsCjkFont && (
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-soft">
                Your deck uses CJK characters, so the first download fetches a
                font pack. It is cached after that.
              </p>
            )}
            <button
              type="button"
              onClick={download}
              disabled={busy || cards.length === 0}
              className="mt-4 w-full rounded-xl bg-lime px-4 py-3.5 text-[1rem] font-semibold text-ink transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-12px_oklch(0.25_0.018_96/0.45)] active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-rule/60 disabled:text-ink-soft disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {busy
                ? "Setting the type…"
                : done
                  ? "Saved. Go print it"
                  : "Download PDF"}
            </button>
            {error && <p className="mt-2 text-[0.8125rem] text-berry">{error}</p>}
          </div>
        </section>
      </div>

      <PrintSteps flipEdge={flipEdge} />

      <section className="mt-20">
        <div className="rule-dashed" />
        <h2 className="font-display mt-7 text-[2rem] leading-none font-bold tracking-[-0.02em]">
          {cards.length > 0 ? "Your cards" : "Nothing to preview yet"}
        </h2>
        <p className="mt-2.5 text-[0.9375rem] text-ink-soft">
          {cards.length > 0
            ? "Hover a card to turn it over. These are the proportions you will print."
            : "Add a couple of lines above and they will show up here."}
        </p>

        {cards.length > 0 && (
          <>
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {cards.slice(0, 8).map((card, index) => (
                <PreviewCard key={index} card={card} ratio={cardRatio} index={index} />
              ))}
            </ul>
            {cards.length > 8 && (
              <p className="mt-4 text-[0.8125rem] text-ink-soft">
                Plus {cards.length - 8} more in the PDF.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
