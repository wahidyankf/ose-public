// Kata 7 starter: two mins that differ only in type.
//
// min_i32 and min_f64 share every line but their signatures; adding a
// third type means copying the body again, and fixing a bug means fixing
// it everywhere. Your task: replace both with one generic min_of bounded
// by PartialOrd, like Example 45, and serve all three call sites from it.
// => duplicated bodies drift: the fix lands in one copy and misses the other
// => the generic serves every ordered type: integers, floats, and strings

// min_i32 returns the smaller of two integers, or the left on ties.
// => the body compares and picks: the same five lines min_f64 repeats
fn min_i32(left: i32, right: i32) -> i32 {
    if left <= right {
        left
    } else {
        right
    }
}

// min_f64 returns the smaller of two floats, or the left on ties.
// => the body compares and picks: the same five lines min_i32 repeats
fn min_f64(left: f64, right: f64) -> f64 {
    if left <= right {
        left
    } else {
        right
    }
}

fn main() {
    // => three call sites, two functions: strings have nowhere to go yet
    println!("min(91, 77) = {}", min_i32(91, 77));
    println!("min(9.1, 7.7) = {}", min_f64(9.1, 7.7));
}
