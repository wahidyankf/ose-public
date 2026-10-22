// Example 26: Inline Modules Organize Code.
// => `mod` groups related items: parsing lives apart from totaling.
// => `pub` opens an item to the parent; private items stay hidden.
// => `main` below reads as the wiring: parse, then total, then print.
mod parse {
    // => the line-grammar module owns splitting and parsing
    // => `pub` exposes the pair type: callers name it in signatures.
    #[derive(Debug, PartialEq)] // => `Debug` prints, `PartialEq` compares
    pub struct Due {
        // => one parsed ledger line
        pub member: String, // => `pub` fields: the totals module reads them
        pub amount: i32,    // => dues stay whole numbers in this ledger
    }
    // => `pub` opens the parser: `main` calls it, nobody else needs to.
    pub fn line(text: &str) -> Option<Due> {
        // => `None` skips bad lines
        let (member, raw) = text.split_once(':')?; // => shape check first
        let amount = raw.trim().parse::<i32>().ok()?; // => value check second
        Some(Due {
            // => both halves survived: build the pair
            member: member.trim().to_string(), // => owned name for the totals
            amount,                            // => shorthand: field and variable share the name
        })
    }
}
mod totals {
    // => the arithmetic module owns summing, nothing else
    use super::parse::Due; // => `super` climbs one level to the sibling
                           // => `pub` opens the total: `main` prints it, the module computes it.
    pub fn sum(dues: &[Due]) -> i32 {
        // => borrows the parsed lines
        dues.iter().map(|due| due.amount).sum() // => amounts in, total out
    }
}
fn main() {
    // => fixed lines: two parse and one is skipped, every run.
    let lines = ["sari:50", "oops", "budi:75"]; // => the raw ledger text
                                                // => parse first, skipping failures: the modules enforce the order.
    let dues: Vec<parse::Due> = lines // => paths name the owning module
        .iter() // => stream the raw lines
        .filter_map(|text| parse::line(text)) // => keep only what parses
        .collect(); // => the clean ledger both modules share
    println!("parsed: {}", dues.len()); // => Output: parsed: 2
    println!("total: {}", totals::sum(&dues)); // => Output: total: 125
}
