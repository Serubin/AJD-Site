"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navigation({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between md:justify-center py-6 px-4 sm:px-6 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between w-full md:w-auto md:gap-12">
        <Link href="/">
          <span className="font-display text-2xl font-bold text-foreground cursor-pointer tracking-wider hover:text-primary transition-colors">
            AJD
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
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

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="md:hidden -mr-1 p-1 text-foreground hover:text-primary transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 border-white/10">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="mt-10 flex flex-col">
              {links.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "border-l-2 py-3 pl-4 font-sans text-lg font-medium tracking-wide transition-colors",
                      pathname === link.href
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
