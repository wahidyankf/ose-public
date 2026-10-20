// => Context trio: the theme channel this unit's shared wrapper provides.
import React, { createContext, useContext } from "react"; // => React plus context: the only framework import here.
// => Context trio: the theme channel this unit's shared wrapper provides.

// => Theme union: the wrapper default ('dark') is one of these two.
export type Theme = "light" | "dark"; // => Two modes: the tag test renders both variants.
// => Theme union: the wrapper default ('dark') is one of these two.

// => Default light: the provider below overrides with the test's choice.
const ThemeContext = createContext<Theme>("light"); // => Channel seed: every provider below overrides this value.
// => Default light: the provider below overrides with the test's choice.

// => Hook reads the theme: consumers depend on meaning, not on context objects.
export function useTheme(): Theme {
  // => Hook reads the theme: consumers depend on meaning, not on context objects.
  return useContext(ThemeContext); // => Single lookup: the whole hook is one context read.
}

// => Provider takes variant plus children: the wrapper's composition block.
export function ThemeProvider({
  // => Variant destructured: dark by default in the wrapper, explicit here.
  theme,
  // => Children render under the theme: the tag reads it via the hook.
  children,
}: {
  // => Variant typed: only light or dark ever flows through the wrapper.
  theme: Theme;
  children: React.ReactNode;
  // => Signature closes: variant plus children, both typed, the provider contract.
}): React.JSX.Element {
  // => Provider takes variant plus children: the wrapper's composition block.
  // => Theme flows down: every consumer below renders the chosen variant.
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

// => Consumer renders a variant class: the observable contract for both files.
export function ThemedTag(): React.JSX.Element {
  // => Consumer renders a variant class: the observable contract for both files.
  // => Hook call: no props, no drilling, just the provided theme.
  const theme = useTheme();
  // => Variant class computed: the single line the file assertions pin.
  return <span className={theme === "dark" ? "tag-dark" : "tag-light"}>v1</span>;
}
