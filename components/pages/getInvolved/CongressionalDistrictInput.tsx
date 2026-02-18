"use client";

import { useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LocationPermissionDialog } from "@/components/pages/getInvolved/LocationPermissionDialog";

interface CongressionalDistrictInputProps {
  error?: string;
  onDistrictChange?: (value: string) => void;
}

export function CongressionalDistrictInput({ error, onDistrictChange }: CongressionalDistrictInputProps) {
  const { toast } = useToast();
  const districtRef = useRef<HTMLInputElement>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const handleDistrictLookup = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unavailable",
        description: "Your browser does not support geolocation.",
        variant: "destructive",
      });
      return;
    }

    const permission = await navigator.permissions.query({ name: "geolocation" });
    if (permission.state !== "granted") {
      setShowLocationDialog(true);
    }

    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      setShowLocationDialog(false);

      const { latitude, longitude } = position.coords;

      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrf_token="))
        ?.split("=")[1];

      const res = await fetch(
        `/api/congressional-district?lat=${latitude}&lng=${longitude}`,
        { headers: { "x-csrf-token": csrfToken ?? "" } }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to look up congressional district");
      }

      const { district } = await res.json();

      if (districtRef.current) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value"
        )?.set;
        nativeInputValueSetter?.call(districtRef.current, district);
        districtRef.current.dispatchEvent(new Event("input", { bubbles: true }));
      }
      onDistrictChange?.(district);
    } catch (err) {
      setShowLocationDialog(false);
      const message =
        err instanceof GeolocationPositionError
          ? "Location access was denied. Please enter your district manually."
          : err instanceof Error
            ? err.message
            : "An unexpected error occurred";
      toast({
        title: "District Lookup Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="congressionalDistrict" className="text-white/80">Congressional District</Label>
        <div className="relative">
          <Input
            ref={districtRef}
            id="congressionalDistrict"
            name="congressionalDistrict"
            placeholder="e.g. CA-12"
            className="bg-background/50 border-white/10 text-white placeholder:text-white/30 pr-9"
            onChange={(e) => onDistrictChange?.(e.target.value)}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={handleDistrictLookup}
                  disabled={isLocating}
                  className="text-white/50 hover:text-primary transition-colors disabled:opacity-50"
                  aria-label="Look up congressional district"
                >
                  {isLocating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Use your current location to estimate congressional district</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      <LocationPermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
      />
    </>
  );
}
