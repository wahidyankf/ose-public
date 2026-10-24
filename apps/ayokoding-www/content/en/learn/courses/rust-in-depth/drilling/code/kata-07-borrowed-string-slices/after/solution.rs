// Kata 07 After: borrowing reads without owning or cloning.
// => `&str` accepts literals and `&String` alike: one signature, every caller.
// => Zero allocation on the read path: the format owns only its output.
// => The transcript matches the starter exactly: words kept, waste gone.
fn greet_borrowed(name: &str) -> String {
    // => borrows to read, owns the result
    format!("halo, {}!", name) // => the output owns its text; the input stays
}
fn main() {
    // => literal and owned inputs through one signature: no clones anywhere.
    println!("{}", greet_borrowed("sari")); // => Output: halo, sari!
    println!("{}", greet_borrowed(&"budi".to_string())); // => Output: halo, budi!
}
