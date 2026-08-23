import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * The sitemap is served from two URLs, both listing the same single page.
 *
 * /sitemap-pages.xml is the one robots.txt advertises and the one to submit;
 * see that route for why the conventional name is not the one handed to
 * Google. This file keeps /sitemap.xml answering anyway, because crawlers
 * beyond Google probe that name by convention and an unreachable well-known
 * path is worth avoiding. A duplicate costs nothing — both describe one page,
 * so neither can disagree with the other.
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
    {
      url: `${SITE_URL}/enough-about-the-weather`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
  ];
}
