// Example 8: Slices Borrow Views.
//
// A slice is a borrowed window into a Vec, an array, or a string: no
// copy happens, so windows, chunks, and split_at all cost O(1) to form.
// The borrow checker guarantees the owner outlives every window it lends.
// => slicing never allocates: each view is a (pointer, length) pair
// => the owner must stay alive and unmutated while views are in use

fn main() {
    // => a fixed frame of samples: every window below is hand-checkable
    let samples = [2u32, 4, 4, 4, 5, 5, 7, 9];
    // => windows(3) slides a 3-wide view: six windows over eight samples
    for (index, window) in samples.windows(3).enumerate() {
        // => Debug prints each borrowed triple: no allocation per window
        println!("window {index}: {window:?}");
    }
    // => chunks(3) cuts non-overlapping views: 3 + 3 + 2 for eight items
    for (index, chunk) in samples.chunks(3).enumerate() {
        // => the last chunk is short: chunks never pad, they end early
        println!("chunk {index}: {chunk:?}");
    }
    // => split_at divides one borrow into two disjoint views at index 4
    let (head, tail) = samples.split_at(4);
    // => both halves print: the split point is visible in the output
    println!("head: {head:?}");
    println!("tail: {tail:?}");
}
