// Example 48: Closures Capture Modes.
//
// A closure borrows what it only reads (Fn), mutably borrows what it
// updates (FnMut), and moves what it consumes (FnOnce). The compiler picks
// the weakest mode that fits the body, so the signature documents exactly
// how the closure treats its surroundings, and callers know what survives.
// => Fn reads: many calls share the borrow, nothing changes hands
// => FnMut updates: the borrow is exclusive while the closure lives
// => FnOnce consumes: the captured value moves on the single call

fn main() {
    // => the threshold is read, never changed: the closure below is Fn
    let passing = 60u32;
    // => grades holds the fixed samples: borrowed by every closure here
    let grades = [91u32, 77, 58, 88];
    // => is_pass only reads passing: shared borrow, callable forever
    let is_pass = |score: &u32| *score >= passing;
    // => filter borrows the closure immutably: Fn serves repeated calls
    let passed: Vec<u32> = grades
        .iter()
        .filter(|score| is_pass(score))
        .copied()
        .collect();
    // => 91, 77, and 88 clear 60: 58 stays out, and the list prints sorted
    println!("passed: {passed:?}");
    // => the bonus starts at 5: the closure below mutates it, so FnMut
    let mut bonus = 5u32;
    // => add_bonus mutates bonus downward: exclusive borrow while it lives
    let mut add_bonus = |score: u32| {
        // => each call spends one point: the mutation is the whole lesson
        bonus -= 1;
        score + 1
    };
    // => curved holds the two bumped scores: 92 and 78, bonus now 3
    let curved = [add_bonus(91), add_bonus(77)];
    // => the mutation is visible after: five minus two calls leaves 3
    println!("curved: {curved:?}, bonus left: {bonus}");
    // => the label moves into the closure: the single call consumes it
    let label = String::from("curve applied");
    // => the closure takes label by value: FnOnce, callable exactly once
    let announce = || format!("{label}: {curved:?}");
    // => the call consumes label: a second call would not compile
    println!("{}", announce());
}
