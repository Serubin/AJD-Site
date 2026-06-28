export type CampaignStatus =
  | "Draft"
  | "Queued"
  | "Sending"
  | "Sent"
  | "Failed";

export interface CampaignRecord {
  Id?: number;
  Title: string;
  Slug: string;
  BodyMarkdown: string;
  /** Optional email subject; falls back to Title when empty. */
  EmailSubject?: string;
  /** Optional SMS body override; falls back to the default SMS template. */
  SmsOverride?: string;
  Status: CampaignStatus;
  /** When set, the public /posts/[slug] page is live. */
  PublishedAt?: string | null;
  SentAt?: string | null;
  EmailsSent?: number;
  SmsSent?: number;
  Skipped?: number;
  Failed?: number;
}

export type SendChannel = "email" | "sms" | "skipped";
export type SendStatus = "sent" | "failed" | "skipped";

export interface CampaignSendRecord {
  Id?: number;
  Campaign: { Id: number } | number;
  User: { Id: number } | number;
  Channel: SendChannel;
  Status: SendStatus;
  Error?: string | null;
  SentAt?: string | null;
}
