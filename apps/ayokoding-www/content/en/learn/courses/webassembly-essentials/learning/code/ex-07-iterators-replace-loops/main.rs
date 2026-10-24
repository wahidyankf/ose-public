// Example 7: Iterators Replace Loops.
//
// A filter-map-take chain names the transformation while a hand loop names
// the machinery; the chain version cannot miscount because there is no
// counter to get wrong, and lazy adapters fuse the passes with no vector.
// => adapters compose; terminals execute: no terminal, no work happens
// => take caps the pull: the pipeline stops after enough answers arrive

fn main() {
    // => fixed scores: every number below is checkable by hand
    let scores = [55u32, 91, 48, 77, 88, 62, 95, 30];
    // => filter keeps passes, map lifts each by a 5-point curve, take(3)
    // => caps the honors list: the chain reads like its own specification
    let honors: Vec<u32> = scores
        .iter()
        .filter(|score| **score >= 60)
        .map(|score| *score + 5)
        .take(3)
        .collect();
    // => Debug prints the whole Vec: the three honored scores in order
    println!("honored: {honors:?}");
    // => sum is the terminal reduction: no accumulator variable exists
    let pass_total: u32 = scores.iter().filter(|score| **score >= 60).sum();
    // => five scores pass (91+77+88+62+95); the sum is fixed arithmetic
    println!("pass total: {pass_total}");
    // => count is another terminal: it consumes the pipeline in one word
    let distinction = scores.iter().filter(|score| **score >= 85).count();
    // => 91, 88, and 95 clear 85, so the count is always 3
    println!("distinctions: {distinction}");
}
