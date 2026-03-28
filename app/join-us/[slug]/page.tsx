import { loadUserFromValidLink } from "@/lib/joinUsLinks";
import { getJoinUsFormProps } from "@/components/pages/joinUs/util";
import { parseStoredPhone } from "@/lib/phone";
import { JoinUsForm } from "@/components/pages/joinUs/JoinUsForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function JoinUsUpdate({ params }: PageProps) {
  const { slug } = await params;
  const { user } = await loadUserFromValidLink(slug);

  const { countryCode, nationalDigits } = parseStoredPhone(user.Phone ?? "");

  const initialData = {
    name: user.Name ?? "",
    email: user.Email ?? "",
    phoneCountryCode: countryCode,
    phoneNational: nationalDigits,
    states: user.States ? user.States.split(",").filter(Boolean) : [],
    congressionalDistrict: user.CongressionalDistrict ?? "",
  };

  const { statusContent, whatsappLink } = await getJoinUsFormProps();

  return (
    <JoinUsForm
      mode="update"
      slug={slug}
      initialData={initialData}
      statusContent={statusContent}
      whatsappLink={whatsappLink}
    />
  );
}
