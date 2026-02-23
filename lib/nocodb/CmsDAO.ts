import YAML from "yaml";
import { BaseViewDAO } from "./BaseViewDAO";
import type { ContentType, CMSRecord, CMSSection } from "../cms.types";

/**
 * Data Access Object for CMS content stored in NocoDB.
 * Handles fetching records from the CMS view and parsing
 * content fields (YAML, JSON, markdown).
 */
export class CmsDAO extends BaseViewDAO {
  constructor() {
    const tableId = process.env.CMS_TABLE_ID;
    const viewId = process.env.CMS_VIEW_ID;

    if (!tableId || !viewId) {
      throw new Error(
        "Missing CMS configuration: CMS_TABLE_ID and CMS_VIEW_ID must be set"
      );
    }

    super(tableId, viewId);
  }

  /**
   * Fetch all CMS sections for a given page name.
   * Records are filtered client-side from the full view data.
   */
  async getPageContent(
    pageName: string
  ): Promise<Record<string, CMSSection>> {
    const data = await this.listRecords<CMSRecord>({ limit: 100 });
    const pageRecords = data.list.filter(
      (record) => record.Page === pageName
    );

    const sections: Record<string, CMSSection> = {};
    for (const record of pageRecords) {
      const raw = record.Content?.replace(/<br\s*\/?>/gi, "") ?? "";
      const type = record.Type || "markdown";
      sections[record.Sub] = {
        type,
        raw,
        parsed: CmsDAO.parseContent(raw, type),
      };
    }

    return sections;
  }

  /**
   * Extract text content from triple-backtick code blocks.
   */
  private static extractFromCodeBlock(content: string): string {
    const match = content.match(/^```(?:\w*\n)?([\s\S]*?)```$/);
    return match ? match[1].trim() : content;
  }

  /**
   * Parse raw CMS content based on its declared type.
   */
  private static parseContent(
    content: string,
    type: ContentType
  ): unknown {
    if (!content) return type === "markdown" ? "" : null;

    switch (type.toLowerCase()) {
      case "yaml":
        try {
          const yamlContent = CmsDAO.extractFromCodeBlock(content);
          return YAML.parse(yamlContent);
        } catch {
          console.error("Failed to parse YAML");
          return null;
        }
      case "json":
        try {
          const jsonContent = CmsDAO.extractFromCodeBlock(content);
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
}
