// Worked Example 31: Idempotent submit.
// => NusaMart is fictional; every key and quantity here is fixed.
// => Double clicks and retries post the same intent twice: an idempotency
// => key lets the server recognize the replay and return the first reply
// => instead of charging twice. Same key in, same answer out, one mutation.

// => Seen keys map to their first reply: the replay log of this action.
const seen = new Map<string, string>(); // => key to first reply

// => Run the add intent once per key: new keys mutate and record, replays
// => return the recorded reply with a replay flag and mutate nothing.
function addOnce(key: string, id: string, qty: number): string {
  // => idempotent action
  const replay = seen.get(key); // => the first reply, if any
  if (replay !== undefined) {
    // => key seen before
    return "replay: " + replay; // => same answer, no mutation
  } // => end of the replay branch
  const reply = "added " + qty + " x " + id; // => the single mutation
  seen.set(key, reply); // => record the reply under the key
  return "fresh: " + reply; // => first answer
} // => end of addOnce

console.log(addOnce("key-1", "kopi-001", 2)); // => Output fresh: added 2 x kopi-001
console.log(addOnce("key-1", "kopi-001", 2)); // => Output replay of the first reply
console.log(addOnce("key-2", "kopi-001", 2)); // => Output fresh: a new key mutates again
console.log("mutations: " + seen.size); // => Output 2, not 3
export {}; // => module scope keeps these names local
