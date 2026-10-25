// Example 78: Read a Module Tree Whole.
// => LAYER 1, signatures: `parse::line` parses, `report` renders, `main` wires.
// => LAYER 2, types: `Due` crosses the module boundary by re-export.
// => LAYER 3, control flow: filter-map collects, report formats, main prints.
// => LAYER 4, data flow: raw lines in, parsed dues through, report string out.
// => The re-export is the map legend: public paths, hidden nests.
mod parse {
    // => the parsing team: one type, one function
    // => `Due` escapes through the re-export below: owned, printable, testable.
    #[derive(Debug)] // => `Debug` lets the report show its work
    pub struct Due {
        // => crate-visible through `super` re-export
        pub member: String, // => owned name outlives the input line
        pub amount: i32,    // => validated whole-number due
    }
    // => the line grammar in one place: colon splits, trim cleans, parse decides.
    pub fn line(text: &str) -> Option<Due> {
        // => `None` skips bad lines
        let (member, raw) = text.split_once(':')?; // => shape check first
        let amount = raw.trim().parse::<i32>().ok()?; // => value check second
        Some(Due {
            member: member.trim().to_string(),
            amount,
        }) // => owned pair out
    }
}
mod render {
    // => the reporting team: pure string building
    use super::parse::Due; // => `super` climbs to the sibling module
                           // => one rendering for any due list: count plus total, fixed shape.
    pub fn report(dues: &[Due]) -> String {
        // => borrows the parsed ledger
        let total: i32 = dues.iter().map(|due| due.amount).sum(); // => the fused total
        format!("lines: {} total: {}", dues.len(), total) // => the fixed report shape
    }
}
// => the legend: two public names, zero visible nests.
pub use parse::{line, Due}; // => `line` and `Due` escape; `parse` stays hidden
fn main() {
    // => three fixed lines wire the whole tree: parse, collect, render, print.
    let dues: Vec<Due> = ["sari:50", "oops", "budi:75"]
        .iter()
        .filter_map(|t| line(t))
        .collect(); // => two survive
    println!("{}", render::report(&dues)); // => Output: lines: 2 total: 125
}
