// Example 20: Format with Width and Precision.
// => `{:<10}` left-pads to width; `{:.2}` rounds floats to two places.
// => `{:?}` prints the Debug view: quotes and escapes included, always.
// => Verbs compose: `{:<10.2}` would pad a rounded number in one step.
fn main() {
    // => fixed figures: the same table on every run.
    let member = "sari"; // => the name column, padded below
    let share = 33.3333; // => the share column, rounded below
    let dues = [50, 75]; // => the debug column shows the raw shape
                         // => width pads names into a column; precision rounds the share.
    println!("{:<10} {:.2}", member, share); // => Output: sari       33.33
                                             // => `{:?}` shows structure: brackets, commas, and exact values.
    println!("{:?}", dues); // => Output: [50, 75]
                            // => `format!` builds the same verbs into an owned string for later.
    let cell = format!("{:>6}", 150); // => right-align the total in six
    println!("[{}]", cell); // => Output: [   150]
}
