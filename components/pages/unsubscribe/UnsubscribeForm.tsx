"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "done" | "error";

export function UnsubscribeForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleUnsubscribe() {
    setStatus("loading");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-white font-serif">
        You have been unsubscribed from our emails. We&apos;re sorry to see you
        go.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground font-serif">
        Click below to stop receiving campaign emails from us.
      </p>
      <Button
        onClick={handleUnsubscribe}
        disabled={status === "loading"}
        className="w-full"
      >
        {status === "loading" ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
      {status === "error" && (
        <p className="text-sm text-red-400">
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
