// Example 45: Generic Min Replaces Two.
//
// A min for i32 and a min for f64 share every line but their types: one
// generic fn with a PartialOrd bound serves both, and the compiler stamps
// a copy per call site with zero runtime cost. Bounds are the contract:
// the function states what it needs, and misuse fails at the call, loudly.
// => one definition, every ordered type: no per-type copies to drift apart
// => PartialOrd is the need: comparison is the only operation inside

// min_of returns the smaller of two values of any ordered type.
// => T: PartialOrd bounds the generic: only comparable types are accepted
// => the body uses only <=: the bound guarantees the operator exists
fn min_of<T: PartialOrd>(left: T, right: T) -> T {
    // => the comparison decides: smaller wins, ties keep the left value
    if left <= right {
        left
    } else {
        right
    }
}

fn main() {
    // => integers compare by value: 77 is smaller, and prints as the min
    println!("min(91, 77) = {}", min_of(91, 77));
    // => floats compare the same way: 7.7 is smaller, same function shape
    println!("min(9.1, 7.7) = {}", min_of(9.1, 7.7));
    // => strings compare lexicographically: "budi" sorts before "sari"
    println!("min(sari, budi) = {}", min_of("sari", "budi"));
    // => chars compare by code point: 'B' (66) sorts before 's' (115)
    println!("min(s, B) = {}", min_of('s', 'B'));
}
