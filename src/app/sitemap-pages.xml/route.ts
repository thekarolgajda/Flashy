import { SITE_URL } from "@/lib/site";

/*
 * The sitemap, deliberately NOT at /sitemap.xml.
 *
 * Google caches sitemap fetch failures against the URL. If it ever fetches a
 * 404 for a given sitemap URL — which happens when the URL is submitted before
 * the file is live, or while a CDN edge is still serving the pre-deploy 404 —
 * it backs off and can sit on that cached failure for weeks. Resubmitting
 * re-queues against the same poisoned URL and changes nothing. A new filename
 * is a fresh URL with no failure history, which is the only reliable escape.
 *
 * This bit landable.xyz for over a month at /sitemap.xml and cleared instantly
 * on a rename, so Flashy starts at a name that was never submitted broken.
 *
 * Written as a route handler rather than app/sitemap.ts because that
 * convention can only ever emit /sitemap.xml. force-static because
 * `output: export` has no request-time rendering; without it nothing is
 * emitted into out/ at all.
 */
export const dynamic = "force-static";

export function GET() {
  // lastmod is the build date: honest enough for pages that change when the
  // app is deployed.
  const lastmod = new Date().toISOString().slice(0, 10);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/enough-about-the-weather</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
