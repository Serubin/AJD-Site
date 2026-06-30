import { useState, useRef, useCallback, useEffect } from "react";
import { csrfFetch } from "@/lib/csrf";
import { toE164 } from "@/lib/phone";
import { usePlausible } from "next-plausible";

interface UseUserLookupOptions {
  enabled: boolean;
}

export function useUserLookup({ enabled }: UseUserLookupOptions) {
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
        const res = await csrfFetch(`/api/users?${params.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!data.found) return;

        setIsLookingUp(true);
        try {
          const linkRes = await csrfFetch("/api/presigned-links", {
            method: "POST",
            body: JSON.stringify({
              email: currentEmail.trim() || undefined,
              phone: normalizedPhone || undefined,
            }),
          });

          // Only surface the "we sent you a link" panel when a link was actually
          // delivered. If it couldn't be delivered (e.g. SMS is the user's only
          // channel and it's disabled) or the request failed, silently no-op so
          // the user can keep signing up normally -- no error, no panel.
          if (!linkRes.ok) return;
          const linkData = await linkRes.json();
          if (!linkData.delivered) return;

          plausible("user-data-update-link-sent");
          setExistingUserFound(true);
        } finally {
          setIsLookingUp(false);
        }
      } catch {
        // Silently ignore lookup failures -- user can still sign up normally
      }
    },
    [enabled, plausible],
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
