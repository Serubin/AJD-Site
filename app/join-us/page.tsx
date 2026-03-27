import { getJoinUsFormProps } from "@/components/pages/joinUs/util";
import { JoinUsForm } from "@/components/pages/joinUs/JoinUsForm";

export default async function JoinUs() {
  const { statusContent, whatsappLink } = await getJoinUsFormProps();

  return <JoinUsForm mode="create" statusContent={statusContent} whatsappLink={whatsappLink} />;
}
