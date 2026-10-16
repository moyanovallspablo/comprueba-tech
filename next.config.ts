import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Fotografías de producto: locales en /public/monitors o en CDNs de confianza. Todo lo demás responde 400.
    localPatterns: [{ pathname: "/monitors/**", search: "" }],
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com", pathname: "/images/I/**", search: "" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
