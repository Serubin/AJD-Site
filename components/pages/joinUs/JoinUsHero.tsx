"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: 1,
    title: "Stay Informed",
    description:
      "Receive our weekly newsletter with critical updates on legislation.",
  },
  {
    number: 2,
    title: "Volunteer",
    description:
      "Join phone banks, text campaigns, and local canvassing efforts.",
  },
  {
    number: 3,
    title: "Join Our Community",
    description:
      "Participate in our active WhatsApp community chat and get updates on our latest campaigns and engage with other members.",
  },
] as const;

export function JoinUsHero() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
        Join the <span className="text-primary italic">Movement</span>
      </h1>
      <p className="text-lg text-muted-foreground font-serif leading-relaxed mb-8">
        Democracy requires participation. Your voice matters. Sign up to
        volunteer, receive updates, and connect with our national community.
      </p>

      <div className="space-y-6">
        {STEPS.map(({ number, title, description }) => (
          <div key={number} className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="font-bold text-primary">{number}</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg font-display">
                {title}
              </h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
