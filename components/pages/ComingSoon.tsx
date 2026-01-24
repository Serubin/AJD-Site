"use client";

import { motion } from 'framer-motion';
import CenterCircleGradient from '../CenterCircleGradient';

export type ComingSoonPageProps = {
  tagline: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

export default function ComingSoonPage({ tagline }: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-[#081939] flex flex-col items-center justify-center p-4 text-center">
      <CenterCircleGradient />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-md w-full"
      >
        <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 tracking-tight leading-tight"
          >
            American Jews <br/>
            <span className="text-primary italic font-serif text-3xl md:text-5xl lg:text-6xl">for</span> Democracy
          </motion.h1>

        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          Coming Soon
        </h2>
        
        <p className="text-lg text-muted-foreground font-serif italic mb-8">
          {tagline}
        </p>
      </motion.div>
    </div>
  );
}