// Example 18: Format Strings Carry Placeholders.
//
// The format mini-language keeps values next to their labels: {name}
// inlines a variable, {value:?} shows its Debug shape, and width and
// precision flags align columns without a single manual pad call.
// => inline captures (Rust 2021) skip the old positional argument list
// => :? is for developers, Display is for users: never mix the two

fn main() {
    // => fixed record: every formatted line below is hand-checkable
    let name = "sari";
    let score = 91u32;
    let ratio = 91.0 / 100.0;
    // => inline capture: the variable name inside braces is the argument
    println!("{name} scored {score}");
    // => width 6 right-aligns the score: columns line up down the page
    println!("{name:>6} | {score:>6}");
    // => .2 precision pins the ratio to two decimals: 0.91 exactly
    println!("{name} ratio: {ratio:.2}");
    // => :? shows the Debug shape of a tuple: developers read structure
    println!("record: {:?}", (name, score));
    // => {:#?} pretty-prints Debug across lines: nested data stays legible
    println!("pretty: {:#?}", [name, "budi"]);
}
