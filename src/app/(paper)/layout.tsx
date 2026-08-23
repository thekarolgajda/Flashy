/*
 * Everything that lives on Flashy's paper ground: the app itself, and the
 * credit line under it. The game page has its own visual world and its own
 * footer, so the shared footer belongs here rather than in the root layout.
 */
export default function PaperLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <footer className="mx-auto w-full max-w-5xl px-6 pb-10">
        <div className="rule-dashed" />
        <p className="mt-5 text-[0.8125rem] text-ink-soft">
          Made by{" "}
          <a
            href="https://karol.gajda.com"
            className="underline decoration-rule underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
          >
            Karol Gajda
          </a>
          .
        </p>
      </footer>
    </>
  );
}
