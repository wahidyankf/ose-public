// Example 47: Derive Clone, Debug, PartialEq.
// => `#[derive]` generates code: `Clone`, `Debug`, `PartialEq` here.
// => Derived `PartialEq` compares field by field: no hand-written logic.
// => Derived `Clone` duplicates all fields: deep where fields are owned.
// => `{:?}` prints through derived `Debug`: exact shape, no formatting code.
#[derive(Clone, Debug, PartialEq)] // => the three workhorse traits, generated
struct Due {
    // => one parsed ledger line, as owned data
    member: String, // => owned name: cloning duplicates the text
    amount: i32,    // => plain number: copies for free
}
fn main() {
    // => one due exercises all three derived traits in order.
    let first = Due {
        member: "sari".to_string(),
        amount: 50,
    }; // => the original
    let second = first.clone(); // => derived `Clone`: independent duplicate
    println!("{:?}", second); // => Output: Due { member: "sari", amount: 50 }
    println!("equal: {}", first == second); // => Output: equal: true
    println!("same text: {}", first.member == "sari"); // => Output: same text: true
}
