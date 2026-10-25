// => Kata 2 solution: overdraft becomes a typed error value.
// => The signature advertises the failure; no try/catch anywhere.
// => The typed error replaces the throw: same failure, visible in the signature.
class InsufficientFunds {
  // => the typed error: shortfall carried as data
  readonly tag = "InsufficientFunds"; // => matchable by tag downstream
  readonly shortBy: number; // => how much money is missing
  constructor(shortBy: number) {
    // => plain parameter: strip-safe, assigned explicitly
    this.shortBy = shortBy; // => context stored on the instance
  }
}
// => The Effect shape: value or typed error, never a throw.
function withdraw(
  balance: number,
  amount: number,
): { ok: true; balance: number } | { ok: false; error: InsufficientFunds } {
  // => the Effect shape: value or typed error, never a throw
  // => Overdraft check first: the failure branch returns the tagged error.
  if (amount > balance) {
    // => overdraft: a value the caller branches on
    return { ok: false, error: new InsufficientFunds(amount - balance) }; // => shortfall computed
  } // => funded: fall through
  return { ok: true, balance: balance - amount }; // => new balance out
}
// => Both paths branch without try/catch: overdraft first, funding second.
function main(): void {
  // => entry point; the overdraft is a value, the funding is a value
  // => the overdraft arrives as a tagged error with the shortfall
  const broke = withdraw(10, 30); // => unaffordable withdrawal
  if (!broke.ok) {
    // => branch on the discriminant, never try/catch
    console.log("overdraft: " + broke.error.tag + " shortBy=" + String(broke.error.shortBy)); // => fixed: typed error value
  } // => broke done
  // => the funded withdrawal returns the new balance
  const funded = withdraw(100, 30); // => affordable withdrawal
  if (funded.ok) {
    // => narrow before reading the balance
    console.log("funded: balance=" + String(funded.balance)); // => normal path unaffected
  } // => funded done
}
main(); // => run once; a throw exits nonzero
