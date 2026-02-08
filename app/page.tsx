import { getPageContent } from '@/lib/cms';
import HomePage from '../components/pages/Home';

export default async function Home() {
  const sections = await getPageContent("Home");

  const tagline = sections.Tagline?.raw ?? "";

  return (
    <HomePage tagline={tagline} />
  );
}
