import { connection } from "next/server";
import { config } from "./config";

export { humanizeEventType } from "./eventTypes";

export interface EventTimeslot {
  startMs: number;
  endMs: number;
  isFull: boolean;
}

export interface EventRecord {
  id: number;
  title: string;
  summary: string;
  browserUrl: string;
  featuredImageUrl: string;
  eventType: string;
  isVirtual: boolean;
  state: string;
  city: string;
  sponsorName: string;
  timezone: string;
  timeslots: EventTimeslot[];
  matchHaystack: string;
}

export interface EventsResult {
  events: EventRecord[];
  error: boolean;
}

interface RawTimeslot {
  start_date: number;
  end_date: number;
  is_full?: boolean;
}

interface RawSponsor {
  name?: string;
}

interface RawLocation {
  region?: string | null;
  locality?: string | null;
}

interface RawEvent {
  id: number;
  title?: string;
  summary?: string | null;
  description?: string | null;
  browser_url?: string;
  featured_image_url?: string | null;
  event_type?: string;
  is_virtual?: boolean;
  timezone?: string;
  approval_status?: string;
  visibility?: string;
  sponsor?: RawSponsor;
  location?: RawLocation | null;
  timeslots?: RawTimeslot[];
}

interface ListResponse {
  data?: RawEvent[];
  next?: string | null;
}

const MAX_PAGES = 10;

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
};

const STATE_NAME_RE = new RegExp(
  `\\b(${Object.keys(STATE_NAME_TO_CODE).join("|")})\\b`,
  "i",
);

function inferStateFromText(text: string): string {
  const m = text.match(STATE_NAME_RE);
  if (!m) return "";
  return STATE_NAME_TO_CODE[m[1].toLowerCase()] ?? "";
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function buildSummary(raw: RawEvent): string {
  const summary = (raw.summary ?? "").trim();
  if (summary) return summary.length > 240 ? summary.slice(0, 237) + "…" : summary;
  const stripped = stripHtml(raw.description ?? "");
  if (!stripped) return "";
  return stripped.length > 240 ? stripped.slice(0, 237) + "…" : stripped;
}

function normalize(raw: RawEvent, nowMs: number): EventRecord | null {
  if (raw.approval_status && raw.approval_status !== "APPROVED") return null;

  const futureSlots: EventTimeslot[] = (raw.timeslots ?? [])
    .filter((t) => !t.is_full)
    .map((t) => ({
      startMs: t.start_date * 1000,
      endMs: t.end_date * 1000,
      isFull: false,
    }))
    .filter((t) => t.startMs >= nowMs)
    .sort((a, b) => a.startMs - b.startMs);

  if (futureSlots.length === 0) return null;

  const title = (raw.title ?? "").trim();
  const description = stripHtml(raw.description ?? "");
  const explicitState = (raw.location?.region ?? "").trim();
  const state = explicitState || inferStateFromText(`${title} ${description}`);

  return {
    id: raw.id,
    title,
    summary: buildSummary(raw),
    browserUrl: raw.browser_url ?? "",
    featuredImageUrl: raw.featured_image_url ?? "",
    eventType: raw.event_type ?? "OTHER",
    isVirtual: raw.is_virtual === true,
    state,
    city: raw.location?.locality ?? "",
    sponsorName: raw.sponsor?.name ?? "",
    timezone: raw.timezone || "America/New_York",
    timeslots: futureSlots,
    matchHaystack: `${title} ${description}`.toLowerCase(),
  };
}

export async function getEvents(): Promise<EventsResult> {
  await connection();

  const { orgId, baseUrl } = config.mobilize;
  const startUrl = `${baseUrl}/organizations/${orgId}/events?timeslot_start=gte_now&per_page=200&visibility=PUBLIC`;

  const raws: RawEvent[] = [];
  let url: string | null = startUrl;
  let pages = 0;

  try {
    while (url && pages < MAX_PAGES) {
      const res = await fetch(url, { next: { revalidate: 600 } });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(
          `[events] Mobilize API ${res.status} ${res.statusText}: ${body.slice(0, 500)}`,
        );
        return { events: [], error: true };
      }
      const json = (await res.json()) as ListResponse;
      if (json.data) raws.push(...json.data);
      url = json.next ?? null;
      pages += 1;
    }
  } catch (err) {
    console.error("[events] Mobilize API fetch failed:", err);
    return { events: [], error: true };
  }

  const nowMs = Date.now();
  const events = raws
    .map((r) => normalize(r, nowMs))
    .filter((e): e is EventRecord => e !== null)
    .sort((a, b) => a.timeslots[0].startMs - b.timeslots[0].startMs);

  return { events, error: false };
}
