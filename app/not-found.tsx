import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 bg-card/50 border-white/10">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <Link href="/" className="block mt-6">
            <Button variant="outline" className="w-full border-primary/30 hover:border-primary hover:bg-primary/10">
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
