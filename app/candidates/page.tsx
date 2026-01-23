"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

// Placeholder data
const candidates = [
  {
    id: 1,
    name: "Sarah Davidson",
    office: "U.S. Senate",
    district: "Statewide",
    status: "Endorsed",
    bio: "Championing voting rights and judicial independence across the state.",
    priorities: ["Voting Rights", "Climate Action", "Education"]
  },
  {
    id: 2,
    name: "Michael Chen",
    office: "House of Representatives",
    district: "District 14",
    status: "Supported",
    bio: "A pragmatic voice focused on unifying communities and fostering economic growth.",
    priorities: ["Healthcare", "Small Business", "Civil Rights"]
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    office: "Attorney General",
    district: "Statewide",
    status: "Endorsed",
    bio: "Dedicated to upholding the rule of law and protecting our democratic institutions.",
    priorities: ["Rule of Law", "Consumer Protection", "Public Safety"]
  },
  {
    id: 4,
    name: "David Miller",
    office: "State Assembly",
    district: "District 22",
    status: "Endorsed",
    bio: "Fighting for equitable housing and transparent governance in our local assembly.",
    priorities: ["Housing", "Transparency", "Transit"]
  },
];

export default function Candidates() {
  return (
    <>
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Endorsed Candidates
            </h1>
            <p className="text-muted-foreground font-serif max-w-2xl mx-auto text-lg">
              We support leaders who demonstrate an unwavering commitment to democratic principles and the rule of law.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {candidates.map((candidate, idx) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full bg-card/50 border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10">
                        {candidate.office}
                      </Badge>
                      <Badge className="bg-green-900/40 text-green-400 hover:bg-green-900/60 border-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {candidate.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-display text-white group-hover:text-primary transition-colors">
                      {candidate.name}
                    </CardTitle>
                    <CardDescription className="text-white/60 font-medium">
                      {candidate.district}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6 font-serif text-sm leading-relaxed">
                      {candidate.bio}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.priorities.map((tag) => (
                        <span 
                          key={tag} 
                          className="px-2 py-1 rounded bg-white/5 text-xs text-white/70 border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
