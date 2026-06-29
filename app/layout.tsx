import type { Metadata, ResolvingMetadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getPageContent } from '@/lib/cms';
import { config } from '@/lib/config';
import { Navigation } from '@/components/Navigation';
import { ConditionalFooter } from '@/components/ConditionalFooter';

export async function generateMetadata(): Promise<Metadata> {
  const homeContent = await getPageContent("Home");
  const tagline = homeContent.Tagline?.raw ?? "";
  const title = "American Jews for Democracy";
  // Image routes live under /og/* (app/og/**/route.tsx); they're wired in
  // explicitly here. metadataBase makes these relative URLs absolute for crawlers.
  const card = { width: 1200, height: 630, alt: title };
  return {
    metadataBase: new URL(config.app.baseUrl),
    title,
    description: tagline,
    icons: {
      icon: [{ url: "/og/icon", type: "image/png", sizes: "48x48" }],
      apple: [{ url: "/og/apple-icon", type: "image/png", sizes: "180x180" }],
    },
    openGraph: {
      title,
      description: tagline,
      type: "website",
      url: "/",
      siteName: title,
      images: [{ url: "/og/opengraph-image", ...card }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: tagline,
      images: [{ url: "/og/twitter-image", ...card }],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const homeContent = await getPageContent("Home");
  const tagline = homeContent.Tagline?.raw ?? "";
  const links = (homeContent.Navigation?.parsed as { href: string; label: string }[]) ?? [];

  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-background flex flex-col">
            <Navigation links={links} />
            {children}
            <ConditionalFooter tagline={tagline} />
          </div>
        </Providers>
      </body>
    </html>
  );
}
