import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ăn gì? - Gợi Ý & Khám Phá Ẩm Thực Thông Minh",
    short_name: "Ăn gì?",
    description:
      "ĂN GÌ? biến những phút giây phân vân hôm nay ăn gì thành hành trình khám phá ẩm thực đầy thú vị với các gợi ý dinh dưỡng thông minh.",
    start_url: "/",
    display: "standalone",
    background_color: "#2e0f0c",
    theme_color: "#2e7d32",
    icons: [
      {
        src: "/logos/favicon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/main-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logos/main-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["food", "lifestyle", "health", "entertainment"],
    lang: "vi",
  };
}
