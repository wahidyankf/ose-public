// Kata 03 Before: a hand-rolled trim-and-parse loop with hiding places.
// => Manual indexing re-checks bounds the standard library already handles.
// => The task: delete the loop, use `trim` plus `parse`, keep the verdicts.
// => Whitespace-only input should be missing, junk should fail to parse.
fn parse_hand(raw: &str) -> Option<i32> {
    // => hand-rolled, bug-compatible
    let bytes = raw.as_bytes(); // => drops to bytes to dodge char boundaries
    let mut start = 0; // => first non-space index, searched below
    while start < bytes.len() && bytes[start] == b' ' {
        // => spaces only, not tabs
        start += 1; // => skips spaces, one by one
    }
    if start == bytes.len() {
        // => all spaces counts as missing here
        return None; // => the one corner the loop gets right
    }
    let rest = &raw[start..]; // => slicing resumes on the byte index
                              // => Only spaces skip: tabs and unicode whitespace defeat the loop.
    rest.parse::<i32>().ok() // => parsing finally delegates to stdlib
}
fn main() {
    // => the verdicts the rewrite must preserve exactly.
    println!("{:?}", parse_hand(" 75 ")); // => trailing space breaks this one
    println!("{:?}", parse_hand("xyz")); // => junk fails either way
}
