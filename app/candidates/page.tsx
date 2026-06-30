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

        <p className="text-muted-foreground/70 font-serif text-sm max-w-3xl mx-auto text-center mt-16">
          Endorsements published on this website represent the independent
          views of American Jews for Democracy and are not made on behalf of or
          in coordination with any candidate, campaign, political party, or
          committee. Unless otherwise noted, no candidate has requested,
          approved, or authorized these endorsements.
        </p>
      </div>
    </main>
  );
}
