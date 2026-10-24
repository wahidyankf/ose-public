// Kata 03 After: `trim` plus `parse` delete the loop and its hiding places.
// => `trim` strips all whitespace, not just spaces: tabs fixed for free.
// => The verdicts below match the starter's intent on every input.
// => Two lines replace twelve: the standard library already solved this.
// => Trailing space parses now: the hand-rolled slice dropped it wrongly.
fn parse_std(raw: &str) -> Option<i32> {
    // => the standard two-step
    let trimmed = raw.trim(); // => all whitespace gone, unicode-aware
    if trimmed.is_empty() {
        // => blank is missing, not zero
        return None; // => explicit corner, same as the starter
    }
    trimmed.parse::<i32>().ok() // => digits parse, junk becomes `None`
}
fn main() {
    // => three fixed inputs prove the rewrite: padded, junk, and blank.
    println!("{:?}", parse_std(" 75 ")); // => Output: Some(75)
    println!("{:?}", parse_std("xyz")); // => Output: None
    println!("{:?}", parse_std("   ")); // => Output: None
}
