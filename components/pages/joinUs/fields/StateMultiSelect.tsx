"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
] as const;

interface StateMultiSelectProps {
  name?: string;
  error?: string;
  value?: string[];
  onChange?: (value: string[]) => void;
}

/**
 * Multi-select for US states (including DC).
 *
 * How it works: Click the field to open the list, type to search by state name or code,
 * then click a state to add it. The menu closes after each selection; open it again to
 * add more. Remove a state by clicking the X on its badge.
 */
export function StateMultiSelect({ name = "states", error, value, onChange }: StateMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<string[]>(value ?? []);

  // Sync internal state when controlled value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setSelected(value);
    }
  }, [value]);

  const toggle = (val: string) => {
    const next = selected.includes(val)
      ? selected.filter((v) => v !== val)
      : [...selected, val];
    setSelected(next);
    onChange?.(next);
    setOpen(false);
    setSearch("");
  };

  const remove = (val: string) => {
    const next = selected.filter((v) => v !== val);
    setSelected(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-2">
      {/* Hidden inputs for form submission */}
      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-background/50 border-white/10 text-white hover:bg-background/70 hover:text-white h-auto min-h-10",
              !selected.length && "text-white/30"
            )}
            onKeyDown={(e) => {
              if (!open && e.key === "Backspace" && selected.length > 0) {
                e.preventDefault();
                remove(selected[selected.length - 1]);
              }
            }}
          >
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1 py-0.5">
                {selected.map((value) => (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                  >
                    {value}
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-1 rounded-full outline-none hover:text-destructive cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          if (e.key === " ") e.preventDefault();
                          remove(value);
                        }
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
              </div>
            ) : (
              "Select states..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search states..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>No state found.</CommandEmpty>
              <CommandGroup>
                {US_STATES.map((state) => (
                  <CommandItem
                    key={state.value}
                    value={`${state.value} ${state.label}`}
                    onSelect={() => toggle(state.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(state.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="font-mono mr-2">{state.value}</span>
                    {state.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
