import YAML from "yaml";

type ContentType = "markdown" | "yaml" | "json";

interface CMSRecord {
  Id: number;
  Page: string;
  Sub: string;
  Type: ContentType;
  Content: string;
}

export interface CMSSection {
  type: ContentType;
  raw: string;
  parsed: unknown;
}

export interface TeamMember {
  name: string;
  title: string;
  photo?: string;
}

interface CMSResponse {
  list: CMSRecord[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage: boolean;
    isLastPage: boolean;
  };
}

const CMS_API_URL =
  "https://nocodb.serubin.net/api/v2/tables/mz9n3xdqhpjy3m4/records?offset=0&limit=25&where=&viewId=vwpcd9cm382r3t2r";

async function fetchCMSData(): Promise<CMSResponse> {
  const res = await fetch(CMS_API_URL, {
    headers: {
      "xc-token": process.env.NOCODB_API_TOKEN!,
    },
    next: { revalidate: 0 }, // Cache for 1 hour
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
