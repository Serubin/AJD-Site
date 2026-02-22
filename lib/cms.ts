import { config } from "./config";
import { CmsDAO } from "./nocodb/CmsDAO";
import type { CMSSection } from "./cms.types";

// Re-export public types for consumers
export type { CMSSection, TeamMember } from "./cms.types";

let cms: CmsDAO | null = null;

function getCmsDAO(): CmsDAO | null {
  const cmsConfig = config.cms;
  // #region agent log
  const payload = { location: "lib/cms.ts:getCmsDAO", message: "getCmsDAO", data: { cmsConfigNull: !cmsConfig, willReturnDao: !!cmsConfig }, timestamp: Date.now(), hypothesisId: "C" };
  fetch("http://127.0.0.1:7243/ingest/870d7da7-617e-49a8-920c-3352a422e2b1", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
  try { console.log(JSON.stringify(payload)); } catch (_) {}
  // #endregion
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
