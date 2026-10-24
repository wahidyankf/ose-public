// Example 75: Read a Builder Chain.
// => LAYER 1, signatures: each stage takes `self` and returns `Self`.
// => LAYER 2, types: `Report` accumulates lines; `Built` is the finished value.
// => LAYER 3, control flow: the chain reads top to bottom, no branches.
// => LAYER 4, data flow: empty builder in, lines appended, report out.
// => `mut self` stages mutate in place: the chain owns the value throughout.
#[derive(Debug)] // => the finished report prints for the transcript
struct Built {
    // => the validated, printable settlement report
    lines: Vec<String>, // => one string per settled line
    total: i32,         // => the summed total across all lines
}
struct Report {
    // => the in-progress builder: lines accumulate here
    lines: Vec<String>, // => settled lines so far
    total: i32,         // => running total so far
}
impl Report {
    // => the staging methods, one per configuration step
    // => `new` starts empty: every chain begins from the same place.
    fn new() -> Report {
        // => no arguments: nothing to configure yet
        Report {
            lines: Vec::new(),
            total: 0,
        } // => empty lines, zero total
    }
    // => each stage consumes `self` and returns it: chaining never breaks.
    fn due(mut self, member: &str, amount: i32) -> Report {
        // => one settled line
        self.lines.push(format!("{}: {}", member, amount)); // => the line joins
        self.total += amount; // => the total grows with the lines
        self // => hand the builder to the next stage
    }
    // => `build` freezes the accumulation into the printable report.
    fn build(self) -> Built {
        // => consumes the builder: no reuse after
        Built {
            lines: self.lines,
            total: self.total,
        } // => move the parts over
    }
}
fn main() {
    // => the chain reads as the report: two dues, then the finished value.
    let report = Report::new().due("sari", 50).due("budi", 75).build(); // => staged, then frozen
                                                                        // => the finished value is read field by field: no dead data.
    assert_eq!(report.lines, ["sari: 50", "budi: 75"]); // => the staged lines, in order
    assert_eq!(report.total, 125); // => the summed total
    println!("{:?}", report); // => Output: Built { lines: ["sari: 50", "budi: 75"], total: 125 }
}
