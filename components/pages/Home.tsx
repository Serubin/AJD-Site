"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CenterCircleGradient from '@/components/CenterCircleGradient';

export type HomePageProps = {
  tagline: string;
}

export default function HomePage({ tagline }: HomePageProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <>
      <main className="flex-grow px-4 sm:px-6">
        <CenterCircleGradient />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-center"
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
              className="max-w-m w-[340px] sm:w-[400px] md:w-[480px] h-auto"
            />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl font-serif italic leading-relaxed"
          >
            {tagline}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center"
          >
            <Link href="/about">
            <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[160px] border-primary/30 hover:border-primary hover:bg-primary/10 text-primary font-semibold tracking-wide">
                Our Mission
              </Button>
            </Link>
            <Link href="/get-involved" className="hidden sm:block">
              <Button size="lg" className="w-full sm:w-auto min-w-[160px] bg-primary hover:bg-primary/90 text-background font-bold tracking-wide shadow-lg shadow-primary/20">
                Get Involved
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </>
  );
}
