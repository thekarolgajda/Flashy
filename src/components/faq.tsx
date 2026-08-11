import { FAQ } from "@/lib/faq";

/*
 * The questions people arrive with, answered on the page.
 *
 * <details> rather than a JS accordion so every answer is in the static HTML
 * and expandable without hydration: that is what makes the copy indexable and
 * what backs the FAQPage markup in <StructuredData>.
 */
export function Faq() {
  return (
    <section className="mt-20" aria-labelledby="faq-heading">
      <div className="rule-dashed" />
      <h2
        id="faq-heading"
        className="font-display mt-7 text-[2rem] leading-none font-bold tracking-[-0.02em]"
      >
        Questions
      </h2>

      <dl className="mt-6 max-w-[68ch]">
        {FAQ.map(({ question, answer }) => (
          <div key={question} className="border-b border-rule last:border-b-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[1.0625rem] font-medium transition-colors hover:text-lime-deep [&::-webkit-details-marker]:hidden">
                <dt>{question}</dt>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-ink-soft transition-transform duration-200 ease-out-quart group-open:rotate-45"
                >
                  {/* A plus that becomes a cross on open, so the control reads
                      the same closed or open without swapping glyphs. */}
                  <svg viewBox="0 0 16 16" className="size-4">
                    <path
                      d="M8 2v12M2 8h12"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </summary>
              <dd className="max-w-[58ch] pb-5 text-[0.9375rem] leading-[1.6] text-ink-soft">
                {answer}
              </dd>
            </details>
          </div>
        ))}
      </dl>
    </section>
  );
}
