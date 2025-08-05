"use client";

import * as React from "react";
import { CalendarIcon, Check, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  date,
  onDateChange,
  className,
}: DatePickerWithRangeProps) {
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleApplyFilter = () => {
    onDateChange?.(tempDate);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setTempDate(undefined);
    onDateChange?.(undefined);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(date);
    setIsOpen(false);
  };

  React.useEffect(() => {
    setTempDate(date);
  }, [date]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Filtrar por fecha (opcional)</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={tempDate?.from}
              numberOfMonths={2}
              selected={tempDate}
              onSelect={setTempDate}
              className="bg-white"
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilter}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpiar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyFilter}
                  className="flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}