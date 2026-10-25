// => Worked Example 32: one round trip serves many keys.
// => co-06: batching keeps the typed interface while collapsing N calls into one.
// => co-04: the batch composes per-key outcomes into one reply, like Effect.all.
function batchGet(keys: string[], table: Record<string, string>): Record<string, string | null> {
  // => the batched loader: one call, one reply carrying every key's answer
  const reply: Record<string, string | null> = {}; // => answers accumulate by key
  for (const key of keys) {
    // => each key resolves against the same table
    const found: string | undefined = table[key]; // => lookup may miss
    reply[key] = found === undefined ? null : found; // => misses become null, never absent keys
  } // => every key answered
  return reply; // => one reply for the whole batch
}
function main(): void {
  // => entry point; three keys travel in one call and return in one reply
  // => the table holds two of the three requested keys
  const table: Record<string, string> = { u1: "Ada", u2: "Grace" }; // => the server-side data
  const reply: Record<string, string | null> = batchGet(["u1", "u2", "u9"], table); // => one batched call
  console.log("batch: u1=" + String(reply["u1"]) + " u2=" + String(reply["u2"]) + " u9=" + String(reply["u9"])); // => Output: batch: u1=Ada u2=Grace u9=null
  // => the reply carries every key: the client never wonders which answers are missing
  const answered: number = Object.keys(reply).length; // => keys present in the reply
  const hits: number = Object.values(reply).filter((v) => v !== null).length; // => keys that resolved
  console.log("coverage: keys=" + String(answered) + " hits=" + String(hits)); // => Output: coverage: keys=3 hits=2
}
main(); // => run once; a throw exits nonzero
