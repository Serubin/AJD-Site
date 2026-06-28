import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CampaignsDAO } from "@/lib/nocodb/CampaignsDAO";
import { markdownToHtml } from "@/lib/templates";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadCampaign(slug: string) {
  return new CampaignsDAO().findPublishedBySlug(slug);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) return { title: "Post not found" };
  return {
    title: `${campaign.Title} | American Jews for Democracy`,
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const campaign = await loadCampaign(slug);
  if (!campaign) notFound();

  const html = markdownToHtml(campaign.BodyMarkdown ?? "");

  return (
    <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8">
          {campaign.Title}
        </h1>
        <div
          className="prose prose-invert max-w-none font-serif prose-headings:font-display prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </main>
  );
}
