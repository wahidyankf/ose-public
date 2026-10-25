// => Worked Example 10: branded types make same-shaped strings incompatible.
// => co-02: in Zod this is z.string().brand<"UserId">(): validated once, distinct forever.
// => co-01: the brand lives in the type, so no second schema is needed downstream.
type UserId = string & { readonly brand: "UserId" }; // => a string the compiler treats as distinct
type OrderId = string & { readonly brand: "OrderId" }; // => same runtime shape, different type
function toUserId(input: unknown): { ok: true; id: UserId } | { ok: false; issue: string } {
  // => the single boundary that mints UserIds: prefix-checked, then branded
  if (typeof input === "string" && input.startsWith("usr_") && input.length > 4) {
    // => prefix plus length: the whole UserId contract in one check
    return { ok: true, id: input as UserId }; // => brand applied exactly once, here
  } // => contract failed: fall through
  return { ok: false, issue: "expected usr_-prefixed id" }; // => rejected before any brand exists
}
function toOrderId(input: unknown): { ok: true; id: OrderId } | { ok: false; issue: string } {
  // => the single boundary that mints OrderIds: same shape, different brand
  if (typeof input === "string" && input.startsWith("ord_") && input.length > 4) {
    // => prefix plus length: the whole OrderId contract in one check
    return { ok: true, id: input as OrderId }; // => brand applied exactly once, here
  } // => contract failed: fall through
  return { ok: false, issue: "expected ord_-prefixed id" }; // => rejected before any brand exists
}
function ordersFor(user: UserId): string {
  // => downstream code takes the brand: callers cannot pass a raw string
  return "orders of " + user; // => the brand guarantees the prefix was checked
}
function main(): void {
  // => entry point; two ids, two brands, zero mix-ups
  // => both boundaries pass, and each brand flows to its own consumer
  const user = toUserId("usr_ada"); // => valid user id from the wire
  const order = toOrderId("ord_007"); // => valid order id from the wire
  if (user.ok && order.ok) {
    // => narrow both before use
    console.log("branded: " + ordersFor(user.id) + " + " + order.id); // => Output: branded: orders of usr_ada + ord_007
  } // => happy path done
  // => a swapped prefix fails at the minting boundary, not deep in the code
  const swapped = toUserId("ord_007"); // => an order id presented as a user id
  if (!swapped.ok) {
    // => the failure names the expected prefix
    console.log("swapped: " + swapped.issue); // => Output: swapped: expected usr_-prefixed id
  } // => swapped done
}
main(); // => run once; a throw exits nonzero
