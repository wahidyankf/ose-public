// Example 50: Lifetimes Pick the Longest.
// => Lifetimes name how long borrows live: the compiler checks the claim.
// => `'a` on both inputs and the output says the answer borrows from them.
// => The caller below keeps both inputs alive, so the borrow is legal.
// => Returning borrowed data avoids copying: the winner is never duplicated.
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    // => one lifetime, shared
    if a.len() >= b.len() {
        // => ties prefer the first name: fixed rule
        a // => borrows from the inputs, valid for lifetime `'a`
    } else {
        b // => borrows from the inputs, valid for lifetime `'a`
    }
}
fn main() {
    // => both names outlive the call, so the returned borrow stays valid.
    let first = "bendahara"; // => nine characters, lives through `main`
    let second = "sari"; // => four characters, lives through `main`
    println!("longest: {}", longest(first, second)); // => Output: longest: bendahara
    println!("shortest: {}", longest(second, "cit")); // => Output: shortest: sari
}
