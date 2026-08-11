import { FAQ } from "@/lib/faq";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

/*
 * Schema.org description of the app, for search engines and for the assistants
 * that increasingly answer "free flashcard maker" without showing a result
 * list at all. Two graphs, both of which earn their place:
 *
 * - WebApplication with a zero-price offer. This is what lets a result say the
 *   thing is free without a crawler having to infer it from prose.
 * - FAQPage, which is eligible for expanded results. Its questions must match
 *   the visible <Faq> section verbatim, which is why both read from FAQ.
 *
 * Rendered as a plain <script> rather than next/script because static export
 * has no runtime to defer to, and this must be in the HTML the crawler sees.
 */
export function StructuredData() {
  const graph = [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any browser",
      description:
        "Free flashcard maker that turns typed cards or a CSV into a double-sided PDF laid out for duplex printing. Runs entirely in the browser.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Double-sided PDF laid out for duplex printing",
        "Long-edge and short-edge printer flip",
        "CSV import",
        "A4 and US Letter, 2x2 to 4x5 grids",
        "Unicode support including Japanese, Chinese and Korean",
        "Runs offline in the browser; no card text is uploaded",
      ],
      isAccessibleForFree: true,
      license: "https://opensource.org/licenses/MIT",
      author: { "@type": "Person", name: "Karol Gajda", url: "https://karol.gajda.com" },
      image: absoluteUrl("/opengraph-image.png"),
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // The payload is a literal above, so there is no untrusted input to
      // escape; JSON.stringify is the whole sanitisation story here.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
