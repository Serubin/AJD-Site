import { config } from "@/lib/config";
import { getPageContent } from "@/lib/cms";
import {
  defaultStatusContent,
  type StatusPanelContent,
} from "@/components/pages/getInvolved/status/statusPanelContent";

type SectionShape = { title?: string; body?: string };

export async function getGetInvolvedFormProps(): Promise<{
  statusContent: StatusPanelContent;
  whatsappLink: string | undefined;
}> {
  const sections = await getPageContent("GetInvolved");

  const signUp = sections.SignUpSuccess?.parsed as SectionShape | undefined;
  const update = sections.UpdateSuccess?.parsed as SectionShape | undefined;
  const linkSent = sections.LinkSent?.parsed as SectionShape | undefined;

  const statusContent: StatusPanelContent = {
    signUpTitle: signUp?.title || defaultStatusContent.signUpTitle,
    signUpBody: signUp?.body || defaultStatusContent.signUpBody,
    updateTitle: update?.title || defaultStatusContent.updateTitle,
    updateBody: update?.body || defaultStatusContent.updateBody,
    linkSentTitle: linkSent?.title || defaultStatusContent.linkSentTitle,
    linkSentBody: linkSent?.body || defaultStatusContent.linkSentBody,
  };

  return {
    statusContent,
    whatsappLink: config.features.whatsappLink,
  };
}
