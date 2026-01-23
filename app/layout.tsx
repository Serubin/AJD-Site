import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { getPageContent } from '@/lib/cms';
import { Navigation } from '@/components/Navigation';
import { ConditionalFooter } from '@/components/ConditionalFooter';

export const metadata: Metadata = {
  title: "American Jews for Democracy",
  description: "Uniting our voices to protect democratic institutions and uphold the values of justice, equality, and freedom.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const homeContent = await getPageContent("Home");
  const tagline = homeContent["Tagline"]?.raw ?? "";
  const links = homeContent["Navigation"]?.parsed as { href: string; label: string }[];

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
