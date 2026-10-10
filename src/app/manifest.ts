import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maybe",
    short_name: "Maybe",
    description: "Finanzas personales",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    lang: "es",
    icons: [
      { src: "/api/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/api/icons/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
