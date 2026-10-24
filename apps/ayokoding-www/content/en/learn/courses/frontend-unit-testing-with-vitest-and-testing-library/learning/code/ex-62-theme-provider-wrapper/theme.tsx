import React, { createContext, useContext } from "react"; // => React plus context: the only framework import here.
// => Context trio: create the channel, read it in components, provide in tests.

// => Theme union: two variants, and the wrapper below tests each explicitly.
export type Theme = "light" | "dark";
// => Theme union: two variants, and the wrapper below tests each explicitly.
// => Two modes: the badge test renders both, no third state exists.

// => Default light: components render sensibly even without a provider.
const ThemeContext = createContext<Theme>("light");
// => Channel default: unwrapped reads stay deterministic in every suite.
// => Defaults are documentation: the common case, stated once.

// => Hook hides the context object: components depend on meaning, not plumbing.
export function useTheme(): Theme {
  // => Hook hides the context object: components depend on meaning, not plumbing.
  return useContext(ThemeContext); // => Single lookup: the whole hook is one context read.
}

// => Provider takes the variant plus children: the wrapper's building block.
// => Provider wrapper: theme flows to every child below.
// => Provider wrapper: theme flows to every child below.
export function ThemeProvider({
  // => Variant prop destructured: the test drives this per case.
  theme,
  // => Children pass through untouched: the wrapper adds context only.
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}): React.JSX.Element {
  // => Provider takes the variant plus children: the wrapper's building block.
  // => Value flows down: every useTheme below this node sees the variant.
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
  // => Value flows down: every useTheme below this node sees the variant.
}

// => Consumer reads the theme and renders the variant-appropriate class.
export function ThemedBadge(): React.JSX.Element {
  // => Consumer reads the theme and renders the variant-appropriate class.
  // => Hook call, not prop drilling: the wrapper must supply the provider.
  const theme = useTheme();
  // => Hook call, not prop drilling: the wrapper must supply the provider.
  return <span className={theme === "dark" ? "badge-dark" : "badge-light"}>New</span>;
  // => Variant class is the observable contract the tests below pin.
}
