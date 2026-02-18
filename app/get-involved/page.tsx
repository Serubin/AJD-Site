"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, Send, RefreshCw } from "lucide-react";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf";
import { toE164, parseStoredPhone } from "@/lib/phone";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StateMultiSelect } from "@/components/pages/getInvolved/StateMultiSelect";
import { CongressionalDistrictInput } from "@/components/pages/getInvolved/CongressionalDistrictInput";
import { PhoneInput } from "@/components/pages/getInvolved/PhoneInput";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  states?: string;
  congressionalDistrict?: string;
}

interface ExistingUser {
  id: number;
}

export default function GetInvolved() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [isLooking, setIsLooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [existingUser, setExistingUser] = useState<ExistingUser | null>(null);

  // Controlled form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("1");
  const [phoneNational, setPhoneNational] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [congressionalDistrict, setCongressionalDistrict] = useState("");

  const isUpdateMode = existingUser !== null;

  const resetForm = useCallback(() => {
    setName("");
    setEmail("");
    setPhoneCountryCode("1");
    setPhoneNational("");
    setStates([]);
    setCongressionalDistrict("");
    setExistingUser(null);
    setSuccess(false);
    setErrors({});
  }, []);

  /**
   * Look up an existing user by the current email/phone values.
   * Called on blur of either field. Phone is sent as E.164.
   */
  const handleLookup = useCallback(
    async (currentEmail: string, currentCountryCode: string, currentNational: string) => {
      const normalizedPhone = toE164(currentCountryCode, currentNational);
      if (!currentEmail.trim() && !normalizedPhone) return;

      const params = new URLSearchParams();
      if (currentEmail.trim()) params.set("email", currentEmail.trim());
      if (normalizedPhone) params.set("phone", normalizedPhone);

      setIsLooking(true);
      try {
        const res = await fetch(`/api/users?${params.toString()}`);
        if (!res.ok) return; // No match found or error — just stay in create mode

        const { user } = await res.json();
        if (!user) return;

        const { countryCode, nationalDigits } = parseStoredPhone(user.Phone ?? "");

        setName(user.Name ?? "");
        setEmail(user.Email ?? "");
        setPhoneCountryCode(countryCode);
        setPhoneNational(nationalDigits);
        setStates(user.States ? user.States.split(",").filter(Boolean) : []);
        setCongressionalDistrict(user.CongressionalDistrict ?? "");
        setExistingUser({ id: user.Id });
        setSuccess(false);

        toast({
          title: "Record Found",
          description: "We found your existing record. Update your info and click Update.",
          className: "bg-blue-900 border-blue-800 text-white",
        });
      } catch {
        // Silently ignore lookup failures — user can still sign up normally
      } finally {
        setIsLooking(false);
      }
    },
    [toast]
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsPending(true);

    const phone = toE164(phoneCountryCode, phoneNational);

    // Client-side validation
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!phone) {
      newErrors.phone =
        phoneCountryCode === "1" && phoneNational.length > 0
          ? "Enter a valid 10-digit number"
          : "Phone number is required";
    }
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

    const payload = { name, email, phone, states, congressionalDistrict };

    try {
      const res = await fetch("/api/users", {
        method: isUpdateMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: csrfToken ?? "",
        },
        body: JSON.stringify(
          isUpdateMode ? { id: existingUser.id, ...payload } : payload
        ),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || (isUpdateMode ? "Failed to update" : "Failed to sign up"));
      }

      setSuccess(true);
      toast({
        title: isUpdateMode ? "Updated!" : "Signed Up!",
        description: isUpdateMode
          ? "Your information has been updated successfully."
          : "Thank you for signing up. We will be in touch shortly.",
        className: "bg-green-900 border-green-800 text-white",
      });
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
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
                <CardTitle className="text-white font-display text-2xl">
                  {isUpdateMode ? "Update Info" : "Sign Up"}
                </CardTitle>
                <CardDescription>
                  {isUpdateMode
                    ? "Update your information below."
                    : "Fill out the form below to get started."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/80">Full Name</Label>
                    <Input 
                      id="name"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleLookup(email, phoneCountryCode, phoneNational)}
                        placeholder="jane@example.com" 
                        className="bg-background/50 border-white/10 text-white placeholder:text-white/30" 
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>
                    <PhoneInput
                      countryCode={phoneCountryCode}
                      nationalDigits={phoneNational}
                      onCountryChange={setPhoneCountryCode}
                      onNationalChange={setPhoneNational}
                      onBlur={() => handleLookup(email, phoneCountryCode, phoneNational)}
                      error={errors.phone}
                      className="space-y-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/80">State(s)</Label>
                    <StateMultiSelect
                      name="states"
                      value={states}
                      onChange={setStates}
                      error={errors.states}
                    />
                  </div>

                  <CongressionalDistrictInput
                    value={congressionalDistrict}
                    onDistrictChange={setCongressionalDistrict}
                    error={errors.congressionalDistrict}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-background font-bold h-12 mt-2"
                    disabled={isPending || isLooking || success}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isLooking ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : success ? (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    ) : isUpdateMode ? (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {isPending
                      ? "Submitting..."
                      : isLooking
                        ? "Looking up..."
                        : success
                          ? (isUpdateMode ? "Updated!" : "Signed Up!")
                          : isUpdateMode
                            ? "Update"
                            : "Sign Up"}
                  </Button>

                  {isUpdateMode && !isPending && !success && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full text-sm text-muted-foreground hover:text-white transition-colors mt-1"
                    >
                      or sign up as a new person
                    </button>
                  )}
                </form>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </main>
    </>
  );
}
