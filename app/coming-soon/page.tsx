'use client';

import { motion } from "framer-motion";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-[#081939] flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full"
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
          We are currently working toward building a stronger democracy. Please check back shortly.
        </p>
      </motion.div>
    </div>
  );
}
