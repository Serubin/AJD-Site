"use client";

import { CheckCircle, Mail } from "lucide-react";
import { CopyText } from "@/components/ui/copy-text";

export type { StatusPanelContent } from "./statusPanelContent";
export { defaultStatusContent } from "./statusPanelContent";
import type { StatusPanelContent } from "./statusPanelContent";

interface FormStatusPanelProps {
  variant: "signUp" | "update" | "linkSent";
  content: StatusPanelContent;
  whatsappLink?: string;
}

function getTitle(
  variant: FormStatusPanelProps["variant"],
  content: StatusPanelContent
): string {
  if (variant === "signUp") return content.signUpTitle;
  if (variant === "update") return content.updateTitle;
  return content.linkSentTitle;
}

function getBody(
  variant: FormStatusPanelProps["variant"],
  content: StatusPanelContent
): string {
  if (variant === "signUp") return content.signUpBody;
  if (variant === "update") return content.updateBody;
  return content.linkSentBody;
}

function StatusIcon({ variant }: { variant: FormStatusPanelProps["variant"] }) {
  if (variant === "linkSent") {
    return (
      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-900/40">
        <Mail className="h-8 w-8 text-blue-400" />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-green-900/40">
      <CheckCircle className="h-8 w-8 text-green-400" />
    </div>
  );
}

export function FormStatusPanel({ variant, content, whatsappLink }: FormStatusPanelProps) {
  const isLinkSent = variant === "linkSent";
  const showWhatsapp = !isLinkSent && !!whatsappLink;

  return (
    <>
      <StatusIcon variant={variant} />
      <h2 className="text-2xl font-display font-bold text-white">
        {getTitle(variant, content)}
      </h2>
      <p className="text-muted-foreground font-serif leading-relaxed max-w-sm">
        {getBody(variant, content)}
      </p>
      {showWhatsapp && (
        <CopyText
          value={whatsappLink}
          className="w-full max-w-sm"
          inputClassName="bg-background/50 border-white/10 text-white cursor-text"
        />
      )}
    </>
  );
}
