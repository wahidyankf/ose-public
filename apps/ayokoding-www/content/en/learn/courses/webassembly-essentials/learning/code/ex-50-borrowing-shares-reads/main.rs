// Example 50: Borrowing Shares Reads.
//
// References lend without taking: &T shares read access with as many
// borrowers as want it, while &mut T lends write access to exactly one.
// The borrow checker enforces the many-readers-XOR-one-writer rule at
// compile time, so data races are rejected programs, not test failures.
// => &T shares freely: reborrow without asking, the owner never notices
// => &mut T is exclusive: one writer means no reader sees a half-write

// summary borrows the roster and returns its one-line shape, read-only.
// => &[String] borrows the whole Vec: length and elements stay visible
// => format joins the names: the borrow ends when the String returns
fn summary(roster: &[String]) -> String {
    // => len and join read through the borrow: roster stays with the caller
    format!("{} students: {}", roster.len(), roster.join(", "))
}

// promote inserts the honor roll marker at the front, mutating in place.
// => &mut Vec<String> borrows exclusively: no reader coexists with this
// => insert at 0 shifts right: the marker leads, the order otherwise holds
fn promote(roster: &mut Vec<String>) {
    roster.insert(0, String::from("HONORS"));
}

fn main() {
    // => roster owns the names: every borrow below answers to this owner
    let mut roster = vec![String::from("sari"), String::from("budi")];
    // => shared borrow: summary reads while main keeps full ownership
    println!("{}", summary(&roster));
    // => the borrow ended at the semicolon: mutation is legal again here
    promote(&mut roster);
    // => the exclusive borrow ended too: reading resumes below
    println!("{}", summary(&roster));
}
