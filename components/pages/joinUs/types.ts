import type { StatusPanelContent } from "@/components/pages/joinUs/status/FormStatusPanel";

export interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  states?: string;
  congressionalDistrict?: string;
}

export interface JoinUsFormInitialData {
  name: string;
  email: string;
  phoneCountryCode: string;
  phoneNational: string;
  states: string[];
  congressionalDistrict: string;
}

export interface JoinUsFormProps {
  mode: "create" | "update";
  initialData?: JoinUsFormInitialData;
  slug?: string;
  statusContent?: StatusPanelContent;
  whatsappLink?: string;
}
