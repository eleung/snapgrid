import { DESCRIPTION, HOME_TITLE, OG_IMAGES, SITE, TWITTER_IMAGES } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { Head } from "nextra/components";
import type { ReactNode } from "react";
import "nextra-theme-docs/style.css";
import "../styles/globals.css";

// Minimal root: <html>/<body> shell, site-wide <head> (theme color, fonts,
// favicons), and default metadata. The (site) route group layers Nextra's
// <Layout> (navbar/sidebar + next-themes) over every real page; the 404 sits
// outside it and renders bare with its own provider.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: HOME_TITLE, template: "%s — snapgrid" },
  description: DESCRIPTION,
  applicationName: "snapgrid",
  appleWebApp: { title: "snapgrid" },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "snapgrid",
    url: SITE,
    images: OG_IMAGES,
  },
  twitter: { card: "summary_large_image", images: TWITTER_IMAGES },
};

// theme-color is emitted by Nextra's <Head> (from backgroundColor, both light +
// dark), so it's intentionally not set here to avoid duplicate/conflicting tags.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head
        // Warm orange primary (matches the old theme.config hue/saturation) and
        // warm paper / warm ink backgrounds. v4 takes hex and converts to the
        // --nextra-bg triplet internally.
        color={{ hue: { light: 17, dark: 24 }, saturation: { light: 85, dark: 72 } }}
        backgroundColor={{ light: "#faf8f4", dark: "#1c1a17" }}
      >
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;450;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>{children}</body>
    </html>
  );
}
