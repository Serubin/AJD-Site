"use client";

import { formatNationalUS } from "@/lib/phone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

const COUNTRY_OPTIONS: { code: string; label: string }[] = [
  { code: "1", label: "+1 (US/Canada)" },
];

function getCountryOptions(currentCode: string): { code: string; label: string }[] {
  const hasCurrent = COUNTRY_OPTIONS.some((o) => o.code === currentCode);
  if (hasCurrent || !currentCode) return COUNTRY_OPTIONS;
  return [{ code: currentCode, label: `+${currentCode}` }, ...COUNTRY_OPTIONS];
}

export interface PhoneInputProps {
  countryCode: string;
  nationalDigits: string;
  onCountryChange: (code: string) => void;
  onNationalChange: (digits: string) => void;
  onBlur?: () => void;
  error?: string;
  optional?: boolean;
  id?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * Phone number field with country code selector.
 *
 * How it works: Choose a country from the dropdown, then enter your phone number in the box.
 * The number is formatted automatically (e.g. US style). Only digits are stored.
 */
export function PhoneInput({
  countryCode,
  nationalDigits,
  onCountryChange,
  onNationalChange,
  onBlur,
  error,
  optional,
  id = "phone",
  className,
  inputClassName,
}: PhoneInputProps) {
  const displayValue = formatNationalUS(nationalDigits);
  const handleNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onNationalChange(digits);
  };

  const options = getCountryOptions(countryCode);

  return (
    <div className={className}>
      <Label htmlFor={id} className="text-white/80">
        Phone Number
        {optional && (
          <span className="ml-1.5 font-normal text-white/50">(Optional)</span>
        )}
      </Label>
      <div className="mt-2 flex gap-2">
        <Select
          value={countryCode || "1"}
          onValueChange={onCountryChange}
        >
          <SelectTrigger
            className="w-[72px] shrink-0 bg-background/50 border-white/10 text-white [&>span]:line-clamp-1"
            aria-label="Country code"
          >
            <span>+{countryCode || "1"}</span>
          </SelectTrigger>
          <SelectContent>
            {options.map(({ code, label }) => (
              <SelectItem key={code} value={code} className="text-foreground">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={displayValue}
          onChange={handleNationalChange}
          onBlur={onBlur}
          placeholder="(555) 555-1234"
          className={`flex-1 bg-background/50 border-white/10 text-white placeholder:text-white/30 ${inputClassName ?? ""}`}
          aria-invalid={!!error}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
