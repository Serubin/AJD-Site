import ComingSoonPage from '@/components/pages/ComingSoon';
import { getPageContent } from '@/lib/cms';

export default async function ComingSoon() {
  const sections = await getPageContent("ComingSoon");
  const tagline = sections.Tagline?.raw ?? "";

  return (
    <ComingSoonPage tagline={tagline} />
  );
}
