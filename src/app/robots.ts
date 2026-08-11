import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * Note this lands at /Flashy/robots.txt, and crawlers only ever read
 * robots.txt from the origin root — so on github.io this file is advisory, and
 * the sitemap has to be submitted to Search Console directly. It becomes the
 * real thing the moment the site moves to its own domain, which is one of the
 * better reasons to move it.
 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
