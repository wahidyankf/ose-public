"use client";

import { cn } from "../../utils/cn";

export interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ value, onChange, label, disabled = false }: ToggleProps) {
  const button = (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-[28px] w-[48px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        value ? "bg-[var(--hue-teal)]" : "bg-[var(--warm-200)]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-[1px] h-[22px] w-[22px] rounded-full bg-white shadow-xs transition-[left] duration-200",
          value ? "left-[21px]" : "left-[1px]",
        )}
      />
    </button>
  );

  if (label) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {button}
      </div>
    );
  }

  return button;
}
