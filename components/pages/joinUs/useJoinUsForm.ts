import { useState, useRef, useCallback } from "react";
import { getCsrfToken, CSRF_HEADER_NAME } from "@/lib/csrf";
import { toE164 } from "@/lib/phone";
import { useToast } from "@/hooks/use-toast";
import { usePlausible } from "next-plausible";
import type { FormErrors, JoinUsFormInitialData } from "./types";
import { validateForm } from "./validation";
import { useUserLookup } from "./useUserLookup";

interface UseJoinUsFormOptions {
  mode: "create" | "update";
  initialData?: JoinUsFormInitialData;
  slug?: string;
}

export function useJoinUsForm({ mode, initialData, slug }: UseJoinUsFormOptions) {
  const plausible = usePlausible();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const isUpdateMode = mode === "update";

  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    initialData?.phoneCountryCode ?? "1",
  );
  const [phoneNational, setPhoneNational] = useState(
    initialData?.phoneNational ?? "",
  );
  const [states, setStates] = useState<string[]>(initialData?.states ?? []);
  const [congressionalDistrict, setCongressionalDistrict] = useState(
    initialData?.congressionalDistrict ?? "",
  );

  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const {
    existingUserFound,
    isLookingUp,
    scheduleLookup: rawScheduleLookup,
    flushLookup: rawFlushLookup,
  } = useUserLookup({ enabled: !isUpdateMode });

  const scheduleLookup = useCallback(
    (em: string, cc: string, nat: string) => rawScheduleLookup(em, cc, nat),
    [rawScheduleLookup],
  );

  const flushLookup = useCallback(
    () => rawFlushLookup(email, phoneCountryCode, phoneNational),
    [email, phoneCountryCode, phoneNational, rawFlushLookup],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsPending(true);

    const phone = toE164(phoneCountryCode, phoneNational);

    const newErrors = validateForm({
      name,
      email,
      phoneCountryCode,
      phoneNational,
      phone,
      states,
    });
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
        if (res.status === 409 && data.errors && typeof data.errors === "object") {
          setErrors((prev) => ({ ...prev, ...data.errors }));
        }
        const errorMessage = isUpdateMode ? "Failed to update" : "Failed to sign up";
        throw new Error(data.error || errorMessage);
      }

      setSuccess(true);
      if (isUpdateMode) {
        plausible("user-data-update-success");
        toast({
          title: "Updated!",
          description: "Your information has been updated successfully.",
          className: "bg-green-900 border-green-800 text-white",
        });
      } else {
        plausible("user-signup-success");
        toast({
          title: "Signed Up!",
          description: "Thank you for signing up. We will be in touch shortly.",
          className: "bg-green-900 border-green-800 text-white",
        });
      }
    } catch (err) {
      plausible("user-data-failed", {
        props: { error: err instanceof Error ? err.message : "Unknown error" },
      });
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

  return {
    formRef,
    isUpdateMode,

    name,
    setName,
    email,
    setEmail,
    phoneCountryCode,
    setPhoneCountryCode,
    phoneNational,
    setPhoneNational,
    states,
    setStates,
    congressionalDistrict,
    setCongressionalDistrict,

    errors,
    isPending: isPending || isLookingUp,
    success,
    existingUserFound,

    handleSubmit,
    scheduleLookup,
    flushLookup,
  };
}
