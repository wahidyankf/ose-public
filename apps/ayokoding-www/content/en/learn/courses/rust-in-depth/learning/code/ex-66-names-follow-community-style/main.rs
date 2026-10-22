// Example 66: Names Follow Community Style.
// => `snake_case` for functions, variables, and modules: the working vocabulary.
// => `CamelCase` for types, traits, and enums: the nouns of the design.
// => `UPPER_SNAKE_CASE` for constants and statics: fixed values shout once.
// => The compiler's `non_snake_case` warnings enforce this: style is law.
// => Every name below follows its shape: the file reads as one dialect.
const WAIVER_LINE: i32 = 100; // => constant: fixed value, upper snake
struct LedgerDue {
    // => type: CamelCase noun of the design
    member_name: String, // => field: snake like any variable
    amount_due: i32,     // => field: snake like any variable
}
// => functions are snake: the verb phrase of the module.
fn settle_over_waiver(due: &LedgerDue) -> i32 {
    // => reads as a sentence
    if due.amount_due > WAIVER_LINE {
        // => constant compares, fields read
        due.amount_due / 2 // => large dues halve, as the docs promise
    } else {
        due.amount_due // => small dues settle whole
    }
}
fn main() {
    // => two fixed dues exercise both sides of the waiver line.
    let first_due = LedgerDue {
        member_name: "sari".to_string(),
        amount_due: 150,
    }; // => above the line
    let second_due = LedgerDue {
        member_name: "budi".to_string(),
        amount_due: 50,
    }; // => below the line
    println!(
        "{}: {}",
        first_due.member_name,
        settle_over_waiver(&first_due)
    ); // => Output: sari: 75
    println!(
        "{}: {}",
        second_due.member_name,
        settle_over_waiver(&second_due)
    ); // => Output: budi: 50
}
