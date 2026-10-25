// => Kata 2 starter: a throwing withdraw that callers cannot plan for.
// => Task: return a typed error instead of throwing, so callers branch on it.
function withdraw(balance: number, amount: number): number {
  // => the throwing version: failure is an exception with no type
  if (amount > balance) {
    // => overdraft: explosive, untyped, invisible in the signature
    throw new Error("overdraft"); // => BUG: callers need try/catch to survive
  } // => funded: fall through
  return balance - amount; // => new balance
}
function main(): void {
  // => entry point; the overdraft throws instead of returning a value
  // => the failure path needs a try/catch the signature never advertised
  try {
    // => the throwing call must sit inside try
    withdraw(10, 30); // => throws: overdraft
    console.log("starter: unexpectedly funded"); // => unreachable for this input
  } catch {
    // => the catch proves the failure was an exception, not a value
    console.log("starter: threw (untyped)"); // => starter behavior: exception
  } // => starter done
  // => the task: a typed InsufficientFunds value instead of this throw
  console.log("wanted: typed error value"); // => target after the fix
}
main(); // => run once; a throw exits nonzero
