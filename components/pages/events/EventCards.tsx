"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FILTER_ALL as ALL, useFilterSync } from "@/lib/filterParams";
import { RotateCcw, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventCard } from "./EventCard";
import {
  EventDateRangeFilter,
  type DateRange,
} from "./EventDateRangeFilter";
import { humanizeEventType } from "@/lib/eventTypes";
import { withTracking } from "@/lib/utils";
import type { EventRecord, EventTimeslot } from "@/lib/events";
import type { CandidateRecord } from "@/lib/candidates";

const TOKEN_RE = /[a-z0-9-]+/g;

const tokenize = (s: string): string[] => s.toLowerCase().match(TOKEN_RE) ?? [];

function matchesCandidate(
  hay: string,
  tokens: Set<string>,
  c: CandidateRecord,
): boolean {
  const nameTokens = tokenize(c.Name);
  const last = nameTokens[nameTokens.length - 1];
  const first = nameTokens[0];
  const fullNameHit =
    !!first && !!last && tokens.has(first) && tokens.has(last);

  const district = c.District.toLowerCase();
  const districtHit =
    district.includes("-") && hay.includes(district) && !!last && tokens.has(last);

  return fullNameHit || districtHit;
}

const dateKeyFormatters = new Map<string, Intl.DateTimeFormat>();
function localDateKey(ms: number, timeZone: string): string {
  let f = dateKeyFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateKeyFormatters.set(timeZone, f);
  }
  return f.format(new Date(ms));
}

function pickedDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateParam(s: string | null): Date | undefined {
  if (!s) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? undefined : d;
}

function timeslotInRange(
  t: EventTimeslot,
  tz: string,
  from?: Date,
  to?: Date,
): boolean {
  if (!from && !to) return true;
  const startKey = localDateKey(t.startMs, tz);
  const endKey = localDateKey(t.endMs, tz);
  const fromKey = from ? pickedDateKey(from) : null;
  const toKey = to ? pickedDateKey(to) : null;
  if (fromKey && endKey < fromKey) return false;
  if (toKey && startKey > toKey) return false;
  return true;
}

interface FilteredEvent {
  event: EventRecord;
  displayedTimeslot: EventTimeslot;
  matchingSlotCount: number;
  isCandidateEvent: boolean;
}

interface Props {
  events: EventRecord[];
  candidates: CandidateRecord[];
  fetchError: boolean;
}

const MOBILIZE_FALLBACK_URL = withTracking(
  "https://www.mobilize.us/jewishdems/",
);

