"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/about", label: "About" },
    { href: "/candidates", label: "Candidates" },
    { href: "/get-involved", label: "Get Involved" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center py-6 px-4 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-8 md:gap-12">
        <Link href="/">
          <span className="font-display text-2xl font-bold text-foreground cursor-pointer tracking-wider hover:text-primary transition-colors">
            AJD
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="relative group cursor-pointer">
              <span className={cn(
                "font-sans text-sm font-medium tracking-wide transition-colors",
                pathname === link.href ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {link.label}
              </span>
              {pathname === link.href && (
                <motion.div
                  layoutId="underline"
                  className="absolute -bottom-2 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
