// Example 67: Read the Compiler Error.
// => Moved values cannot be used again: ownership left with the move.
// => The error names both sites: the move first, the failed use second.
// => The illustration after the code shows E0382 on the before shape.
// => This file holds the after shape: clone first, then move, then use.
// => Both prints below are fixed: the clone keeps the original alive.
fn main() {
    // => one owned name needed in two places: the classic E0382 setup.
    let member = "sari".to_string(); // => owned text, single owner
                                     // => clone before moving: the duplicate travels, the original stays.
    let receipt = member.clone(); // => explicit cost, visible fix
    let label = format!("member: {}", member); // => the original still lives
                                               // => both names print: the fix kept every use legal.
    println!("{}", label); // => Output: member: sari
    println!("receipt for {}", receipt); // => Output: receipt for sari
}
