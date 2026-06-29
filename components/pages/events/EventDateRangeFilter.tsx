"use client";

import { useMemo } from "react";
import { format, startOfToday, addDays, endOfWeek, endOfMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRange {
  from?: Date;
  to?: Date;
}

interface Props {
  value: DateRange;
  onChange: (next: DateRange) => void;
}

function formatLabel(value: DateRange): string {
  const { from, to } = value;
  if (!from && !to) return "Any date";
  if (from && !to) return `From ${format(from, "MMM d")}`;
  if (!from && to) return `Until ${format(to, "MMM d")}`;
  if (from && to) {
    const sameYear = from.getFullYear() === to.getFullYear();
    const left = format(from, sameYear ? "MMM d" : "MMM d, yyyy");
    const right = format(to, "MMM d, yyyy");
    return `${left} – ${right}`;
  }
  return "Any date";
}

export function EventDateRangeFilter({ value, onChange }: Props) {
  const today = useMemo(() => startOfToday(), []);

  function setPreset(preset: "any" | "week" | "month" | "next30") {
    if (preset === "any") return onChange({});
    if (preset === "week") {
      return onChange({ from: today, to: endOfWeek(today, { weekStartsOn: 0 }) });
    }
    if (preset === "month") {
      return onChange({ from: today, to: endOfMonth(today) });
    }
    return onChange({ from: today, to: addDays(today, 30) });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-56 justify-start bg-card/50 text-inherit"
          style={{ borderColor: "rgba(255, 255, 255, .1)" }}
        >
          <CalendarIcon className="w-4 h-4 mr-2 shrink-0" />
          <span className="truncate">{formatLabel(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button variant="ghost" size="sm" onClick={() => setPreset("any")}>
            Any date
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPreset("week")}>
            This week
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPreset("month")}>
            This month
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPreset("next30")}>
            Next 30 days
          </Button>
        </div>
        <Calendar
          mode="range"
          selected={value.from ? { from: value.from, to: value.to } : undefined}
          onSelect={(range) =>
            onChange({ from: range?.from, to: range?.to })
          }
          disabled={{ before: today }}
          numberOfMonths={1}
        />
      </PopoverContent>
    </Popover>
  );
}
