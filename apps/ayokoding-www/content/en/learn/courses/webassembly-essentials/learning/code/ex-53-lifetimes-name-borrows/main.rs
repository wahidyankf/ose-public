// Example 53: Lifetimes Name Borrows.
//
// A reference is only valid while its owner lives; lifetimes write that
// fact into signatures so the compiler can check it. Most lifetimes are
// elided (one borrow in, the same borrow out), and named lifetimes appear
// exactly where two inputs compete to answer "whose data comes back?".
// => elision covers the common case: one borrow in, the same borrow out
// => named 'a links two inputs to one output: the survivor is named

// longest returns the longer of two borrowed honor rolls, or the first on ties.
// => 'a on both inputs and the output: the result borrows from both
// => the caller sees the deal: keep both rolls alive while using the answer
fn longest<'a>(first: &'a str, second: &'a str) -> &'a str {
    // => length decides, first wins ties: deterministic on equal rolls
    if second.len() > first.len() {
        second
    } else {
        first
    }
}

// first_word borrows one line and returns its first word, elided and clean.
// => elision links input to output: the word borrows from the line given
// => split_whitespace().next() finds the word: None becomes the line itself
fn first_word(line: &str) -> &str {
    // => unwrap_or keeps the borrow: the default IS the input line itself
    line.split_whitespace().next().unwrap_or(line)
}

fn main() {
    // => two rolls, different lengths: the longer one comes back borrowed
    let roll_a = "sari budi";
    let roll_b = "citra dewi eka";
    // => the answer borrows roll_b: both rolls outlive the print below
    println!("longer roll: {}", longest(roll_a, roll_b));
    // => first_word borrows its line: the word prints while lines live
    for line in ["sari 91 pass", "  padded"] {
        println!("{line:?} -> {:?}", first_word(line));
    }
}
