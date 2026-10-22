// Example 29: Pub Crate Marks the Team Boundary.
// => `pub` opens to everyone; `pub(crate)` opens to the crate team only.
// => Helpers shared between modules stay crate-visible: no wider promise.
// => `main` here plays the teammate: it uses the helper like a sibling module would.
mod parse {
    // => the parsing team: one helper, one precise visibility
    // => crate-visible: every module in this binary may call it.
    pub(crate) fn amount(raw: &str) -> Option<i32> {
        // => `None` rejects junk
        raw.trim().parse::<i32>().ok() // => trim first, parse second
    }
    // => fully private: even sibling modules cannot name this function.
    fn is_blank(text: &str) -> bool {
        // => the helper's own helper
        text.trim().is_empty() // => whitespace-only counts as blank
    }
    // => crate-visible check built on the private helper above.
    pub(crate) fn usable(text: &str) -> bool {
        // => blank lines are skipped
        !is_blank(text) // => negation of the private rule
    }
}
fn main() {
    // => fixed raws: a number, a padded number, and two rejections.
    // => Blank lines fail the `usable` gate; junk fails the parse itself.
    let raws = ["50", " 75 ", "", "xyz"]; // => two good, two bad
                                          // => Each raw prints its verdict: `Some` for dues, `blank` for empties.
    for raw in raws {
        // => every raw takes the same two gates
        if parse::usable(raw) {
            // => crate-visible gate one: not blank
            println!("{:?}", parse::amount(raw)); // => Some(50), Some(75), None
        } else {
            println!("blank"); // => Output: blank
        }
    }
}
