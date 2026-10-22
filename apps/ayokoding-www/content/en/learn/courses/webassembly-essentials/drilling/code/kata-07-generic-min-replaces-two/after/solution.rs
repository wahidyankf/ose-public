// Kata 7 solution: one generic min serves every ordered type.
//
// min_of carries the single comparison body with a PartialOrd bound, so
// integers, floats, and strings all resolve through it. Adding a type
// means a new call site, never a new copy, and the tie rule lives once.
// => T: PartialOrd bounds the generic: only comparable types are accepted
// => ties keep the left: the rule is stated once, in the single body

// min_of returns the smaller of two values of any ordered type.
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
    // => integers resolve through the generic: 77 is smaller, prints as min
    println!("min(91, 77) = {}", min_of(91, 77));
    // => floats resolve through the same body: 7.7 is smaller, same shape
    println!("min(9.1, 7.7) = {}", min_of(9.1, 7.7));
    // => strings resolve too: "budi" sorts before "sari", no new copy needed
    println!("min(sari, budi) = {}", min_of("sari", "budi"));
}
