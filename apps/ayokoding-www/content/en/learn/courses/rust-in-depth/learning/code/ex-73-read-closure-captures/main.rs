// Example 73: Read Closure Captures.
// => LAYER 1, signatures: `check` borrows a line, mutates tally, returns bool.
// => LAYER 2, types: `FnMut(&str) -> bool` borrows mutably, returns verdicts.
// => LAYER 3, control flow: each call parses once and decides once.
// => LAYER 4, data flow: lines in, verdicts out, tally grows on the side.
// => `mut check` is required: calling an `FnMut` closure mutates its capture.
fn main() {
    // => the tally lives outside the closure: captures are the whole lesson.
    let mut tally = 0; // => counts accepted dues across all calls
                       // => the closure borrows `tally` mutably: writes through the capture.
    let mut check = |line: &str| -> bool {
        // => `FnMut`: mutates its environment
        match line.split_once(':') {
            // => the familiar line grammar
            Some((_, raw)) => match raw.trim().parse::<i32>() {
                // => value stage
                Ok(amount) if amount > 0 => {
                    // => positive dues pass
                    tally += amount; // => capture write: visible after the calls
                    true // => accepted: the line settled
                }
                _ => false, // => junk or non-positive: rejected, tally untouched
            },
            None => false, // => shapeless: rejected, tally untouched
        }
    };
    // => three fixed lines: two accepted, one rejected, tally 125.
    println!("sari: {}", check("sari:50")); // => Output: sari: true
    println!("oops: {}", check("oops")); // => Output: oops: false
    println!("budi: {}", check("budi:75")); // => Output: budi: true
    println!("tally: {}", tally); // => Output: tally: 125
}
