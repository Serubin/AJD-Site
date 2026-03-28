import { getCandidates } from "@/lib/candidates";
import { CandidateCards } from "@/components/pages/candidates/CandidateCards";

export default async function CandidatesPage() {
  const candidates = await getCandidates();

  return (
    <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Endorsed Candidates
          </h1>
          <p className="text-muted-foreground font-serif max-w-2xl mx-auto text-lg">
            We support leaders who demonstrate an unwavering commitment to
            democratic principles and the rule of law.
          </p>
        </div>

        <CandidateCards candidates={candidates} />
      </div>
    </main>
  );
}
