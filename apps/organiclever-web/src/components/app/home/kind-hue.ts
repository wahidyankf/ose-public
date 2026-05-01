import type { Hue } from "@/lib/journal/typed-payloads";

export const KIND_HUE: Record<string, Hue> = {
  workout: "teal",
  reading: "plum",
  learning: "honey",
  meal: "terracotta",
  focus: "sky",
};

export function kindToHue(name: string): Hue {
  if (name.startsWith("custom-")) return "sage";
  return KIND_HUE[name] ?? "sage";
}

export const KIND_ICON: Record<string, string> = {
  workout: "dumbbell",
  reading: "calendar",
  learning: "zap",
  meal: "clock",
  focus: "timer",
};

export function kindToIcon(name: string): string {
  if (name.startsWith("custom-")) return "plus-circle";
  return KIND_ICON[name] ?? "plus-circle";
}

export const ENTRY_MODULES = [
  { id: "workout", label: "Workout", icon: "dumbbell", hue: "teal" as Hue },
  { id: "reading", label: "Reading", icon: "calendar", hue: "plum" as Hue },
  { id: "learning", label: "Learning", icon: "zap", hue: "honey" as Hue },
  { id: "meal", label: "Meal", icon: "clock", hue: "terracotta" as Hue },
  { id: "focus", label: "Focus", icon: "timer", hue: "sky" as Hue },
] as const;
