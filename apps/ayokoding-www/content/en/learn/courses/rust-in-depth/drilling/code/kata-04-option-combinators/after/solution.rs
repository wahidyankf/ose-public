// Kata 04 After: one chain replaces two nested matches.
// => `map` transforms inside the option: no unwrapping by hand.
// => `filter` drops the blank case: empties never reach the uppercase.
// => `None` skips every stage: short-circuiting is structural, not remembered.
// => Three fixed inputs prove every stage: padded, missing, and blank.
fn clean_flat(nick: Option<&str>) -> Option<String> {
    // => flat by construction
    nick.map(|name| name.trim()) // => stage one: trim inside the option
        .filter(|name| !name.is_empty()) // => stage two: blanks stop here
        .map(|name| name.to_uppercase()) // => stage three: normalize survivors
}
fn main() {
    // => padded normalizes, missing skips, blank filters: all three verdicts.
    println!("{:?}", clean_flat(Some("  bud  "))); // => Output: Some("BUD")
    println!("{:?}", clean_flat(None)); // => Output: None
    println!("{:?}", clean_flat(Some("   "))); // => Output: None
}
