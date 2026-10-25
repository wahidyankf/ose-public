// => Worked Example 8: arrays validate per item, and every failure names its index.
// => co-02: in Zod this is z.array(UserSchema): one schema, applied N times.
interface Item {
  // => the trusted item type after its index passes
  sku: string; // => stock-keeping key, non-empty
  qty: number; // => count, must be a positive number
}
interface ItemIssue {
  // => one item failure, indexed like Zod's error paths
  index: number; // => which array position failed
  message: string; // => what failed at that position
}
// => One element, one index: the index travels with every verdict it produces.
function parseItem(input: unknown, index: number): { ok: true; item: Item } | { ok: false; issue: ItemIssue } {
  // => parse one element with its index attached to any failure
  if (typeof input !== "object" || input === null) {
    // => non-objects cannot be items
    return { ok: false, issue: { index: index, message: "expected object" } }; // => index preserved
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["sku"] !== "string" || record["sku"].length === 0) {
    // => blank skus fail like missing ones
    return { ok: false, issue: { index: index, message: "sku: expected non-empty string" } }; // => field named
  } // => sku settled
  if (typeof record["qty"] !== "number" || record["qty"] <= 0) {
    // => zero and negative quantities are not orderable
    return { ok: false, issue: { index: index, message: "qty: expected positive number" } }; // => field named
  } // => qty settled
  return { ok: true, item: { sku: record["sku"], qty: record["qty"] } }; // => trusted item out
}
// => The array parse never throws: failures collect, successes collect, then the split decides.
function parseItems(input: unknown): { ok: true; items: Item[] } | { ok: false; issues: ItemIssue[] } {
  // => the array parse: every item checked, every failure collected
  // => The top level must be an array before any index exists.
  if (!Array.isArray(input)) {
    // => the top level must be an array before any index exists
    return { ok: false, issues: [{ index: -1, message: "expected array" }] }; // => index -1 means "not an array at all"
  } // => array confirmed
  const items: Item[] = []; // => trusted outputs accumulate here
  const issues: ItemIssue[] = []; // => failures accumulate here, never thrown
  // => Every item checked: the index comes free from forEach.
  input.forEach((entry: unknown, index: number) => {
    // => index comes free from forEach
    const parsed = parseItem(entry, index); // => same item parse, indexed
    // => Each entry takes exactly one branch: stored as trusted or stored as indexed.
    if (parsed.ok) {
      // => valid items accumulate
      items.push(parsed.item); // => trusted item stored
    } else {
      // => invalid items accumulate as issues
      issues.push(parsed.issue); // => indexed issue stored
    } // => entry settled
  });
  // => Any failure fails the whole parse: partial arrays never leak downstream.
  if (issues.length > 0) {
    // => any failure fails the whole array parse
    return { ok: false, issues: issues }; // => all failures reported together
  } // => no failures: fall through
  return { ok: true, items: items }; // => trusted array out
}
// => A mixed cart proves the collection: valid items survive, one indexed issue reports.
function main(): void {
  // => entry point; a mixed cart shows per-index reporting
  // => two valid items survive, one indexed issue reports: collection, not short-circuit.
  // => two valid items and one bad quantity: two pass, one is named
  const cart: unknown = [
    { sku: "KB-01", qty: 2 }, // => index 0: valid
    { sku: "MS-02", qty: 0 }, // => index 1: qty fails
    { sku: "MN-03", qty: 1 }, // => index 2: valid
  ];
  const parsed = parseItems(cart); // => parse the whole cart
  // => The failure branch lists every bad index.
  if (!parsed.ok) {
    // => the failure branch lists every bad index
    console.log(
      "cart: issues=" + // => issue count first
        String(parsed.issues.length) +
        " at=" + // => then the bad index
        String(parsed.issues[0].index) +
        " " +
        parsed.issues[0].message, // => then the rule that failed
    ); // => Output: cart: issues=1 at=1 qty: expected positive number
  } // => cart done
}
main(); // => run once; a throw exits nonzero
