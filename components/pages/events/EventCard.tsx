"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, MapPin, Video } from "lucide-react";
import { withTracking } from "@/lib/utils";
import { humanizeEventType } from "@/lib/eventTypes";
import type { EventRecord, EventTimeslot } from "@/lib/events";

const timeslotFormatters = new Map<string, Intl.DateTimeFormat>();
function formatTimeslot(ms: number, timezone: string): string {
  let f = timeslotFormatters.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: timezone,
    });
    timeslotFormatters.set(timezone, f);
  }
  return f.format(new Date(ms));
}

interface Props {
  event: EventRecord;
  displayedTimeslot: EventTimeslot;
  matchingSlotCount: number;
}

function EventCardImpl({ event, displayedTimeslot, matchingSlotCount }: Props) {
  const [imgError, setImgError] = useState(false);
  const moreCount = matchingSlotCount - 1;
  const showImage = event.featuredImageUrl && !imgError;
  const startIso = new Date(displayedTimeslot.startMs).toISOString();
  const startLabel = formatTimeslot(displayedTimeslot.startMs, event.timezone);
  const ctaUrl = event.browserUrl ? withTracking(event.browserUrl) : "";

  return (
    <Card className="h-full bg-card/50 border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group flex flex-col overflow-hidden">
      <div className="relative aspect-video w-full bg-gradient-to-br from-democracy-blue to-card overflow-hidden">
        {showImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={event.featuredImageUrl}
            alt=""
            width={640}
            height={360}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute top-2 right-2 flex gap-1">
          {event.isVirtual ? (
            <Badge
              variant="outline"
              className="bg-background/80 border-white/20 backdrop-blur-sm"
            >
              <Video className="w-3 h-3 mr-1" />
              Virtual
            </Badge>
          ) : null}
          {event.state ? (
            <Badge
              variant="outline"
              className="bg-background/80 border-white/20 backdrop-blur-sm"
            >
              <MapPin className="w-3 h-3 mr-1" />
              {event.state}
            </Badge>
          ) : null}
        </div>
      </div>

      <CardContent className="p-5 flex flex-col flex-grow">
        <Badge
          variant="outline"
          className="border-primary/40 text-primary bg-primary/10 self-start mb-2"
        >
          {humanizeEventType(event.eventType)}
        </Badge>
        <h3 className="text-lg font-display font-bold text-white line-clamp-2 mb-1">
          {event.title}
        </h3>
        {event.sponsorName ? (
          <p className="text-xs text-muted-foreground font-sans mb-2 line-clamp-1">
            {event.sponsorName}
          </p>
        ) : null}
        <p className="text-sm text-foreground/80 font-sans mb-3">
          <time dateTime={startIso}>{startLabel}</time>
          {moreCount > 0 ? (
            <span className="text-muted-foreground"> · +{moreCount} more</span>
          ) : null}
        </p>
        {event.summary ? (
          <p className="text-sm text-muted-foreground font-serif leading-relaxed mb-4 line-clamp-2">
            {event.summary}
          </p>
        ) : null}
        <div className="mt-auto">
          {ctaUrl ? (
            <Link
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="default"
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-background font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                RSVP on Mobilize
              </Button>
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export const EventCard = memo(EventCardImpl);
