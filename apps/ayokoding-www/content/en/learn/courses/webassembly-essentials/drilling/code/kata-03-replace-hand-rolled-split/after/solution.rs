// Kata 3 solution: the standard library splits, the hand loop retires.
//
// split_whitespace handles every case the hand loop fumbled: trailing
// words flush, runs of spaces collapse, tabs split, and leading space
// vanishes. Fifteen lines of index bookkeeping become one iterator chain.
// => split_whitespace is the whole splitter: no buffer, no flush, no bug
// => tabs split too: the stdlib knows whitespace the hand loop never met

// words splits a line with the standard library: the entire splitter.
// => split_whitespace yields &str borrows: map owns them into Strings
// => runs collapse, tails flush, tabs split: the stdlib handles all three
fn words(line: &str) -> Vec<String> {
    line.split_whitespace().map(String::from).collect()
}

fn main() {
    // => all three words print: the tail survives, the run collapses
    println!("{:?}", words("wasm  runs fast"));
    // => tabs split as well: the hand loop pushed them into words
    println!("{:?}", words("sandboxed\tfast"));
}
