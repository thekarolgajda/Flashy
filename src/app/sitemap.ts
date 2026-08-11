import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * One page, so the sitemap is nearly a formality — but it is the thing you
 * hand Search Console to get crawled deliberately rather than whenever the
 * crawler happens by.
 *
 * force-static because `output: export` has no request-time rendering; without
 * it the route is not emitted into out/ at all.
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
