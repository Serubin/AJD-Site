import Link from "next/link";

export function Footer({ tagline }: { tagline: string }) {
  return (
    <footer className="py-12 border-t border-white/10 bg-black/20 text-center">
      <div className="container mx-auto px-4">
        <h3 className="font-display text-xl mb-4 text-white/90">American Jews for Democracy</h3>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-8 font-serif leading-relaxed">
          {tagline}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-muted-foreground/60">
          <Link href="/privacy" className="hover:text-muted-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-muted-foreground transition-colors">
            Terms and Conditions
          </Link>
          <span>&copy; {new Date().getFullYear()} AJD</span>
        </div>
      </div>
    </footer>
  );
}
