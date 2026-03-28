"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, HandHelping, Search, RotateCcw } from "lucide-react";
import type { CandidateRecord } from "@/lib/candidates";

const ALL = "__all__";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function appendRefcode(url: string): string {
  const u = new URL(url);
  u.searchParams.set("refcode", "american-jews-for-democracy");
  return u.toString();
}

function isSenate(district: string): boolean {
  return district.endsWith("-Sen");
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

interface CandidateFiltersProps {
  nameQuery: string;
  onNameChange: (value: string) => void;
  stateFilter: string;
  onStateChange: (value: string) => void;
  states: string[];
  chamberFilter: string;
  onChamberChange: (value: string) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
}

function CandidateFilters({
  nameQuery,
  onNameChange,
  stateFilter,
  onStateChange,
  states,
  chamberFilter,
  onChamberChange,
  hasActiveFilters,
  onReset,
}: CandidateFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name..."
          value={nameQuery}
          onChange={(e) => onNameChange(e.target.value)}
          className="pl-9 bg-card/50 border-white/10"
        />
      </div>
      <Select value={stateFilter} onValueChange={onStateChange}>
        <SelectTrigger className="w-full sm:w-44 bg-card/50 border-white/10">
          <SelectValue placeholder="All States" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All States</SelectItem>
          {states.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={chamberFilter} onValueChange={onChamberChange}>
        <SelectTrigger className="w-full sm:w-44 bg-card/50 border-white/10">
          <SelectValue placeholder="All Chambers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All Chambers</SelectItem>
          <SelectItem value="senate">Senate</SelectItem>
          <SelectItem value="house">House</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        onClick={onReset}
        disabled={!hasActiveFilters}
        className="bg-card/50 text-inherit shrink-0"
        style={{ borderColor: "rgba(255, 255, 255, .1)" }}
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function CandidateCard({ candidate }: { candidate: CandidateRecord }) {
  return (
    <Card className="h-full bg-card/50 border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group">
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-3">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={candidate.Photo} alt={candidate.Name} />
            <AvatarFallback className="text-lg font-display">
              {initials(candidate.Name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="text-xl font-display font-bold text-white truncate">
              {candidate.Name}
            </h3>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary bg-primary/10 mt-1 mr-1"
            >
              {candidate.District}
            </Badge>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary bg-primary/10 mt-1 ml-1"
            >
              {candidate.State}
            </Badge>
          </div>
        </div>

        <p className="text-muted-foreground font-serif text-sm leading-relaxed mb-4 line-clamp-2">
          {candidate.Description}
        </p>

        <div className="flex gap-3">
          {candidate.DonateUrl && (
            <Link
              href={appendRefcode(candidate.DonateUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                variant="default"
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-background font-semibold"
              >
                <Heart className="w-4 h-4" />
                Donate
              </Button>
            </Link>
          )}
          {candidate.VolunteerUrl && (
            <Link
              href={candidate.VolunteerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full border-primary/30 hover:border-primary hover:bg-primary/10 text-primary font-semibold"
              >
                <HandHelping className="w-4 h-4" />
                Get Involved
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export function CandidateCards({ candidates }: { candidates: CandidateRecord[] }) {
  const [nameQuery, setNameQuery] = useState("");
  const [stateFilter, setStateFilter] = useState(ALL);
  const [chamberFilter, setChamberFilter] = useState(ALL);

  const hasActiveFilters =
    nameQuery !== "" || stateFilter !== ALL || chamberFilter !== ALL;

  function resetFilters() {
    setNameQuery("");
    setStateFilter(ALL);
    setChamberFilter(ALL);
  }

  const states = useMemo(() => {
    const unique = [...new Set(candidates.map((c) => c.State).filter(Boolean))];
    unique.sort();
    return unique;
  }, [candidates]);

  const filtered = useMemo(() => {
    const query = nameQuery.toLowerCase().trim();
    return candidates.filter((c) => {
      if (query && !c.Name.toLowerCase().includes(query)) return false;
      if (stateFilter !== ALL && c.State !== stateFilter) return false;
      if (chamberFilter === "senate" && !isSenate(c.District)) return false;
      if (chamberFilter === "house" && isSenate(c.District)) return false;
      return true;
    });
  }, [candidates, nameQuery, stateFilter, chamberFilter]);

  return (
    <div>
      <CandidateFilters
        nameQuery={nameQuery}
        onNameChange={setNameQuery}
        stateFilter={stateFilter}
        onStateChange={setStateFilter}
        states={states}
        chamberFilter={chamberFilter}
        onChamberChange={setChamberFilter}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
      />

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground font-serif py-12">
          No candidates match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map((candidate) => (
              <motion.div
                key={candidate.Id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <CandidateCard candidate={candidate} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
