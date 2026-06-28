import { Card, CardContent } from "@/components/ui/card";
import { UnsubscribeForm } from "@/components/pages/unsubscribe/UnsubscribeForm";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function UnsubscribePage({ params }: PageProps) {
  const { token } = await params;
  const payload = verifyUnsubscribeToken(token);

  return (
    <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 flex items-center justify-center">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border-white/10 shadow-2xl">
        <CardContent className="px-6 py-8 space-y-4 text-center">
          <h1 className="text-2xl font-display font-bold text-white">
            Manage your emails
          </h1>
          {payload ? (
            <UnsubscribeForm token={token} />
          ) : (
            <p className="text-muted-foreground font-serif">
              This unsubscribe link is invalid or has expired. Please use the
              link from a recent email.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
