import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /**
   * There are package-lock.json files in parent directories, so Next infers the workspace root
   * as the user's home directory and warns. Pin it to this project.
   */
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  images: {
    /**
     * All imagery is now served locally from public/images (exported from Stitch and converted
     * to WebP), so no remote hosts are permitted. Re-add a pattern here only if a CDN is
     * introduced later.
     */
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
