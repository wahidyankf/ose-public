// Kata 2 starter: the test locates Checkout by CSS class. After the redesign
// renames every class, the selector finds nothing and the test goes red --
// even though the button is right there.
// Task: switch to a resilient locator (see Example 4). The test must pass
// before AND after the redesign.
async function main(): Promise<void> {
  const html = '<button class="btn-primary-x">Checkout</button>';
  const before: boolean = html.includes('class="btn-primary-x"');
  const redesigned: string = html.replace(/btn-primary-x/g, "cta-ember-2");
  const after: boolean = redesigned.includes('class="btn-primary-x"');
  console.log("passes before redesign: " + String(before));
  console.log("passes after redesign: " + String(after));
  console.log("redesign broke it: " + String(before && !after));
}

await main();
