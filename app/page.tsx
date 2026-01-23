import { getPageContent } from '@/lib/cms';
import HomeComponent from './HomeComponent';

export default async function Home() {
  const sections = await getPageContent("Home");

  const tagline = sections["Tagline"]?.raw ?? "";

  return (
    <HomeComponent tagline={tagline} />
  );
}
