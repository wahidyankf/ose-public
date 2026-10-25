// Example 4: For with Enumerate and Take.
// => Adapters shape the walk; the loop body only handles one item.
// => No index variable exists to initialize, bound, or increment.
fn main() {
    // => fixed ledger lines: the same input every run, the same output.
    let lines = ["sari:50", "budi:75", "citra:25"]; // => three ledger lines
                                                    // => `enumerate` adds the position; `take(2)` stops after two items.
    for (i, line) in lines.iter().enumerate().take(2) {
        // => i is 0, then 1
        println!("{}: {}", i + 1, line); // => prints numbered lines one by one
    }
    // => the count below is fixed: `take(2)` always yields exactly two.
    println!("shown: {}", lines.iter().take(2).count()); // => Output: shown: 2
}
