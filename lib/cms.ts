import { CmsDAO } from "./nocodb/CmsDAO";
import type { CMSSection } from "./cms.types";

// Re-export public types for consumers
export type { CMSSection, TeamMember } from "./cms.types";

let cms: CmsDAO | null = null;

function isCmsConfigured(): boolean {
  return !!(
    process.env.NOCODB_BASE_URL &&
    process.env.NOCODB_API_TOKEN
  );
}

function getCmsDAO(): CmsDAO | null {
  if (!isCmsConfigured()) {
    console.warn("CMS environment variables not configured; returning empty content");
    return null;
  }

  if (!cms) {
    cms = new CmsDAO();
  }
  return cms;
}

export async function getPageContent(
  pageName: string
): Promise<Record<string, CMSSection>> {
  const dao = getCmsDAO();
  if (!dao) {
    return {};
  }

  return dao.getPageContent(pageName);
}