export function EventCards({ events, candidates, fetchError }: Props) {
  const searchParams = useSearchParams();

  const [nameQuery, setNameQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [stateFilter, setStateFilter] = useState(() => {
    const s = searchParams.get("state");
    return s && events.some((e) => e.state === s) ? s : ALL;
  });
  const [typeFilter, setTypeFilter] = useState(() => {
    const t = searchParams.get("type");
    return t && events.some((e) => e.eventType === t) ? t : ALL;
  });
  const [candidateId, setCandidateId] = useState(() => {
    const c = searchParams.get("candidate");
    return c && candidates.some((x) => String(x.Id) === c) ? c : ALL;
  });
  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: parseDateParam(searchParams.get("from")),
    to: parseDateParam(searchParams.get("to")),
  }));

  useFilterSync({
    q: nameQuery,
    state: stateFilter === ALL ? undefined : stateFilter,
    type: typeFilter === ALL ? undefined : typeFilter,
    candidate: candidateId === ALL ? undefined : candidateId,
    from: dateRange.from ? pickedDateKey(dateRange.from) : undefined,
    to: dateRange.to ? pickedDateKey(dateRange.to) : undefined,
  });

  const hasActiveFilters =
    nameQuery !== "" ||
    stateFilter !== ALL ||
    typeFilter !== ALL ||
    candidateId !== ALL ||
    dateRange.from !== undefined ||
    dateRange.to !== undefined;

  function resetFilters() {
    setNameQuery("");
    setStateFilter(ALL);
    setTypeFilter(ALL);
    setCandidateId(ALL);
    setDateRange({});
  }

  const states = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.state).filter(Boolean))];
    unique.sort();
    return unique;
  }, [events]);

  const eventTypes = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.eventType).filter(Boolean))];
    unique.sort((a, b) => humanizeEventType(a).localeCompare(humanizeEventType(b)));
    return unique;
  }, [events]);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => a.Name.localeCompare(b.Name));
  }, [candidates]);

  const selectedCandidate = useMemo(() => {
    if (candidateId === ALL) return null;
    const id = Number(candidateId);
    return sortedCandidates.find((c) => c.Id === id) ?? null;
  }, [sortedCandidates, candidateId]);

  const filtered = useMemo<FilteredEvent[]>(() => {
    const nowMs = Date.now();
    const query = nameQuery.toLowerCase().trim();

    const result: FilteredEvent[] = [];
    for (const event of events) {
      if (query && !event.title.toLowerCase().includes(query)) continue;
      if (stateFilter !== ALL && event.state !== stateFilter) continue;
      if (typeFilter !== ALL && event.eventType !== typeFilter) continue;

      const hay = event.matchHaystack;
      const tokens = new Set(tokenize(hay));

      if (selectedCandidate && !matchesCandidate(hay, tokens, selectedCandidate))
        continue;

      const liveSlots = event.timeslots.filter((t) => t.startMs >= nowMs);
      if (liveSlots.length === 0) continue;

      const matchingSlots = liveSlots.filter((t) =>
        timeslotInRange(t, event.timezone, dateRange.from, dateRange.to),
      );
      if (matchingSlots.length === 0) continue;

      result.push({
        event,
        displayedTimeslot: matchingSlots[0],
        matchingSlotCount: matchingSlots.length,
        isCandidateEvent: candidates.some((c) =>
          matchesCandidate(hay, tokens, c),
        ),
      });
    }
    result.sort(
      (a, b) => a.displayedTimeslot.startMs - b.displayedTimeslot.startMs,
    );
    return result;
  }, [
    events,
    candidates,
    nameQuery,
    stateFilter,
    typeFilter,
    selectedCandidate,
    dateRange.from,
    dateRange.to,
  ]);

  const { candidateEvents, otherEvents } = useMemo(() => {
    const candidateEvents: FilteredEvent[] = [];
    const otherEvents: FilteredEvent[] = [];
    for (const fe of filtered) {
      (fe.isCandidateEvent ? candidateEvents : otherEvents).push(fe);
    }
    return { candidateEvents, otherEvents };
  }, [filtered]);

  // Suppress the section split when the user has filtered to a single
  // candidate — the whole list is implicitly "Our Candidates" already.
  const showSections = !selectedCandidate && candidateEvents.length > 0;

  const suggestions = useMemo<FilteredEvent[]>(() => {
    const nowMs = Date.now();
    const result: FilteredEvent[] = [];
    for (const event of events) {
      const liveSlots = event.timeslots.filter((t) => t.startMs >= nowMs);
      if (liveSlots.length === 0) continue;
      result.push({
        event,
        displayedTimeslot: liveSlots[0],
        matchingSlotCount: liveSlots.length,
        isCandidateEvent: false,
      });
    }
    result.sort(
      (a, b) => a.displayedTimeslot.startMs - b.displayedTimeslot.startMs,
    );
    return result.slice(0, 5);
  }, [events]);

  const showFatalError = fetchError && events.length === 0;

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search events..."
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="pl-9 bg-card/50 border-white/10"
          />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-card/50 border-white/10">
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 bg-card/50 border-white/10">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Types</SelectItem>
            {eventTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {humanizeEventType(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <EventDateRangeFilter value={dateRange} onChange={setDateRange} />
        <Select value={candidateId} onValueChange={setCandidateId}>
          <SelectTrigger className="w-full sm:w-56 bg-card/50 border-white/10">
            <SelectValue placeholder="All Candidates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Candidates</SelectItem>
            {sortedCandidates.map((c) => (
              <SelectItem key={c.Id} value={String(c.Id)}>
                {c.Name} — {c.District}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          className="bg-card/50 text-inherit shrink-0"
          style={{ borderColor: "rgba(255, 255, 255, .1)" }}
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {fetchError && !showFatalError ? (
        <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-md border border-democracy-gold/30 bg-democracy-gold/10 text-sm font-sans">
          <AlertTriangle className="w-4 h-4 text-democracy-gold shrink-0" />
          <span>
            Some events may be missing.{" "}
            <Link
              href={MOBILIZE_FALLBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View the full feed on Mobilize
            </Link>
            .
          </span>
        </div>
      ) : null}

      {showFatalError ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <AlertTriangle className="w-10 h-10 text-democracy-gold mx-auto mb-4" />
          <p className="text-foreground font-serif mb-2">
            We couldn&apos;t load events right now.
          </p>
          <p className="text-muted-foreground font-serif text-sm mb-6">
            View them directly on Mobilize.
          </p>
          <Link
            href={MOBILIZE_FALLBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="default" className="bg-primary text-background">
              Open Mobilize
            </Button>
          </Link>
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-muted-foreground font-serif py-12">
          No upcoming events scheduled.
        </p>
      ) : filtered.length === 0 ? (
        <>
          <div className="text-center py-12 max-w-2xl mx-auto">
            <p className="text-foreground font-display text-2xl mb-2">
              No events match your filters.
            </p>
            <p className="text-muted-foreground font-serif mb-6">
              Here are some other upcoming events you might be interested in.
            </p>
            <Button
              onClick={resetFilters}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-background font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              Reset filters
            </Button>
          </div>
          {suggestions.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {suggestions.map(
                ({ event, displayedTimeslot, matchingSlotCount }) => (
                  <div
                    key={event.id}
                    className="snap-start shrink-0 w-[260px] sm:w-[280px]"
                  >
                    <EventCard
                      event={event}
                      displayedTimeslot={displayedTimeslot}
                      matchingSlotCount={matchingSlotCount}
                    />
                  </div>
                ),
              )}
            </div>
          ) : null}
        </>
      ) : showSections ? (
        <div className="space-y-12">
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-2xl font-display font-bold text-white">
                Our Candidates
              </h2>
              <span className="text-sm font-sans text-muted-foreground">
                {candidateEvents.length}{" "}
                {candidateEvents.length === 1 ? "event" : "events"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {candidateEvents.map(
                  ({ event, displayedTimeslot, matchingSlotCount }) => (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <EventCard
                        event={event}
                        displayedTimeslot={displayedTimeslot}
                        matchingSlotCount={matchingSlotCount}
                      />
                    </motion.div>
                  ),
                )}
              </AnimatePresence>
            </div>
          </section>
          {otherEvents.length > 0 ? (
            <section>
              <h2 className="text-2xl font-display font-bold text-white mb-4">
                More Events
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {otherEvents.map(
                    ({ event, displayedTimeslot, matchingSlotCount }) => (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <EventCard
                          event={event}
                          displayedTimeslot={displayedTimeslot}
                          matchingSlotCount={matchingSlotCount}
                        />
                      </motion.div>
                    ),
                  )}
                </AnimatePresence>
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filtered.map(({ event, displayedTimeslot, matchingSlotCount }) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <EventCard
                  event={event}
                  displayedTimeslot={displayedTimeslot}
                  matchingSlotCount={matchingSlotCount}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
