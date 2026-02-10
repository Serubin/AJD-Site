"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, Send } from "lucide-react";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StateMultiSelect } from "@/components/StateMultiSelect";
import { CongressionalDistrictInput } from "@/components/pages/getInvolved/CongressionalDistrictInput";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  states?: string;
  congressionalDistrict?: string;
}

export default function GetInvolved() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [resetKey, setResetKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const states = formData.getAll("states") as string[];
    const congressionalDistrict = formData.get("congressionalDistrict") as string;

    // Client-side validation
    const newErrors: FormErrors = {};
    if (!name?.trim()) newErrors.name = "Name is required";
    if (!email?.trim()) newErrors.email = "Email is required";
    if (!phone?.trim()) newErrors.phone = "Phone number is required";
    if (states.length === 0) newErrors.states = "At least one state is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsPending(false);
      return;
    }

    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`))
      ?.split("=")[1];

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: csrfToken ?? "",
        },
        body: JSON.stringify({ name, email, phone, states, congressionalDistrict }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign up");
      }

      setSuccess(true);
      setResetKey((k) => k + 1);
      formRef.current?.reset();
      toast({
        title: "Signed Up!",
        description: "Thank you for signing up. We will be in touch shortly.",
        className: "bg-green-900 border-green-800 text-white",
      });
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: err instanceof Error ? err.message : "Failed to sign up. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Join the <span className="text-primary italic">Movement</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed mb-8">
              Democracy requires participation. Your voice matters. Sign up to volunteer, receive updates, and connect with our national community.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-bold text-primary">1</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg font-display">Stay Informed</h3>
                  <p className="text-muted-foreground text-sm">Receive our weekly newsletter with critical updates on legislation.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-bold text-primary">2</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg font-display">Volunteer</h3>
                  <p className="text-muted-foreground text-sm">Join phone banks, text campaigns, and local canvassing efforts.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="font-bold text-primary">3</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg font-display">Join Our Community</h3>
                  <p className="text-muted-foreground text-sm">Participate in our community chat and get updates on our latest campaigns.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-card/90 backdrop-blur-sm border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white font-display text-2xl">Sign Up</CardTitle>
                <CardDescription>Fill out the form below to get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/80">Full Name</Label>
                    <Input 
                      id="name"
                      name="name" 
                      placeholder="Jane Doe" 
                      className="bg-background/50 border-white/10 text-white placeholder:text-white/30" 
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">Email</Label>
                      <Input 
                        id="email"
                        name="email" 
                        type="email"
                        placeholder="jane@example.com" 
                        className="bg-background/50 border-white/10 text-white placeholder:text-white/30" 
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-white/80">Phone Number</Label>
                      <Input 
                        id="phone"
                        name="phone" 
                        type="tel"
                        placeholder="(555) 555-1234" 
                        className="bg-background/50 border-white/10 text-white placeholder:text-white/30" 
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">State(s)</Label>
                    {/* Changing the key forces React to remount the component,
                        which resets its internal selected-states since
                        formRef.reset() only clears native HTML inputs. */}
                    <StateMultiSelect
                      key={resetKey}
                      name="states"
                      error={errors.states}
                    />
                  </div>

                  <CongressionalDistrictInput
                    error={errors.congressionalDistrict}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-background font-bold h-12 mt-2"
                    disabled={isPending || success}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : success ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {isPending ? "Submitting..." : success ? "Signed Up!" : "Sign Up"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>
    </>
  );
}
