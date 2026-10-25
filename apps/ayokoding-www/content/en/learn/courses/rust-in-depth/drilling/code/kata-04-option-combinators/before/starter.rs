// Kata 04 Before: nested matches push the happy path two levels deep.
// => Each `match` re-states the `None` case the next stage must skip.
// => The task: chain `map` and `filter` so `None` short-circuits by itself.
// => Empty-after-trim and missing inputs must both normalize to `None`.
fn clean_nested(nick: Option<&str>) -> Option<String> {
    // => nested and deep
    match nick {
        // => level one: presence check
        Some(name) => match name.trim().is_empty() {
            // => level two: blank check
            true => None, // => blank trims to nothing: reject
            false => Some(name.trim().to_uppercase()), // => happy path, buried
        },
        None => None, // => missing stays missing
    }
}
fn main() {
    // => the verdicts the flat chain must preserve exactly.
    // => Padded normalizes to BUD; missing stays None: both shapes covered.
    println!("{:?}", clean_nested(Some("  bud  "))); // => trims and uppercases
    println!("{:?}", clean_nested(None)); // => stays missing
}
