// => KATA 06 target: a render helper that always provides the theme.
// => Components keep reading context: tests stop forgetting the provider.
import React, { createContext, useContext } from "react";
// => Context pair: unchanged, the fix is in how tests mount.

// => Theme value: the two modes the badge switches between.
export type Theme = "light" | "dark";

// => ThemeContext: null default, still loud when truly missing.
export const ThemeContext = createContext<Theme | null>(null);

// => ThemedBadge: reads the theme, renders the attribute.
export function ThemedBadge({ label }: { label: string }): React.JSX.Element {
  // => Label prop: the accessible name the suite queries.
  const theme = useContext(ThemeContext);
  // => Context read: the helper below guarantees it is never null.
  if (theme === null) throw new Error("ThemedBadge needs a ThemeContext provider");
  // => Guard kept: production misuse still fails loudly.
  return <span data-theme={theme}>{label}</span>;
  // => Theme attribute: asserted per mode in the suite.
}
