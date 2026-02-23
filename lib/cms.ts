import { config } from "./config";
import { CmsDAO } from "./nocodb/CmsDAO";
import type { CMSSection } from "./cms.types";

// Re-export public types for consumers
export type { CMSSection, TeamMember } from "./cms.types";

let cms: CmsDAO | null = null;

function getCmsDAO(): CmsDAO | null {
  const cmsConfig = config.cms;
  if (!cmsConfig) {
    console.warn("CMS not configured (nocodb__cms__table_id, nocodb__cms__view_id); returning empty content");
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
