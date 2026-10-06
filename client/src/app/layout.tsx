import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "@/index.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff3d6" },
    { media: "(prefers-color-scheme: dark)", color: "#2e0f0c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Ăn gì? - Khám Phá & Gợi Ý Ẩm Thực Thông Minh",
    template: "%s | Ăn gì?",
  },
  description:
    "ĂN GÌ? bắt đầu từ một câu hỏi rất quen thuộc: “Hôm nay ăn gì?” Một câu hỏi nhỏ nhưng đôi khi lại khiến chúng ta mất rất nhiều thời gian để lựa chọn. ĂN GÌ? ra đời để biến những phút phân vân ấy thành một hành trình khám phá đầy thú vị.",
  keywords: [
    "Ăn gì",
    "hôm nay ăn gì",
    "gợi ý món ăn",
    "gacha ẩm thực",
    "dinh dưỡng món ăn",
    "thực đơn hàng ngày",
    "món ngon mỗi ngày",
    "tra cứu calo",
  ],
  authors: [{ name: "Ăn gì? Team" }],
  creator: "Ăn gì?",
  publisher: "Ăn gì?",
  metadataBase: new URL("https://angi.vn"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logos/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/logos/main-logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ăn gì?",
  },
  openGraph: {
    title: "Ăn gì? - Khám Phá & Gợi Ý Ẩm Thực Thông Minh",
    description:
      "Biến câu hỏi 'Hôm nay ăn gì?' thành hành trình khám phá ẩm thực thú vị với trải nghiệm gacha mở thẻ bài món ăn độc đáo!",
    url: "https://angi.vn",
    siteName: "Ăn gì?",
    images: [
      {
        url: "/logos/main-logo.png",
        width: 800,
        height: 600,
        alt: "Logo Ăn gì?",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ăn gì? - Khám Phá & Gợi Ý Ẩm Thực Thông Minh",
    description:
      "Trải nghiệm gacha mở thẻ bài gợi ý món ăn dinh dưỡng thông minh mỗi ngày.",
    images: ["/logos/main-logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Ăn gì?",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "VND",
  },
  description:
    "Ứng dụng gợi ý món ăn ngẫu nhiên theo khung giờ, tính toán lượng calo và dinh dưỡng cá nhân hóa.",
  inLanguage: "vi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${montserrat.variable} font-sans`}
    >
      <head>
        {/* Instant theme determination script before render to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('an_gi_theme_mode');
                  var isDark = false;
                  if (stored === 'dark') {
                    isDark = true;
                  } else if (stored === 'light') {
                    isDark = false;
                  } else {
                    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  }
                  var theme = isDark ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.setAttribute('data-time-theme', isDark ? 'night' : 'morning');
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Service worker registration for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased flex flex-col transition-colors duration-500">
        <AppProviders>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
