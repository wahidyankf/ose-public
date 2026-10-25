// Example 8: Iterator Adapters Beat Indexing.
// => Adapters compose: each stage transforms the stream for the next.
// => No index, no accumulator variable, no bounds to get wrong.
fn main() {
    // => raw ledger lines: two valid dues and one malformed line to skip.
    let lines = ["sari:50", "oops", "budi:75"]; // => fixed input, fixed output
                                                // => the pipeline reads as the plan: split, parse, keep, total.
    let total: i32 = lines // => borrow the array; nothing is copied yet
        .iter() // => stream the three lines in order
        .filter_map(|line| line.split(':').nth(1)) // => keep lines with amounts
        .filter_map(|num| num.parse::<i32>().ok()) // => keep amounts that parse
        .sum(); // => add the survivors: 50 + 75
                // => the total below is fixed: the same lines always total 125.
    println!("total: {}", total); // => Output: total: 125
}
