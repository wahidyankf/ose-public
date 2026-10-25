// => Capstone: a typed order-submission flow through all four tools.
// => Zod validates the input, an Effect pipeline charges with typed errors,
// => a tRPC procedure exposes it end to end, and an XState machine drives the UI.
type OrderInput = { email: string; seats: number }; // => the trusted order shape, post-schema
type OrderError = { kind: "Invalid"; issue: string } | { kind: "ShortFunds"; have: number; need: number }; // => every failure the flow admits
// => Zod's job: the boundary schema for the order form.
function checkOrder(input: unknown): { ok: true; order: OrderInput } | { ok: false; error: OrderError } {
  // => Zod's job: the boundary schema for the order form
  if (typeof input !== "object" || input === null) {
    // => non-objects carry no fields
    // => Funded: the receipt assembles from order and total.
    return { ok: false, error: { kind: "Invalid", issue: "expected object" } }; // => reject before any field read
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["email"] !== "string" || !record["email"].includes("@")) {
    // => email rule shared with the client pre-check
    return { ok: false, error: { kind: "Invalid", issue: "email: expected email string" } }; // => field named
  } // => email settled
  if (typeof record["seats"] !== "number" || !Number.isInteger(record["seats"]) || record["seats"] < 1) {
    // => seats rule shared with the client pre-check
    return { ok: false, error: { kind: "Invalid", issue: "seats: expected positive integer" } }; // => field named
  } // => seats settled
  return { ok: true, order: { email: record["email"], seats: record["seats"] } }; // => trusted order out
}
// => Effect's job: price the seats and charge, with the shortfall typed.
function chargeFlow(
  order: OrderInput,
  balance: number,
): { ok: true; receipt: string } | { ok: false; error: OrderError } {
  // => Effect's job: price the seats and charge, with the shortfall typed
  const total: number = order.seats * 25; // => 25 per seat: the price list
  // => Insufficient funds: the typed failure with have and need.
  if (balance < total) {
    // => insufficient funds: the typed failure, shortfall included
    return { ok: false, error: { kind: "ShortFunds", have: balance, need: total } }; // => Effect error value
  } // => funded: fall through
  return {
    ok: true,
    receipt: "order for " + order.email + ": " + String(order.seats) + " seats, paid " + String(total),
  }; // => receipt out
}
// => tRPC's job: the procedure composes the gate with the pipeline.
function submitOrder(
  input: unknown,
  balance: number,
): { ok: true; receipt: string } | { ok: false; error: OrderError } {
  // => tRPC's job: the procedure composes the schema gate with the Effect pipeline
  const checked = checkOrder(input); // => schema gate first
  if (!checked.ok) {
    // => gate failed: the pipeline never runs
    return checked; // => gate error out
  } // => gate passed: fall through to the Effect
  return chargeFlow(checked.order, balance); // => Effect pipeline second
}
type UiState = "editing" | "submitting" | "confirmed" | "failed"; // => the XState-shaped UI states
// => XState's job: editing submits, the reply lands confirmed or failed.
function driveUi(input: unknown, balance: number): { trace: UiState[]; message: string } {
  // => XState's job: editing submits, the reply lands in confirmed or failed
  const trace: UiState[] = ["editing", "submitting"]; // => the UI states visited so far
  // => The procedure runs on submit: gate then pipeline.
  const reply = submitOrder(input, balance); // => the procedure runs on submit
  // => Success reply: the machine confirms with the receipt.
  if (reply.ok) {
    // => success reply: the machine confirms
    // => Confirmed state: the receipt flows to the UI.
    trace.push("confirmed"); // => confirmed state
    return { trace: trace, message: reply.receipt }; // => receipt shown
  } // => error reply: fall through to failure
  // => Failed state: the typed error flows to the hint.
  trace.push("failed"); // => failed state
  const error: OrderError = reply.error; // => name the typed error
  // => Recovery hint per kind: fix for invalid, top-up for short funds.
  const message: string =
    error.kind === "Invalid"
      ? "fix: " + error.issue
      : "top up: have " + String(error.have) + ", need " + String(error.need); // => recovery hint per kind
  return { trace: trace, message: message }; // => hint shown
}
// => Three scenarios: funded confirms, broke fails, invalid fails.
function main(): void {
  // => entry point; a funded order confirms, a broke order fails with a top-up hint
  // => the happy path: valid input, funded wallet, confirmation trace
  const happy = driveUi({ email: "ada@example.com", seats: 2 }, 100); // => 50 due, 100 held
  console.log("happy: " + happy.trace.join(">") + " | " + happy.message); // => Output: happy: editing>submitting>confirmed | order for ada@example.com: 2 seats, paid 50
  // => the broke path: valid input, thin wallet, failure trace with a hint
  const broke = driveUi({ email: "ada@example.com", seats: 4 }, 60); // => 100 due, 60 held
  console.log("broke: " + broke.trace.join(">") + " | " + broke.message); // => Output: broke: editing>submitting>failed | top up: have 60, need 100
  // => the invalid path: bad email, full wallet, failure trace with a fix hint
  const bad = driveUi({ email: "not-an-email", seats: 1 }, 100); // => schema-invalid input
  console.log("bad: " + bad.trace.join(">") + " | " + bad.message); // => Output: bad: editing>submitting>failed | fix: email: expected email string
}
main(); // => run once; a throw exits nonzero
