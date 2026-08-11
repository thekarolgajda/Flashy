/*
 * Canonical identity of the deployed site, in one place.
 *
 * Search engines need absolute URLs (canonical link, Open Graph, sitemap,
 * JSON-LD), and those cannot be derived from basePath alone: the prefix says
 * /Flashy but not which host serves it. So the production origin is stated
 * here, and everything that needs an absolute URL builds it from SITE_URL.
 */

/** Origin plus base path, no trailing slash. */
export const SITE_URL = "https://thekarolgajda.github.io/Flashy";

export const SITE_NAME = "Flashy";

/** Absolute URL for a path within the site, given its root-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
