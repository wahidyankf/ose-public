export function fixtureName(base: string): string {
  // => Test helper: builds fixture labels. Support code, not product code.
  // => Untested by design: helpers are small, obvious, and exercised indirectly.
  return `fixture-${base}`;
  // => Helper closes: one line, obvious, exercised indirectly by every test.
}
