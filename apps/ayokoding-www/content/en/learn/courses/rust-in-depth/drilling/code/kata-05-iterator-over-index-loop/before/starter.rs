// Kata 05 Before: index arithmetic re-checks the bound every step.
// => `i < dues.len()` runs per iteration: the bound never changes.
// => The task: delete the index, stream the values, sum in one pass.
// => The total must stay 150: the rewrite changes shape, never answers.
fn total_indexed(dues: &[i32]) -> i32 {
    // => correct but mechanical
    let mut total = 0; // => the accumulator the loop feeds
    let mut i = 0; // => the index the loop babysits
    while i < dues.len() {
        // => bound re-checked on every single step
        total += dues[i]; // => indexing trusts the check above
        i += 1; // => progress lives in the body, easy to forget
    }
    total // => 150 by accumulation
}
fn main() {
    // => the answer the fused pass must reproduce exactly.
    println!("total: {}", total_indexed(&[50, 75, 25])); // => 150 the slow way
}
