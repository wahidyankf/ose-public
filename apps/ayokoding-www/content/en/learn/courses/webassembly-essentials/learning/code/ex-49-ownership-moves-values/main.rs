// Example 49: Ownership Moves Values.
//
// Every value has one owner; assignment moves it, and the old name dies.
// Moves are free (a pointer copy under the hood), so "move, don't clone"
// is the default: Clone appears only where sharing is genuinely needed.
// The compiler rejects use-after-move, turning dangling pointers into a
// compile error instead of a production incident.
// => move by default: assignment transfers, the source name retires
// => Clone is explicit: the call site shows where sharing costs

// tag appends a suffix to an owned label and hands the new String back.
// => String by value: the caller gives the string up, gets one back
// => push_str mutates the owned string: no clone, no second buffer
fn tag(mut label: String) -> String {
    // => the suffix marks the graded copy: originals keep their own names
    label.push_str("-graded");
    label
}

fn main() {
    // => roster owns its names: the Vec below lends them out read-only
    let roster = vec![String::from("sari"), String::from("budi")];
    // => first borrows index 0: the Vec keeps ownership, main keeps roster
    let first = &roster[0];
    // => the borrow prints through the reference: no move, no clone involved
    println!("first: {first}");
    // => tag takes ownership: a clone feeds the move, roster stays whole
    let tagged = tag(roster[1].clone());
    // => the tagged copy prints: roster[1] itself never moved away
    println!("tagged: {tagged}");
    // => roster still owns both names: the clone above preserved the Vec
    println!("roster intact: {roster:?}");
    // => moving the Vec retires the name: roster cannot print below this
    let moved = roster;
    // => moved owns the names now: the transcript shows the transfer worked
    println!("moved: {moved:?}");
}
