import { redirect } from "next/navigation";
import { expireLink, findValidLink } from "@/lib/presignedLinks";
import { findUserById, updateUserVerified } from "@/lib/users";
import { getJoinUsFormProps } from "@/components/pages/joinUs/util";
import { parseStoredPhone } from "@/lib/phone";
import { JoinUsForm } from "@/components/pages/joinUs/JoinUsForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function JoinUsUpdate({ params }: PageProps) {
  const { slug } = await params;

  const link = await findValidLink(slug);
  if (!link) {
    redirect("/join-us");
  }

  const user = await findUserById(link.User.Id);
  if (!user) {
    redirect("/join-us");
  }

  await updateUserVerified(user.Id!, true);

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
