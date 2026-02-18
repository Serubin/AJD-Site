import { redirect } from "next/navigation";
import { findValidLink } from "@/lib/presignedLinks";
import { findUserById } from "@/lib/users";
import { getGetInvolvedFormProps } from "@/components/pages/getInvolved/util";
import { parseStoredPhone } from "@/lib/phone";
import { GetInvolvedForm } from "@/components/pages/getInvolved/GetInvolvedForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function GetInvolvedUpdate({ params }: PageProps) {
  const { slug } = await params;

  const link = await findValidLink(slug);
  if (!link) {
    redirect("/get-involved");
  }

  const user = await findUserById(link.User.Id);
  if (!user) {
    redirect("/get-involved");
  }

  const { countryCode, nationalDigits } = parseStoredPhone(user.Phone ?? "");

  const initialData = {
    name: user.Name ?? "",
    email: user.Email ?? "",
    phoneCountryCode: countryCode,
    phoneNational: nationalDigits,
    states: user.States ? user.States.split(",").filter(Boolean) : [],
    congressionalDistrict: user.CongressionalDistrict ?? "",
  };

  const { statusContent, whatsappLink } = await getGetInvolvedFormProps();

  return (
    <GetInvolvedForm
      mode="update"
      slug={slug}
      initialData={initialData}
      statusContent={statusContent}
      whatsappLink={whatsappLink}
    />
  );
}
