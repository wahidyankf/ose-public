// Kata 5 starter: two tests repeat the same raw selector sequence. When the
// login form changes, both copies must change -- and one will be forgotten.
// Task: extract a page object (see Example 35). The selectors must appear in
// exactly one place.
async function main(): Promise<void> {
  const stepsA: string[] = ["fill #user", "fill #pass", "click #signin"]; // test one: raw selectors
  const stepsB: string[] = ["fill #user", "fill #pass", "click #signin"]; // test two: same raw selectors again
  const copies: number = stepsA.length + stepsB.length; // every step written twice
  console.log("selector steps written: " + String(copies));
  console.log("single definition: false");
  console.log("duplicated: " + String(copies === 6));
}

await main();
