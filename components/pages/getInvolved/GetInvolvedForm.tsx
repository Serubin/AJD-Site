"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, RefreshCw } from "lucide-react";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf";
import { toE164 } from "@/lib/phone";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StateMultiSelect } from "@/components/pages/getInvolved/fields/StateMultiSelect";
import { CongressionalDistrictInput } from "@/components/pages/getInvolved/fields/CongressionalDistrictInput";
import { PhoneInput } from "@/components/pages/getInvolved/fields/PhoneInput";
import {
  FormStatusPanel,
  defaultStatusContent,
  type StatusPanelContent,
} from "@/components/pages/getInvolved/status/FormStatusPanel";

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  states?: string;
  congressionalDistrict?: string;
}

export interface GetInvolvedFormInitialData {
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNational: string;
  states: string[];
  congressionalDistrict: string;
}

interface GetInvolvedFormProps {
  mode: "create" | "update";
  initialData?: GetInvolvedFormInitialData;
  slug?: string;
  statusContent?: StatusPanelContent;
  whatsappLink?: string;
}

function getCsrfToken(): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`))
      ?.split("=")[1] ?? ""
  );
}

export function GetInvolvedForm({ mode, initialData, slug, statusContent, whatsappLink }: GetInvolvedFormProps) {
  const resolvedStatusContent = statusContent ?? defaultStatusContent;
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [existingUserFound, setExistingUserFound] = useState(false);

  const isUpdateMode = mode === "update";

  // Controlled form fields
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    initialData?.phoneCountryCode ?? "1"
  );
  const [phoneNational, setPhoneNational] = useState(
    initialData?.phoneNational ?? ""
  );
  const [states, setStates] = useState<string[]>(initialData?.states ?? []);
  const [congressionalDistrict, setCongressionalDistrict] = useState(
    initialData?.congressionalDistrict ?? ""
  );

  const lookupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupArgsRef = useRef<{
    email: string;
    phoneCountryCode: string;
    phoneNational: string;
  }>({ email: "", phoneCountryCode: "1", phoneNational: "" });

  /**
   * Check if a user exists by the current email/phone values.
   * If found, immediately request the presigned update link (no confirmation dialog).
   */
  const handleLookup = useCallback(
    async (
      currentEmail: string,
      currentCountryCode: string,
      currentNational: string
    ) => {
      if (isUpdateMode) return;

      const normalizedPhone = toE164(currentCountryCode, currentNational);
      if (!currentEmail.trim() && !normalizedPhone) return;

      const params = new URLSearchParams();
      if (currentEmail.trim()) params.set("email", currentEmail.trim());
      if (normalizedPhone) params.set("phone", normalizedPhone);

      try {
        const res = await fetch(`/api/users?${params.toString()}`, {
          headers: { [CSRF_HEADER_NAME]: getCsrfToken() },
        });
        if (!res.ok) return;

        const data = await res.json();
        if (!data.found) return;

        setIsPending(true);
        try {
          const linkRes = await fetch("/api/presigned-links", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              [CSRF_HEADER_NAME]: getCsrfToken(),
            },
            body: JSON.stringify({
              email: currentEmail.trim() || undefined,
              phone: normalizedPhone || undefined,
            }),
          });

          if (!linkRes.ok) {
            throw new Error("Failed to send update link");
          }

          setExistingUserFound(true);
        } catch {
          toast({
            title: "Something went wrong",
            description: "We couldn't send the update link. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsPending(false);
        }
      } catch {
        // Silently ignore lookup failures -- user can still sign up normally
      }
    },
    [isUpdateMode, toast]
  );

  const scheduleLookup = useCallback(
    (em: string, phoneCountryCode: string, phoneNational: string) => {
      if (isUpdateMode || existingUserFound) return;
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
        lookupTimeoutRef.current = null;
      }
      lookupArgsRef.current = { email: em, phoneCountryCode, phoneNational };
      lookupTimeoutRef.current = setTimeout(() => {
        const { email: e, phoneCountryCode: cc, phoneNational: nat } =
          lookupArgsRef.current;
        handleLookup(e, cc, nat);
        lookupTimeoutRef.current = null;
      }, 400);
    },
    [isUpdateMode, existingUserFound, handleLookup]
  );

  const flushLookup = useCallback(() => {
    if (existingUserFound) return;
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
      lookupTimeoutRef.current = null;
    }
    handleLookup(email, phoneCountryCode, phoneNational);
  }, [email, phoneCountryCode, phoneNational, existingUserFound, handleLookup]);

  useEffect(() => {
    return () => {
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
        lookupTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsPending(true);

    const phone = toE164(phoneCountryCode, phoneNational);

    // Client-side validation
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (phoneCountryCode === "1" && phoneNational.length > 0 && !phone) {
      newErrors.phone = "Enter a valid 10-digit number";
    }
    if (states.length === 0)
      newErrors.states = "At least one state is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsPending(false);
      return;
    }

    const csrfToken = getCsrfToken();
    const payload = {
      name,
      email,
      phone: phone || "",
      states,
      congressionalDistrict,
    };

    try {
      let res: Response;

      if (isUpdateMode && slug) {
        res = await fetch("/api/presigned-links", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            [CSRF_HEADER_NAME]: csrfToken,
          },
          body: JSON.stringify({ slug, ...payload }),
        });
      } else {
        res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            [CSRF_HEADER_NAME]: csrfToken,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error ||
            (isUpdateMode ? "Failed to update" : "Failed to sign up")
        );
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
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
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
            Democracy requires participation. Your voice matters. Sign up to
            volunteer, receive updates, and connect with our national community.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-bold text-primary">1</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg font-display">
                  Stay Informed
                </h3>
                <p className="text-muted-foreground text-sm">
                  Receive our weekly newsletter with critical updates on
                  legislation.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-bold text-primary">2</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg font-display">
                  Volunteer
                </h3>
                <p className="text-muted-foreground text-sm">
                  Join phone banks, text campaigns, and local canvassing
                  efforts.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="font-bold text-primary">3</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg font-display">
                  Join Our Community
                </h3>
                <p className="text-muted-foreground text-sm">
                  Participate in our community chat and get updates on our
                  latest campaigns.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative">
            {(success || existingUserFound) && (
              <Card className="absolute inset-0 bg-card/90 backdrop-blur-sm border-white/10 shadow-2xl z-10 overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center text-center h-full px-6 space-y-4 overflow-y-auto">
                  <FormStatusPanel
                    variant={
                      existingUserFound && !success
                        ? "linkSent"
                        : isUpdateMode
                          ? "update"
                          : "signUp"
                    }
                    content={resolvedStatusContent}
                    whatsappLink={whatsappLink}
                  />
                </CardContent>
              </Card>
            )}
            <Card className={`bg-card/90 backdrop-blur-sm border-white/10 shadow-2xl ${success || existingUserFound ? "invisible" : ""}`}>
              <CardHeader>
                <CardTitle className="text-white font-display text-2xl">
                  {isUpdateMode ? "Update Info" : "Sign Up"}
                </CardTitle>
                <CardDescription>
                  {isUpdateMode
                    ? "Update your information below."
                    : "Fill out the form below to get started. Or update your information by entering your email or phone number."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/80">
                      Full Name
                    </Label>
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
                      <Label htmlFor="email" className="text-white/80">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          scheduleLookup(
                            e.target.value,
                            phoneCountryCode,
                            phoneNational
                          );
                        }}
                        onBlur={flushLookup}
                        placeholder="jane@example.com"
                        className="bg-background/50 border-white/10 text-white placeholder:text-white/30"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <PhoneInput
                      countryCode={phoneCountryCode}
                      nationalDigits={phoneNational}
                      onCountryChange={(code) => {
                        setPhoneCountryCode(code);
                        scheduleLookup(email, code, phoneNational);
                      }}
                      onNationalChange={(digits) => {
                        setPhoneNational(digits);
                        scheduleLookup(email, phoneCountryCode, digits);
                      }}
                      onBlur={flushLookup}
                      error={errors.phone}
                      optional
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
                    optional
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-background font-bold h-12 mt-2"
                    disabled={isPending || existingUserFound}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isUpdateMode ? (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {isPending
                      ? "Submitting..."
                      : isUpdateMode
                        ? "Update"
                        : "Sign Up"}
                  </Button>

                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
