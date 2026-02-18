import { getGetInvolvedFormProps } from "@/components/pages/getInvolved/util";
import { GetInvolvedForm } from "@/components/pages/getInvolved/GetInvolvedForm";

export default async function GetInvolved() {
  const { statusContent, whatsappLink } = await getGetInvolvedFormProps();

  return <GetInvolvedForm mode="create" statusContent={statusContent} whatsappLink={whatsappLink} />;
}
