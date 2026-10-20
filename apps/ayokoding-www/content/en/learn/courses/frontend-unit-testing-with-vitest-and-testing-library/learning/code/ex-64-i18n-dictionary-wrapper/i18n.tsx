import React, { createContext, useContext } from "react";
// => Context trio once more: translation is just another provided value.

// => Dictionary type: string keys, string copy, per-locale object.
export type Dict = Record<string, string>;
// => Dictionary type: string keys, string copy, per-locale object.

// => Empty default: missing keys render as visibly missing, never crash.
const I18nContext = createContext<Dict>({});
// => Empty default: missing keys render as visibly missing, never crash.

// => Provider takes the whole dictionary: locale as data, not framework.
export function I18nProvider({
  // => Dictionary destructured: one prop carries the entire locale.
  dict,
  // => Children render under the locale: every lookup below uses it.
  children,
}: {
  dict: Dict;
  children: React.ReactNode;
}): React.JSX.Element {
  // => Provider takes the whole dictionary: locale as data, not framework.
  // => Dictionary flows down: the consumer lookup reads this value.
  return <I18nContext.Provider value={dict}>{children}</I18nContext.Provider>;
}

// => Consumer looks up one key: the wrapper decides which language answers.
export function Greeting(): React.JSX.Element {
  // => Consumer looks up one key: the wrapper decides which language answers.
  // => Whole-dict read: the component stays free of locale-switching logic.
  const dict = useContext(I18nContext);
  // => Whole-dict read: the component stays free of locale-switching logic.
  // => Fallback marks missing keys visibly: tests catch gaps, users never guess.
  return <h1>{dict["hello"] ?? "hello?"}</h1>;
  // => Fallback marks missing keys visibly: tests catch gaps, users never guess.
}
