"use client";

import Image from 'next/image';
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
        <motion.div
            variants={itemVariants}
            className="mb-6 w-full flex justify-center"
          >
            <motion.img
              src="/images/logo.svg"
              alt="American Jews for Democracy Logo"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-[340px] sm:w-[400px] md:w-[480px] h-auto"
            />
          </motion.div>

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