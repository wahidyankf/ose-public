// AI BENCHMARK — a labelled native <select>, shared by the substitute finder and the filters.
// Native selects keep keyboard, screen-reader, and phone pickers working with no extra code.

import { ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };
export type SelectGroup = { label: string; options: readonly SelectOption[] };

export type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  /** The empty option's label; it maps to the empty string. */
  emptyLabel: string;
  /** Flat options, or option groups (rendered as <optgroup>). */
  options: readonly SelectOption[] | readonly SelectGroup[];
  onChange: (value: string) => void;
};

function isGrouped(options: SelectFieldProps["options"]): options is readonly SelectGroup[] {
  return options.length > 0 && "options" in (options[0] as object);
}

export function SelectField({ id, label, value, emptyLabel, options, onChange }: SelectFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full min-w-0 appearance-none rounded-md border border-input bg-background py-1 pr-9 pl-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="">{emptyLabel}</option>
          {isGrouped(options)
            ? options.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))
            : options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  );
}
