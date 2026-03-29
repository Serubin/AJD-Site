"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, HandHelping } from "lucide-react";
import type { CandidateRecord } from "@/lib/candidates";

function candidateSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface CandidateCardsProps {
  candidates: CandidateRecord[];
}

export function CandidateCards({ candidates }: CandidateCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {candidates.map((candidate, idx) => {
        const slug = candidateSlug(candidate.Name);
        return (
          <motion.div
            key={candidate.Id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="h-full bg-card/50 border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group">
              <CardContent className="flex flex-col items-center text-center pt-8 pb-6 px-6">
                <Avatar className="h-24 w-24 mb-5">
                  <AvatarImage src={candidate.Photo} alt={candidate.Name} />
                  <AvatarFallback className="text-xl font-display">
                    {initials(candidate.Name)}
                  </AvatarFallback>
                </Avatar>

                <h3 className="text-2xl font-display font-bold text-white group-hover:text-primary transition-colors mb-2">
                  {candidate.Name}
                </h3>

                <Badge
                  variant="outline"
                  className="border-primary/40 text-primary bg-primary/10 mb-4"
                >
                  {candidate.District}, {candidate.State}
                </Badge>

                <p className="text-muted-foreground font-serif text-sm leading-relaxed mb-6 line-clamp-2">
                  {candidate.Description}
                </p>

                <div className="flex gap-3 w-full mt-auto">
                  <Link href={`/donate/${slug}`} className="flex-1">
                    <Button
                      variant="default"
                      className="w-full bg-primary hover:bg-primary/90 text-background font-semibold"
                    >
                      <Heart className="w-4 h-4" />
                      Donate
                    </Button>
                  </Link>
                  <Link href={`/get-involved/${slug}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-primary/30 hover:border-primary hover:bg-primary/10 text-primary font-semibold"
                    >
                      <HandHelping className="w-4 h-4" />
                      Get Involved
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
