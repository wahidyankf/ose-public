// Kata 2 solution: locate by test id, which ignores styling churn. The test
// passes before and after the redesign with no changes.
// (co-01: locator)
async function main(): Promise<void> {
  // => entry point
  const html = '<button class="btn-primary-x" data-testid="checkout-submit">Checkout</button>'; // => the test hook survives styling
  const redesigned: string = html.replace(/btn-primary-x/g, "cta-ember-2"); // => the redesign renames classes only
  const before: boolean = html.includes('data-testid="checkout-submit"'); // => real: getByTestId("checkout-submit")
  const after: boolean = redesigned.includes('data-testid="checkout-submit"'); // => same locator, restyled page
  console.log("passes before redesign: " + String(before)); // => Output: passes before redesign: true
  console.log("passes after redesign: " + String(after)); // => Output: passes after redesign: true
  console.log("redesign-proof: " + String(before && after)); // => Output: redesign-proof: true
} // => the hook outlived the stylesheet

await main(); // => run once
