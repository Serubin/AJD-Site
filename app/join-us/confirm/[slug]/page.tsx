import { redirect } from "next/navigation";
import { findValidLink, expireLink } from "@/lib/presignedLinks";
import { findUserById, updateUserVerified } from "@/lib/users";
import { getJoinUsFormProps } from "@/components/pages/joinUs/util";
import {
  FormStatusPanel,
  defaultStatusContent,
} from "@/components/pages/joinUs/status/FormStatusPanel";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function JoinUsConfirm({ params }: PageProps) {
  const { slug } = await params;

  const link = await findValidLink(slug);
  if (!link || !link.Id) {
    redirect("/join-us");
  }

  const user = await findUserById(link.User.Id);
  if (!user) {
    redirect("/join-us");
  }

  await updateUserVerified(user.Id!, true);
  await expireLink(link.Id);

  const { statusContent, whatsappLink } = await getJoinUsFormProps();
  const resolvedContent = statusContent ?? defaultStatusContent;

  return (
    <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Join the <span className="text-primary italic">Movement</span>
          </h1>
          <p className="text-lg text-muted-foreground font-serif leading-relaxed mb-8">
            Democracy requires participation. Your voice matters. Sign up to
            volunteer, receive updates, and connect with our national community.
          </p>
        </div>

        <Card className="bg-card/90 backdrop-blur-sm border-white/10 shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center text-center px-6 py-8 space-y-4">
            <FormStatusPanel
              variant="signUp"
              content={resolvedContent}
              whatsappLink={whatsappLink}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
