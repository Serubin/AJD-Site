import YAML from "yaml";
import type { ContentType, CMSSection, CMSResponse } from "./cms.types";

// Re-export public types for consumers
export type { CMSSection, TeamMember } from "./cms.types";

const TTL = process.env.NODE_ENV === "production" ? 60 * 60 : 0;

const CMS_API_URL = [
  "https://",
  process.env.CMS_API_BASE_URL,
  "/api/v2/tables/",
  process.env.CMS_API_TABLE_ID,
  "/records?offset=0&limit=50&where=&viewId=",
  process.env.CMS_API_VIEW_ID,
].join("");

async function fetchCMSData(): Promise<CMSResponse> {
  const res = await fetch(CMS_API_URL, {
    headers: {
      "xc-token": process.env.NOCODB_API_TOKEN!,
    },
    next: { revalidate: TTL },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch CMS data: ${res.status}`);
  }

  return res.json();
}

function extractFromCodeBlock(content: string): string {
  // Match content within triple backticks, with optional language identifier
  const match = content.match(/^```(?:\w*\n)?([\s\S]*?)```$/);
  return match ? match[1].trim() : content;
}

function parseContent(content: string, type: ContentType): unknown {
  if (!content) return type === "markdown" ? "" : null;

  switch (type.toLowerCase()) {
    case "yaml":
      try {
        const yamlContent = extractFromCodeBlock(content);
        return YAML.parse(yamlContent);
      } catch {
        console.error("Failed to parse YAML");
        return null;

      }
    case "json":
      try {
        const jsonContent = extractFromCodeBlock(content);
        return JSON.parse(jsonContent);
      } catch {
        console.error("Failed to parse JSON");
        return null;
      }
    case "markdown":
    default:
      return content;
  }
}

export async function getPageContent(
  pageName: string
): Promise<Record<string, CMSSection>> {
  const data = await fetchCMSData();
  const pageRecords = data.list.filter((record) => record.Page === pageName);

  const sections: Record<string, CMSSection> = {};
  for (const record of pageRecords) {
    const raw = record.Content?.replace(/<br\s*\/?>/gi, "") ?? "";
    const type = record.Type || "markdown";
    sections[record.Sub] = {
      type,
      raw,
      parsed: parseContent(raw, type),
    };
  }

  return sections;
}
