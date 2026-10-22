// Example 48: Copy Versus Clone Counter.
// => `Copy` types duplicate on use: integers never need borrowing ceremony.
// => Function arguments taking `Copy` types receive their own independent copy.
// => `Clone` is explicit: the call site shows where the cost is paid.
// => Names below are `String`: cloning one is a deliberate, visible choice.
#[derive(Clone, Debug, PartialEq)] // => equality and debug for the ledger name
struct LedgerName(String); // => newtype: a name with its own meaning
                           // => Plain integers are `Copy`: each call below owns its own counter.
fn bump(mut count: i32) -> i32 {
    // => `mut` parameter: a local working copy
    count += 1; // => the caller's variable is untouched by this line
    count // => the bumped copy returns to the caller
}
fn main() {
    // => the counter copies through three bumps without a single borrow.
    let mut settled = 0; // => the running count of settled lines
    settled = bump(settled); // => copy in, bumped copy out, rebind
    settled = bump(settled); // => rebinding is the update: no mutation aliasing
    settled = bump(settled); // => three bumps, three independent copies
    println!("settled: {}", settled); // => Output: settled: 3
                                      // => the name clones once, explicitly, where a second owner is needed.
    let official = LedgerName("bendahara".to_string()); // => the single owner first
    let backup = official.clone(); // => explicit cost, visible at the call site
    println!("backup: {:?}", backup); // => Output: backup: LedgerName("bendahara")
}
