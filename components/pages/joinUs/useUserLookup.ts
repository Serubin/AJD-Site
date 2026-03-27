import { useState, useRef, useCallback, useEffect } from "react";
import { getCsrfToken, CSRF_HEADER_NAME } from "@/lib/csrf";
import { toE164 } from "@/lib/phone";
import { useToast } from "@/hooks/use-toast";
import { usePlausible } from "next-plausible";

interface UseUserLookupOptions {
  enabled: boolean;
}

export function useUserLookup({ enabled }: UseUserLookupOptions) {
  const { toast } = useToast();
  const plausible = usePlausible();
  const [existingUserFound, setExistingUserFound] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const lookupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupArgsRef = useRef<{
    email: string;
    phoneCountryCode: string;
    phoneNational: string;
  }>({ email: "", phoneCountryCode: "1", phoneNational: "" });

  const handleLookup = useCallback(
    async (
      currentEmail: string,
      currentCountryCode: string,
      currentNational: string,
    ) => {
      if (!enabled) return;

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

        setIsLookingUp(true);
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
          plausible("user-data-update-link-sent");
          setExistingUserFound(true);
        } catch (err) {
          toast({
            title: "Something went wrong",
            description: "We couldn't send the update link. Please try again.",
            variant: "destructive",
          });
          plausible("user-data-update-link-failed", {
            props: { error: err instanceof Error ? err.message : "Unknown error" },
          });
        } finally {
          setIsLookingUp(false);
        }
      } catch {
        // Silently ignore lookup failures -- user can still sign up normally
      }
    },
    [enabled, toast, plausible],
  );

  const scheduleLookup = useCallback(
    (email: string, phoneCountryCode: string, phoneNational: string) => {
      if (!enabled || existingUserFound) return;
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
        lookupTimeoutRef.current = null;
      }
      lookupArgsRef.current = { email, phoneCountryCode, phoneNational };
      lookupTimeoutRef.current = setTimeout(() => {
        const { email: e, phoneCountryCode: cc, phoneNational: nat } =
          lookupArgsRef.current;
        handleLookup(e, cc, nat);
        lookupTimeoutRef.current = null;
      }, 400);
    },
    [enabled, existingUserFound, handleLookup],
  );

  const flushLookup = useCallback(
    (email: string, countryCode: string, national: string) => {
      if (existingUserFound) return;
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
        lookupTimeoutRef.current = null;
      }
      handleLookup(email, countryCode, national);
    },
    [existingUserFound, handleLookup],
  );

  useEffect(() => {
    return () => {
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
        lookupTimeoutRef.current = null;
      }
    };
  }, []);

  return { existingUserFound, isLookingUp, scheduleLookup, flushLookup };
}
