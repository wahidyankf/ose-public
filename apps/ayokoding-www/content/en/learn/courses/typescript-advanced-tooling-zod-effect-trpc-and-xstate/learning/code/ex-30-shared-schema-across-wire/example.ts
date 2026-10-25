// => Worked Example 30: one Zod schema validates both ends of the wire.
// => co-06: the schema is the shared contract: client forms and server procedures use the same one.
// => co-01: single source of truth again, now stretched across the network.
interface Rsvp {
  // => the shared shape: what the schema guarantees on both ends
  email: string; // => must contain an at-sign
  seats: number; // => must be a positive integer
}
function checkRsvp(input: unknown): { ok: true; value: Rsvp } | { ok: false; issue: string } {
  // => the one shared schema, run wherever untrusted data appears
  if (typeof input !== "object" || input === null) {
    // => non-objects carry no fields
    return { ok: false, issue: "expected object" }; // => reject before any field read
  } // => object confirmed
  const record = input as Record<string, unknown>; // => narrow once for key reads
  if (typeof record["email"] !== "string" || !record["email"].includes("@")) {
    // => email rule shared by client pre-check and server gate
    return { ok: false, issue: "email: expected email string" }; // => field named
  } // => email settled
  if (typeof record["seats"] !== "number" || !Number.isInteger(record["seats"]) || record["seats"] < 1) {
    // => seats rule shared by client pre-check and server gate
    return { ok: false, issue: "seats: expected positive integer" }; // => field named
  } // => seats settled
  return { ok: true, value: { email: record["email"], seats: record["seats"] } }; // => trusted RSVP out
}
function main(): void {
  // => entry point; the same schema runs in the form and in the procedure
  // => client-side pre-check: the form validates before sending anything
  const draft: unknown = { email: "ada@example.com", seats: 2 }; // => what the user typed
  const precheck = checkRsvp(draft); // => same schema, client side
  if (precheck.ok) {
    // => the form sends only schema-valid payloads
    console.log("client: sending seats=" + String(precheck.value.seats)); // => Output: client: sending seats=2
  } // => precheck done
  // => server-side gate: the procedure re-validates because the wire is untrusted
  const arrived: unknown = { email: "ada@example.com", seats: 2 }; // => what arrived (same bytes here)
  const gate = checkRsvp(arrived); // => same schema, server side
  if (gate.ok) {
    // => the procedure trusts the gate, not the wire
    console.log("server: accepted " + gate.value.email); // => Output: server: accepted ada@example.com
  } // => gate done
  // => a forged payload passes no gate: the client pre-check is convenience, the server gate is security
  const forged = checkRsvp({ email: "not-an-email", seats: 2 }); // => attacker bypasses the form
  if (!forged.ok) {
    // => the server gate catches what the missing pre-check let through
    console.log("forged: " + forged.issue); // => Output: forged: email: expected email string
  } // => forged done
}
main(); // => run once; a throw exits nonzero
