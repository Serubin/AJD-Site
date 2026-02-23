export function Footer({ tagline }: { tagline: string }) {
  return (
    <footer className="py-12 border-t border-white/10 bg-black/20 text-center">
      <div className="container mx-auto px-4">
        <h3 className="font-display text-xl mb-4 text-white/90">American Jews for Democracy</h3>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-8 font-serif leading-relaxed">
          {tagline}
        </p>
        <div className="flex justify-center gap-6 text-sm text-muted-foreground/60">
          <span>&copy; {new Date().getFullYear()} AJD</span>
        </div>
      </div>
    </footer>
  );
}
