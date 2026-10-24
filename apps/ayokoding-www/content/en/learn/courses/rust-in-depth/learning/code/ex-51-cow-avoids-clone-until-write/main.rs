// Example 51: Cow Avoids Clone Until Write.
// => `Cow<str>` is either borrowed or owned: reads never allocate.
// => `to_mut` clones on first write: the allocation happens exactly once.
// => Clean inputs stay borrowed end to end: the fast path costs nothing.
// => `into_owned` materializes the final string for printing below.
use std::borrow::Cow; // => clone-on-write: borrow until mutation demands more
                      // => `normalize` trims only when padding exists: clean names skip the clone.
fn normalize(raw: &str) -> Cow<'_, str> {
    // => borrows from the input
    if raw.starts_with(' ') || raw.ends_with(' ') {
        // => padding check first
        Cow::Owned(raw.trim().to_string()) // => dirty: one clone, then trim
    } else {
        Cow::Borrowed(raw) // => clean: zero allocation, borrow straight through
    }
}
fn main() {
    // => one dirty nickname clones once; one clean nickname never clones.
    println!("{}", normalize("  bud  ").into_owned()); // => Output: bud
    println!("{}", normalize("citra").into_owned()); // => Output: citra
}
