import { CmsDAO } from "./nocodb/CmsDAO";
import type { CMSSection } from "./cms.types";

// Re-export public types for consumers
export type { CMSSection, TeamMember } from "./cms.types";

let cms: CmsDAO | null = null;

function getCmsDAO(): CmsDAO {
  if (!cms) {
    cms = new CmsDAO();
  }
  return cms;
}

export async function getPageContent(
  pageName: string
): Promise<Record<string, CMSSection>> {
  return getCmsDAO().getPageContent(pageName);
}
