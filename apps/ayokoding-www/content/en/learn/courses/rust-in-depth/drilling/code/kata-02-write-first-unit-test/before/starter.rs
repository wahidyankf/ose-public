// Kata 02 Before: a total no test pins, free to break silently.
// => `total` below is correct today: nothing proves it stays correct.
// => The task: pin the 150 hand total and the empty corner with tests.
// => Run them through `rustc --test`: red first if you change the code.
fn total(dues: &[i32]) -> i32 {
    // => correct but unguarded
    dues.iter().sum() // => the plain sum, waiting for its tests
}
fn main() {
    // => the unguarded call: prints today, breaks silently tomorrow.
    println!("total: {}", total(&[50, 75, 25])); // => 150, trusted on faith
}
