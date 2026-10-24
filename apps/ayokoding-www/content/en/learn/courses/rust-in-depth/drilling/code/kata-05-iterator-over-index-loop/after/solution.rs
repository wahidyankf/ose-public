// Kata 05 After: one fused pass replaces the index, bound, and step.
// => `iter` streams values: no index exists to go out of bounds.
// => `sum` folds in one pass: the compiler fuses what the loop spelled out.
// => Same answer, fewer moving parts: 150 either way, proven below.
// => The accumulator, bound check, and increment all delete together.
fn total_fused(dues: &[i32]) -> i32 {
    // => the whole loop in one expression
    dues.iter().sum() // => stream the values, fold them, done
}
fn main() {
    // => the identical total through the fused shape: shape changed, answer kept.
    println!("total: {}", total_fused(&[50, 75, 25])); // => Output: total: 150
}
