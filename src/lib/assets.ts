/*
 * Fonts and the harfbuzz wasm are fetched from public/ at runtime, by URL.
 * Next applies its basePath to routes and to its own chunks, but a bare fetch()
 * is opaque to it, so under a project Pages site at /Flashy those requests would
 * miss the prefix and 404. They are built here instead.
 *
 * The value is inlined at build time (see next.config.ts) and is "" everywhere
 * the app is served from the domain root, which is the local dev case.
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Absolute URL for a file in public/, given its root-relative path. */
export function assetUrl(path: string): string {
  return `${BASE_PATH}${path}`;
}
