import type { NextConfig } from "next";

/*
 * A GitHub project Pages site is served from /<repo>, not the domain root, so
 * the deploy workflow sets PAGES_BASE_PATH=/Flashy. Local dev leaves it empty
 * and the app stays at /.
 *
 * Next rewrites what it owns (routes, chunks, next/link) with this prefix, but
 * not files fetched from public/ by URL. Those go through assetUrl() in
 * src/lib/assets.ts, which reads the same value back out of the bundle.
 */
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
