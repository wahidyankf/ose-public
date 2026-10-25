// Example 27: Use Brings Names Close, Pub Use Re-Exports.
// => `use` shortens paths where they are used: no behavior change.
// => `pub use` re-exports: the outer module publishes an inner name.
// => Readers learn one path; the nesting stays an implementation detail.
mod ledger {
    // => the outer API module readers will import from
    // => the parser submodule stays private: only its product escapes.
    mod parse {
        // => hidden: callers never name this path
        // => `pub(crate)` opens within the crate but not beyond it.
        pub struct Due {
            // => visible to `ledger`, invisible outside
            pub member: String, // => public so the caller below can read each name
            pub amount: i32,    // => amounts stay whole numbers
        }
        // => the parser itself is crate-visible for the re-export below.
        pub fn line(text: &str) -> Option<Due> {
            // => `None` skips bad lines
            let (member, raw) = text.split_once(':')?; // => shape first
            let amount = raw.trim().parse::<i32>().ok()?; // => value second
            Some(Due {
                // => owned name plus amount
                member: member.trim().to_string(), // => caller owns the name
                amount,                            // => shorthand again
            })
        }
    }
    // => the re-export: `ledger::Due` and `ledger::line` are the whole API.
    pub use self::parse::{line, Due}; // => two names escape; the module stays hidden
                                      // => the report helper lives beside the re-export: one home for output.
    pub fn report(dues: &[Due]) -> String {
        // => pure: string in, string out
        let total: i32 = dues.iter().map(|due| due.amount).sum(); // => the total
        format!("lines: {} total: {}", dues.len(), total) // => fixed shape
    }
}
// => `use` shortens the two re-exported names for the whole file below.
use ledger::{line, report}; // => one import line, two short names
fn main() {
    // => fixed lines again: callers use the short re-exported names.
    let lines = ["sari:50", "oops", "budi:75"]; // => raw text, same as before
    let dues: Vec<ledger::Due> = lines // => the type keeps its module path
        .iter() // => stream the raw lines
        .filter_map(|text| line(text)) // => short name from the `use` above
        .collect(); // => two parsed dues
                    // => the names travel with the amounts: read them back in order.
    let names: Vec<&str> = dues.iter().map(|due| due.member.as_str()).collect(); // => both members read
    assert_eq!(names, ["sari", "budi"]); // => the parsed names, in order
    println!("{}", report(&dues)); // => Output: lines: 2 total: 125
}
