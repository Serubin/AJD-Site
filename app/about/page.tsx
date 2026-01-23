import { getPageContent, TeamMember } from "@/lib/cms";
import AboutContent from "./AboutContent";
import { notFound } from "next/navigation";

export default async function About() {
  const sections = await getPageContent("About");

  if (Object.keys(sections).length === 0) {
    notFound();
  }

  const teamMembers = (sections["Team"]?.parsed as TeamMember[]) ?? [];

  return <AboutContent sections={sections} teamMembers={teamMembers} />;
}
