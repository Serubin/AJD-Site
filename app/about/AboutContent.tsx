"use client";

import { motion } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CMSSection, TeamMember } from "@/lib/cms";

interface AboutContentProps {
  sections: Record<string, CMSSection>;
  teamMembers: TeamMember[];
}

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

const markdownComponents: Components = {
  ul: ({ children }) => (
    <motion.ul
      className="grid pl-1 border-l-2 border-primary/20 my-1 list-none"
      variants={listVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {children}
    </motion.ul>
  ),
  li: ({ children }) => (
    <motion.li
      variants={itemVariants}
      className="flex items-center gap-3 text-white"
    >
      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <span>{children}</span>
    </motion.li>
  ),
};

export default function AboutContent({ sections, teamMembers }: AboutContentProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 border-b border-primary/30 pb-6">
              Our Mission
            </h1>
            
            <div className="space-y-8 text-lg text-muted-foreground font-serif leading-relaxed">
                <div className="prose prose-invert prose-lg max-w-none">
                  <ReactMarkdown components={markdownComponents}>
                    {sections["About"]?.raw ?? ""}
                  </ReactMarkdown>
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
                    <div className="w-40 h-40 rounded-full bg-white/5 border border-white/10 overflow-hidden mb-4 relative hover-elevate">
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {person.photo ? (
                        <img
                          src={person.photo}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/40">
                          <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="text-white font-display font-semibold text-lg">{person.name}</h3>
                    <p className="text-primary text-sm font-sans uppercase tracking-wider">{person.title}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
