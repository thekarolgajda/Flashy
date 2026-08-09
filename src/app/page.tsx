"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseCards, SAMPLE_INPUT, type ParseResult } from "@/lib/cards";
import { parseCardsFromCsv } from "@/lib/csv";
import { requiredPacks } from "@/lib/fonts";
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

export default function Home() {
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState(SAMPLE_INPUT);
  const [separator, setSeparator] = useState("|");

  const [csvText, setCsvText] = useState("");
  const [csvName, setCsvName] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [pageSize, setPageSize] = useState<PageSizeId>("a4");
  const [layout, setLayout] = useState<LayoutId>("2x4");
  const [flipEdge, setFlipEdge] = useState<FlipEdge>("long");
  const [cutGuides, setCutGuides] = useState(true);
  const [busy, setBusy] = useState(false);
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

  async function readFile(file: File) {
    setCsvError(null);
    if (!/\.(csv|tsv|txt)$/i.test(file.name)) {
      setCsvError("Please choose a .csv file.");
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not build the PDF.");
    } finally {
      setBusy(false);
    }
  }

  const sheets = sheetCount(cards.length, layout);
  const needsCjkFont = useMemo(
    () =>
      requiredPacks(cards.flatMap((card) => [card.front, card.back])).some(
        (pack) => pack !== "latin",
      ),
    [cards],
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Flashy</h1>
        <p className="mt-2 max-w-prose text-muted">
          Paste your terms or drop in a CSV, and get a double-sided PDF laid out
          for duplex printing. Nothing is uploaded — the PDF is built in your
          browser.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex gap-1 rounded-lg border border-border p-1">
            {(["text", "csv"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                aria-pressed={mode === value}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                  mode === value
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {value === "text" ? "Type or paste" : "Upload CSV"}
              </button>
            ))}
          </div>

          {mode === "text" ? (
            <>
              <label htmlFor="cards" className="text-sm font-medium">
                One card per line
              </label>
              <textarea
                id="cards"
                value={text}
                onChange={(event) => setText(event.target.value)}
                spellCheck={false}
                rows={14}
                className="mt-2 w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-sm outline-none focus:border-accent"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
                <label htmlFor="separator">Separator</label>
                <input
                  id="separator"
                  value={separator}
                  onChange={(event) => setSeparator(event.target.value)}
                  maxLength={3}
                  className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center font-mono text-foreground outline-none focus:border-accent"
                />
                <span>
                  Front{separator || "|"}back. Use <code>\n</code> for a line break.
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
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition ${
                  dragging ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                <p className="text-sm font-medium">Drop a .csv file here</p>
                <p className="mt-1 text-sm text-muted">
                  First column is the front, second is the back. A header row is
                  detected and skipped.
                </p>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="mt-4 rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-accent"
                >
                  Choose file
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
                <p className="mt-3 text-sm text-muted">
                  Loaded <span className="text-foreground">{csvName}</span> —{" "}
                  {cards.length} card{cards.length === 1 ? "" : "s"}.
                </p>
              )}
              {csvError && <p className="mt-3 text-sm text-red-500">{csvError}</p>}
            </>
          )}

          {skippedLines.length > 0 && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-500">
              Skipped {skippedLines.length} row
              {skippedLines.length === 1 ? "" : "s"} without both sides (line
              {skippedLines.length === 1 ? " " : "s "}
              {skippedLines.slice(0, 8).join(", ")}
              {skippedLines.length > 8 ? "…" : ""}).
            </p>
          )}

          {unsupported.length > 0 && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-500">
              No bundled font covers these characters, so they will be left out
              of the PDF: <span className="font-mono">{unsupported.join(" ")}</span>
            </p>
          )}
        </section>

        <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Deck name
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="flashcards"
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="pageSize" className="text-sm font-medium">
              Paper
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(event) => setPageSize(event.target.value as PageSizeId)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {Object.entries(PAGE_SIZES).map(([id, size]) => (
                <option key={id} value={id}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="layout" className="text-sm font-medium">
              Cards per page
            </label>
            <select
              id="layout"
              value={layout}
              onChange={(event) => setLayout(event.target.value as LayoutId)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {Object.entries(LAYOUTS).map(([id, value]) => (
                <option key={id} value={id}>
                  {value.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="flipEdge" className="text-sm font-medium">
              Printer flips on
            </label>
            <select
              id="flipEdge"
              value={flipEdge}
              onChange={(event) => setFlipEdge(event.target.value as FlipEdge)}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="long">Long edge (most common)</option>
              <option value="short">Short edge</option>
            </select>
            <p className="mt-2 text-xs text-muted">
              Must match your print dialog, or backs land on the wrong cards.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={cutGuides}
              onChange={(event) => setCutGuides(event.target.checked)}
              className="size-4 accent-accent"
            />
            Draw cutting guides
          </label>

          <div className="mt-auto border-t border-border pt-4">
            <p className="text-sm text-muted">
              {cards.length} card{cards.length === 1 ? "" : "s"} · {sheets} sheet
              {sheets === 1 ? "" : "s"} · {sheets * 2} PDF pages
            </p>
            {needsCjkFont && (
              <p className="mt-1 text-xs text-muted">
                Contains CJK text — the first export downloads a font pack
                (several MB), then it is cached.
              </p>
            )}
            <button
              type="button"
              onClick={download}
              disabled={busy || cards.length === 0}
              className="mt-3 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Building…" : "Download PDF"}
            </button>
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
        </section>
      </div>

      {cards.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted">Preview</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.slice(0, 12).map((card, index) => (
              <li
                key={index}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <p className="whitespace-pre-wrap font-medium">{card.front}</p>
                <p className="mt-2 whitespace-pre-wrap border-t border-border pt-2 text-sm text-muted">
                  {card.back}
                </p>
              </li>
            ))}
          </ul>
          {cards.length > 12 && (
            <p className="mt-3 text-sm text-muted">
              …and {cards.length - 12} more.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
