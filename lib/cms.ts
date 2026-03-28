import { config } from "./config";
import { CmsDAO } from "./nocodb/CmsDAO";
import type { CMSSection } from "./cms.types";
import { connection } from 'next/server';
import { lazyInit } from "./utils";

// Re-export public types for consumers
export type { CMSSection, TeamMember } from "./cms.types";

const getCmsDAO = lazyInit((): CmsDAO | null => {
  const cmsConfig = config.cms;
  if (!cmsConfig) {
    console.warn("CMS not configured (nocodb__cms__table_id, nocodb__cms__view_id); returning empty content");
    return null;
  }
  return new CmsDAO();
});

export async function getPageContent(
  pageName: string
): Promise<Record<string, CMSSection>> {
  await connection();
  const dao = getCmsDAO();
  if (!dao) {
    return {};
  }

  return dao.getPageContent(pageName);
}
