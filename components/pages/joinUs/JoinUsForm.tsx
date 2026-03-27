"use client";

import { motion } from "framer-motion";
import { Loader2, Send, RefreshCw } from "lucide-react";

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
import { StateMultiSelect } from "@/components/pages/joinUs/fields/StateMultiSelect";
import { CongressionalDistrictInput } from "@/components/pages/joinUs/fields/CongressionalDistrictInput";
import { PhoneInput } from "@/components/pages/joinUs/fields/PhoneInput";
import {
  FormStatusPanel,
  defaultStatusContent,
} from "@/components/pages/joinUs/status/FormStatusPanel";
import { JoinUsHero } from "./JoinUsHero";
import { useJoinUsForm } from "./useJoinUsForm";
import type { JoinUsFormProps } from "./types";

export type { JoinUsFormInitialData, JoinUsFormProps } from "./types";

function getStatusPanelVariant(
  existingUserFound: boolean,
  success: boolean,
  isUpdateMode: boolean,
): "signUp" | "update" | "linkSent" | "confirmEmail" {
  if (existingUserFound && !success) return "linkSent";
  if (isUpdateMode) return "update";
  if (!isUpdateMode && success) return "confirmEmail";
  return "signUp";
}

function FormCardHeader({ isUpdateMode }: { isUpdateMode: boolean }) {
  const title = isUpdateMode ? "Update Info" : "Sign Up";
  const description = isUpdateMode
    ? "Update your information below."
    : "Fill out the form below to get started. Or update your information by entering your email or phone number.";

  return (
    <CardHeader>
      <CardTitle className="text-white font-display text-2xl">
        {title}
      </CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}

function SubmitButtonContent({
  isPending,
  isUpdateMode,
}: {
  isPending: boolean;
  isUpdateMode: boolean;
}) {
  if (isPending) {
    return (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Submitting...
      </>
    );
  }
  if (isUpdateMode) {
    return (
      <>
        <RefreshCw className="mr-2 h-4 w-4" />
        Update
      </>
    );
  }
  return (
    <>
      <Send className="mr-2 h-4 w-4" />
      Sign Up
    </>
  );
}

export function JoinUsForm({ mode, initialData, slug, statusContent, whatsappLink }: JoinUsFormProps) {
  const resolvedStatusContent = statusContent ?? defaultStatusContent;

  const {
    formRef,
    isUpdateMode,
    name, setName,
    email, setEmail,
    phoneCountryCode, setPhoneCountryCode,
    phoneNational, setPhoneNational,
    states, setStates,
    congressionalDistrict, setCongressionalDistrict,
    errors,
    isPending,
    success,
    existingUserFound,
    handleSubmit,
    scheduleLookup,
    flushLookup,
  } = useJoinUsForm({ mode, initialData, slug });

  const baseCardClass =
    "bg-card/90 backdrop-blur-sm border-white/10 shadow-2xl";
  const cardClassName =
    success || existingUserFound ? `${baseCardClass} invisible` : baseCardClass;

  return (
    <main className="flex-grow pt-32 pb-20 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <JoinUsHero />

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
                    variant={getStatusPanelVariant(
                      existingUserFound,
                      success,
                      isUpdateMode,
                    )}
                    content={resolvedStatusContent}
                    whatsappLink={whatsappLink}
                  />
                </CardContent>
              </Card>
            )}
            <Card className={cardClassName}>
              <FormCardHeader isUpdateMode={isUpdateMode} />
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
                            phoneNational,
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
                    <SubmitButtonContent
                      isPending={isPending}
                      isUpdateMode={isUpdateMode}
                    />
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
