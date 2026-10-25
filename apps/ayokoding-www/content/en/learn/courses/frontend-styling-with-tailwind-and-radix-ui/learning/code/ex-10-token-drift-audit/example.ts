// => Worked Example 10: audit the class list and count the drift.
// => co-05: every off-token class is one decision the tokens did not make.
const TOKENS: string[] = ["px-4", "py-2", "bg-blue-600", "text-white", "rounded", "font-semibold"]; // => the allowed vocabulary for this review
function drift(classes: string[]): string[] {
  // => collect every class the token set cannot explain
  return classes.filter((c) => !TOKENS.includes(c)); // => membership test per class, same as Example 7
}
function main(): void {
  // => entry point; the audit names names, then counts them
  const used: string[] = ["px-4", "py-2", "bg-blue-600", "text-white", "rounded", "bg-[#123456]", "text-[13px]"]; // => seven classes, two strangers
  const offenders: string[] = drift(used); // => the two off-token classes
  console.log("audited: " + String(used.length)); // => Output: audited: 7
  console.log("drift: " + offenders.join(",")); // => Output: drift: bg-[#123456],text-[13px]
  console.log("drift count: " + String(offenders.length)); // => Output: drift count: 2
  console.log("verdict: add tokens or remove classes"); // => Output: verdict: add tokens or remove classes
}
main(); // => run once; a throw exits nonzero
