// Example 63: Clippy Flags the Range Loop.
// => `iter().enumerate()` pairs each item with its index: no arithmetic.
// => A `for i in 0..len` loop that only indexes draws `needless_range_loop`.
// => The illustration after the code shows the lint on the before shape.
// => This file holds the after shape: it compiles warning-free everywhere.
// => The sum below is fixed: positions and values never change.
fn main() {
    // => fixed dues: positions 0, 1, 2 with values 50, 75, 25.
    let dues = [50, 75, 25]; // => the array under iteration
    let mut total = 0; // => the running total, same as always
                       // => `enumerate` carries the index: the range bound cannot drift.
    for (i, due) in dues.iter().enumerate() {
        // => i is 0, 1, 2 in order
        println!("{}: {}", i + 1, due); // => numbered lines, one per due
        total += due; // => the value, not an indexing expression
    }
    println!("total: {}", total); // => Output: total: 150
}
