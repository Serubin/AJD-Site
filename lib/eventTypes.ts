const EVENT_TYPE_LABELS: Record<string, string> = {
  CANVASS: "Canvass",
  PHONE_BANK: "Phone Bank",
  TEXT_BANK: "Text Bank",
  MEETING: "Meeting",
  COMMUNITY: "Community",
  FUNDRAISER: "Fundraiser",
  MEET_GREET: "Meet & Greet",
  HOUSE_PARTY: "House Party",
  VOTER_REG: "Voter Registration",
  TRAINING: "Training",
  FRIEND_TO_FRIEND_OUTREACH: "Friend Outreach",
  DEBATE_WATCH_PARTY: "Debate Watch",
  ADVOCACY_CALL: "Advocacy Call",
  RALLY: "Rally",
  TOWN_HALL: "Town Hall",
  OFFICE_OPENING: "Office Opening",
  BARNSTORM: "Barnstorm",
  SOLIDARITY_EVENT: "Solidarity",
  COMMUNITY_CANVASS: "Community Canvass",
  SIGNATURE_GATHERING: "Signature Gathering",
  CARPOOL: "Carpool",
  WORKSHOP: "Workshop",
  PETITION: "Petition",
  AUTOMATED_PHONE_BANK: "Phone Bank",
  LETTER_WRITING: "Letter Writing",
  LITERATURE_DROP_OFF: "Literature Drop-off",
  VISIBILITY_EVENT: "Visibility Event",
  OTHER: "Event",
};

export function humanizeEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? "Event";
}
