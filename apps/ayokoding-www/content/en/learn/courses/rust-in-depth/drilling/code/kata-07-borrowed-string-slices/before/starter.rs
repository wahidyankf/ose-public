// Kata 07 Before: cloning every name just to read it once.
// => `name.clone()` pays a heap copy per greeting: reading should be free.
// => The task: borrow `&str` so literals and owned strings both pass freely.
// => The transcript must stay identical: shape changes, words do not.
fn greet_owned(name: String) -> String {
    // => demands ownership to read
    format!("halo, {}!", name) // => reads once, owns forever
}
fn main() {
    // => owned strings built only to satisfy the signature: waste, visible.
    println!("{}", greet_owned("sari".to_string())); // => clone by construction
}
