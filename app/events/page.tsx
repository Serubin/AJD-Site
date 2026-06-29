import type { Metadata } from "next";
import { getEvents } from "@/lib/events";
import { getCandidates } from "@/lib/candidates";
import { EventCards } from "@/components/pages/events/EventCards";

export const metadata: Metadata = {
  title: "Events | American Jews for Democracy",
  description:
    "Upcoming volunteer events organized by JDCA and partner organizations.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const [eventsResult, candidates] = await Promise.all([
    getEvents(),
    getCandidates(),
  ]);

  return (
    <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Upcoming Events
          </h1>
          <p className="text-muted-foreground font-serif max-w-2xl mx-auto text-lg">
            Volunteer at upcoming events organized by JDCA and partner
            organizations.
          </p>
        </div>

        <EventCards
          events={eventsResult.events}
          candidates={candidates}
          fetchError={eventsResult.error}
        />
      </div>
    </main>
  );
}
