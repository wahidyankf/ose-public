// Kata 01 Before: validation with `unwrap` aborts on the first bad line.
// => `parse` returns a `Result`: `unwrap` throws the `Err` away as a panic.
// => One junk line below would kill the whole ledger run, not just its row.
// => The task: return the failure instead of panicking, and keep going.
fn due(raw: &str) -> i32 {
    // => panics on junk: the habit being replaced
    raw.trim().parse::<i32>().unwrap() // => `unwrap` trusts every input blindly
}
fn main() {
    // => the good line prints; the junk line would panic before the total.
    println!("due: {}", due("50")); // => prints 50, then the run is doomed
    println!("due: {}", due("xyz")); // => panics here: no total ever prints
}
