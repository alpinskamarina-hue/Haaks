import type { MetadataRoute } from "next";

// Lets the worker add Haaks to the phone's home screen as an app (and get push notifications).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Haaks",
    short_name: "Haaks",
    description: "Jobs, quotes, invoices and documents for ZZP builders",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#ea580c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
