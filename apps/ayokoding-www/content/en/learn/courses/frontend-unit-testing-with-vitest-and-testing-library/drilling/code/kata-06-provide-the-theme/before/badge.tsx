// => KATA 06 starting point: the badge needs a theme that is not there.
// => Rendering without the provider throws: context defaults to null.
import React, { createContext, useContext } from "react";
// => Context pair: the provider the before-test forgets to mount.

// => Theme value: the two modes the badge switches between.
export type Theme = "light" | "dark";

// => ThemeContext: null default, so missing providers fail LOUDLY.
export const ThemeContext = createContext<Theme | null>(null);

// => ThemedBadge: reads the theme, crashes honestly without it.
export function ThemedBadge({ label }: { label: string }): React.JSX.Element {
  // => Label prop: the accessible name the after-test queries.
  const theme = useContext(ThemeContext);
  // => Context read: null when no provider wraps the badge.
  if (theme === null) throw new Error("ThemedBadge needs a ThemeContext provider");
  // => Loud failure: the exact error the before-test below records.
  return <span data-theme={theme}>{label}</span>;
  // => Theme attribute: the styling hook the suite asserts.
}
