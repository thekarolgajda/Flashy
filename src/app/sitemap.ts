import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * The sitemap is served from two URLs, both listing the same single page.
 *
 * /sitemap-pages.xml is the one robots.txt advertises and the one to submit;
 * see that route for why the conventional name is avoided. This file keeps
 * /sitemap.xml alive anyway, because it has already been submitted to Search
 * Console: removing it would serve a 404 to a URL Google is holding, which is
 * the precise thing that poisons a sitemap URL. A duplicate costs nothing —
 * both describe one page, so neither can disagree with the other.
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
