// Example 16: Panic Stays at the Boundary.
//
// Panic means a bug, never a validation: in a Wasm module it traps the
// whole instance, so library code returns Result and reserves assert for
// contracts the caller cannot break without misusing the API. Checked
// arithmetic turns overflow from a trap into a matchable None.
// => debug_assert documents intent for test builds, free in release
// => the rule: fallible input gets Result, impossible states get assert

fn main() {
    // => checked_add returns None on overflow instead of trapping release
    match 200u8.checked_add(100) {
        // => reachable only when the sum fits: 200 + 100 never does
        Some(sum) => println!("200 + 100 = {sum}"),
        // => the honest overflow path: a message, not a trap, exit stays 0
        None => println!("200u8 + 100 overflows: refused, not trapped"),
    }
    // => saturating_add clamps at the edge: 200 + 100 pins to 255
    let clamped = 200u8.saturating_add(100);
    // => clamping is the documented choice for meters and progress bars
    println!("saturating 200 + 100 = {clamped}");
    // => debug_assert states the contract for test builds, free in release
    let sides = 4u32;
    // => a square always has four sides: asserting it says "trust, verify"
    debug_assert!(sides == 4, "a square needs four sides");
    // => reaching this line proves the contract holds in this build too
    println!("square has {sides} sides: contract holds");
    // => checked subtraction on a countdown refuses to wrap below zero
    match 3u32.checked_sub(5) {
        // => reachable only when the difference stays unsigned-safe
        Some(left) => println!("3 - 5 = {left}"),
        // => underflow prints as a refusal: no wrap, no trap, exit 0
        None => println!("3 - 5 underflows u32: refused, not trapped"),
    }
}
