import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { config } from "@/lib/config";
import { sendCampaign } from "@/lib/campaigns";
import { CampaignsDAO } from "@/lib/nocodb/CampaignsDAO";
import { handleApiError, parseJsonBody } from "@/lib/api";

export const runtime = "nodejs";

function secretMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Pull the first row out of the various NocoDB webhook payload shapes. */
function extractRow(body: Record<string, unknown>): Record<string, unknown> | null {
  const data = body.data as Record<string, unknown> | undefined;
  const rows =
    (data?.rows as Record<string, unknown>[] | undefined) ??
    (body.rows as Record<string, unknown>[] | undefined);
  if (Array.isArray(rows) && rows.length > 0) return rows[0];
  const row =
    (data?.row as Record<string, unknown> | undefined) ??
    (body.row as Record<string, unknown> | undefined);
  if (row) return row;
  return null;
}

export async function POST(request: NextRequest) {
  let webhookSecret: string;
  try {
    webhookSecret = config.campaignSending.webhookSecret;
  } catch (error) {
    return handleApiError(error, "Campaign sending is not configured");
  }

  const provided = request.headers.get("x-campaign-secret");
  if (!secretMatches(provided, webhookSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bodyOrError = await parseJsonBody(request);
  if (bodyOrError instanceof NextResponse) return bodyOrError;
  const body = bodyOrError;

  const row = extractRow(body);

  const rawId =
    body.campaignId ?? body.id ?? row?.Id ?? row?.id ?? undefined;
  const slug =
    (typeof body.slug === "string" ? body.slug : undefined) ??
    (typeof row?.Slug === "string" ? (row.Slug as string) : undefined);

  // Only act on Queued campaigns so our own Sending/Sent updates don't loop.
  const status =
    (typeof body.status === "string" ? body.status : undefined) ??
    (typeof row?.Status === "string" ? (row.Status as string) : undefined);
  if (status && status !== "Queued") {
    return NextResponse.json({ ignored: true, status }, { status: 200 });
  }

  try {
    let campaignId: number | undefined;
    if (rawId !== undefined && rawId !== null) {
      campaignId = Number(rawId);
    } else if (slug) {
      const campaign = await new CampaignsDAO().findBySlug(slug);
      campaignId = campaign?.Id;
    }

    if (!campaignId || !Number.isInteger(campaignId)) {
      return NextResponse.json(
        { error: "No campaign id or slug in payload" },
        { status: 400 },
      );
    }

    // Resumable + idempotent: run in the background and acknowledge immediately
    // so the webhook does not time out on large audiences.
    void sendCampaign(campaignId).catch((err) =>
      console.error("[campaigns] background send failed:", err),
    );

    return NextResponse.json({ accepted: true, campaignId }, { status: 202 });
  } catch (error) {
    return handleApiError(error, "Failed to start campaign send");
  }
}
