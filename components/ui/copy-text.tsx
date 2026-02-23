"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CopyTextProps {
  value: string;
  className?: string;
  inputClassName?: string;
  customOnClick?: () => void;
}

export function CopyText({ value, className, inputClassName, customOnClick }: CopyTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      customOnClick?.();
    } catch {
      // Fallback: select the input text (caller may trigger via input onClick)
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        readOnly
        value={value}
        onClick={(e) => {
          (e.target as HTMLInputElement).select();
          handleCopy();
        }}
        className={cn("pr-10 cursor-text", inputClassName)}
      />
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
        aria-label={copied ? "Copied" : "Copy"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
