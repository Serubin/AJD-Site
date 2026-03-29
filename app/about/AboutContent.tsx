"use client";

import { motion } from "framer-motion";
import { CMSSection, TeamMember } from "@/lib/cms";
import { Markdown } from '@/components/MarkdownWrapper';

interface AboutContentProps {
  sections: Record<string, CMSSection>;
  teamMembers: TeamMember[];
}



export default function AboutContent({ sections, teamMembers }: AboutContentProps) {
  return (
    <>
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            
            <div className="space-y-8 text-lg text-muted-foreground font-serif leading-relaxed">
                <div className="prose prose-invert prose-lg max-w-none">
                  <Markdown>
                    {sections["About"]?.raw ?? ""}
                  </Markdown>
                </div>
            </div>

            {teamMembers.length > 0 && (
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((person, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center text-center group"
                  >
                    <h3 className="text-white font-display font-semibold text-lg">{person.name}</h3>
                    {person.pronouns && (
                      <p className="text-muted-foreground text-sm font-sans">{person.pronouns}</p>
                    )}
                    <p className="text-primary text-sm font-sans uppercase tracking-wider">{person.title}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}
