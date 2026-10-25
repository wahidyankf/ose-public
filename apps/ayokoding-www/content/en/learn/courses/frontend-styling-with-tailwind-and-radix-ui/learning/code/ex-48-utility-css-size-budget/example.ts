// => Worked Example 48: utility CSS grows with the vocabulary, not the pages.
// => co-16: thirty-eight utilities ship once; page one hundred reuses them free.
function stylesheetBytes(utilitiesUsed: number, bytesPerUtility: number): number {
  // => the generated stylesheet holds one rule per used utility
  return utilitiesUsed * bytesPerUtility; // => linear in vocabulary, flat in pages
}
function handCssBytes(pages: number, bytesPerPage: number): number {
  // => hand-written CSS repeats per page: the comparison baseline
  return pages * bytesPerPage; // => linear in pages, forever
}
function main(): void {
  // => entry point; one vocabulary, one hundred pages, two totals
  // => both totals below are exact products of their two inputs, no rounding.
  console.log("utility css bytes: " + String(stylesheetBytes(38, 110))); // => Output: utility css bytes: 4180
  console.log("hand css bytes, 100 pages: " + String(handCssBytes(100, 900))); // => Output: hand css bytes, 100 pages: 90000
  console.log("new page adds rules: 0"); // => Output: new page adds rules: 0
}
main(); // => run once; a throw exits nonzero
